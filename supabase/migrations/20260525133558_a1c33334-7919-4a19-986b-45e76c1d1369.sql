-- Suspension fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_reason text;

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Coupons
CREATE TYPE public.coupon_kind AS ENUM ('percent', 'fixed');
CREATE TYPE public.coupon_scope AS ENUM ('funding', 'purchase', 'both');

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind public.coupon_kind NOT NULL,
  value numeric NOT NULL CHECK (value > 0),
  scope public.coupon_scope NOT NULL DEFAULT 'both',
  max_uses integer,
  per_user_limit integer NOT NULL DEFAULT 1,
  min_amount numeric NOT NULL DEFAULT 0,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read active coupons by code" ON public.coupons FOR SELECT TO authenticated USING (is_active = true);

CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  context text NOT NULL,
  reference_id uuid,
  amount_discounted numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id, coupon_id);

-- Wallet transactions
CREATE TYPE public.wallet_tx_type AS ENUM ('funding','purchase','admin_credit','admin_debit','refund','coupon_bonus');

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.wallet_tx_type NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet tx" ON public.wallet_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallet tx" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_wallet_tx_user ON public.wallet_transactions(user_id, created_at DESC);

-- Payment intents
CREATE TYPE public.payment_provider AS ENUM ('monnify','binance_pay');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','expired','cancelled');

CREATE TABLE public.payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider public.payment_provider NOT NULL,
  provider_reference text NOT NULL,
  external_id text,
  amount_paid numeric NOT NULL,
  credit_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  coupon_id uuid REFERENCES public.coupons(id),
  status public.payment_status NOT NULL DEFAULT 'pending',
  checkout_url text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (provider, provider_reference)
);
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own intents" ON public.payment_intents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage intents" ON public.payment_intents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_payment_intents_user ON public.payment_intents(user_id, created_at DESC);

-- quote_coupon RPC
CREATE OR REPLACE FUNCTION public.quote_coupon(_code text, _amount numeric, _context text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _c public.coupons; _used_by_user int; _discount numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _context NOT IN ('funding','purchase') THEN RAISE EXCEPTION 'Invalid context'; END IF;
  SELECT * INTO _c FROM public.coupons WHERE code = upper(_code) AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid coupon'; END IF;
  IF _c.expires_at IS NOT NULL AND _c.expires_at < now() THEN RAISE EXCEPTION 'Coupon expired'; END IF;
  IF _c.scope <> 'both' AND _c.scope::text <> _context THEN RAISE EXCEPTION 'Coupon not valid for this purpose'; END IF;
  IF _c.max_uses IS NOT NULL AND _c.uses_count >= _c.max_uses THEN RAISE EXCEPTION 'Coupon fully used'; END IF;
  IF _amount < _c.min_amount THEN RAISE EXCEPTION 'Amount below coupon minimum'; END IF;
  SELECT count(*) INTO _used_by_user FROM public.coupon_redemptions WHERE coupon_id = _c.id AND user_id = _uid;
  IF _used_by_user >= _c.per_user_limit THEN RAISE EXCEPTION 'Coupon already used'; END IF;
  IF _c.kind = 'percent' THEN _discount := round(_amount * (_c.value / 100.0), 2); ELSE _discount := least(_c.value, _amount); END IF;
  RETURN jsonb_build_object('coupon_id', _c.id, 'code', _c.code, 'kind', _c.kind, 'value', _c.value, 'discount', _discount);
END; $$;

-- credit_wallet_from_payment
CREATE OR REPLACE FUNCTION public.credit_wallet_from_payment(_provider public.payment_provider, _provider_reference text, _external_id text, _raw jsonb)
RETURNS public.payment_intents LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _intent public.payment_intents; _new_balance numeric;
BEGIN
  SELECT * INTO _intent FROM public.payment_intents WHERE provider = _provider AND provider_reference = _provider_reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment reference'; END IF;
  IF _intent.status = 'paid' THEN RETURN _intent; END IF;
  UPDATE public.profiles SET balance = balance + _intent.credit_amount, updated_at = now() WHERE id = _intent.user_id RETURNING balance INTO _new_balance;
  INSERT INTO public.wallet_transactions(user_id, type, amount, balance_after, description, reference_id, metadata)
  VALUES (_intent.user_id, 'funding', _intent.credit_amount, _new_balance, format('%s funding', _provider), _intent.id,
          jsonb_build_object('provider', _provider, 'provider_reference', _provider_reference));
  IF _intent.coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions(coupon_id, user_id, context, reference_id, amount_discounted)
    VALUES (_intent.coupon_id, _intent.user_id, 'funding', _intent.id, _intent.credit_amount - _intent.amount_paid);
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = _intent.coupon_id;
  END IF;
  UPDATE public.payment_intents SET status = 'paid', external_id = COALESCE(_external_id, external_id), raw_payload = _raw, paid_at = now(), updated_at = now()
    WHERE id = _intent.id RETURNING * INTO _intent;
  RETURN _intent;
END; $$;

-- admin_adjust_wallet
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id uuid, _amount numeric, _description text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _amount = 0 THEN RAISE EXCEPTION 'Amount required'; END IF;
  UPDATE public.profiles SET balance = balance + _amount, updated_at = now() WHERE id = _user_id RETURNING balance INTO _new_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Resulting balance would be negative'; END IF;
  INSERT INTO public.wallet_transactions(user_id, type, amount, balance_after, description, metadata)
  VALUES (_user_id, CASE WHEN _amount > 0 THEN 'admin_credit'::wallet_tx_type ELSE 'admin_debit'::wallet_tx_type END,
          _amount, _new_balance, COALESCE(_description,'Manual adjustment'), jsonb_build_object('admin_id', auth.uid()));
  RETURN _new_balance;
END; $$;

-- set_user_suspended
CREATE OR REPLACE FUNCTION public.set_user_suspended(_user_id uuid, _suspended boolean, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE public.profiles SET is_suspended = _suspended,
    suspended_reason = CASE WHEN _suspended THEN _reason ELSE NULL END, updated_at = now()
    WHERE id = _user_id;
END; $$;

-- Updated purchase_product with suspension + coupon
CREATE OR REPLACE FUNCTION public.purchase_product(_product_id uuid, _coupon_code text DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _prod public.products; _login public.product_logins; _profile public.profiles;
  _order public.orders; _price numeric; _discount numeric := 0; _coupon_id uuid; _quote jsonb; _new_balance numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF _profile.is_suspended THEN RAISE EXCEPTION 'Account suspended'; END IF;
  SELECT * INTO _prod FROM public.products WHERE id = _product_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not available'; END IF;
  _price := _prod.price;
  IF _coupon_code IS NOT NULL AND length(trim(_coupon_code)) > 0 THEN
    _quote := public.quote_coupon(_coupon_code, _price, 'purchase');
    _discount := (_quote->>'discount')::numeric;
    _coupon_id := (_quote->>'coupon_id')::uuid;
    _price := greatest(_price - _discount, 0);
  END IF;
  SELECT * INTO _login FROM public.product_logins WHERE product_id = _product_id AND status = 'available' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Out of stock'; END IF;
  IF _profile.balance < _price THEN RAISE EXCEPTION 'Insufficient wallet balance'; END IF;
  UPDATE public.profiles SET balance = balance - _price, updated_at = now() WHERE id = _uid RETURNING balance INTO _new_balance;
  UPDATE public.product_logins SET status = 'sold', sold_to = _uid, sold_at = now() WHERE id = _login.id;
  INSERT INTO public.orders (user_id, product_id, product_name, price, delivered_credential, delivered_password, delivered_notes, login_id)
  VALUES (_uid, _prod.id, _prod.name, _price, _login.credential, _login.password, _login.notes, _login.id) RETURNING * INTO _order;
  INSERT INTO public.wallet_transactions(user_id, type, amount, balance_after, description, reference_id, metadata)
  VALUES (_uid, 'purchase', -_price, _new_balance, _prod.name, _order.id, jsonb_build_object('product_id', _prod.id, 'discount', _discount));
  IF _coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions(coupon_id, user_id, context, reference_id, amount_discounted)
    VALUES (_coupon_id, _uid, 'purchase', _order.id, _discount);
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = _coupon_id;
  END IF;
  RETURN _order;
END; $$;