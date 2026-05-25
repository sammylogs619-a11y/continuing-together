CREATE TYPE public.seller_status AS ENUM ('pending','active','suspended');

CREATE TABLE public.sellers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_description text,
  logo_url text,
  balance numeric NOT NULL DEFAULT 0,
  status seller_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active sellers" ON public.sellers FOR SELECT TO public USING (status = 'active' OR auth.uid() = id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner updates own seller" ON public.sellers FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins manage sellers" ON public.sellers FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

ALTER TABLE public.products ADD COLUMN seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE;
CREATE INDEX idx_products_seller ON public.products(seller_id);

CREATE POLICY "Sellers manage own products" ON public.products FOR ALL TO authenticated
  USING (seller_id IS NOT NULL AND seller_id = auth.uid())
  WITH CHECK (seller_id IS NOT NULL AND seller_id = auth.uid());

CREATE POLICY "Sellers manage own product logins" ON public.product_logins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_logins.product_id AND p.seller_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_logins.product_id AND p.seller_id = auth.uid()));

CREATE TYPE public.seller_tx_type AS ENUM ('sale','withdrawal_hold','withdrawal_refund','withdrawal_paid','admin_adjustment');
CREATE TABLE public.seller_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  type seller_tx_type NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers view own tx" ON public.seller_transactions FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins view all seller tx" ON public.seller_transactions FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','rejected','paid');
CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins manage withdrawals" ON public.withdrawal_requests FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO storage.buckets (id,name,public) VALUES ('seller_logos','seller_logos',true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read seller logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'seller_logos');
CREATE POLICY "Authenticated upload own seller logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='seller_logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Authenticated update own seller logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='seller_logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE OR REPLACE FUNCTION public.register_seller(_business_name text, _business_description text, _logo_url text)
RETURNS public.sellers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.sellers;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(trim(coalesce(_business_name,''))) < 2 THEN RAISE EXCEPTION 'Business name required'; END IF;
  INSERT INTO public.sellers(id, business_name, business_description, logo_url, status)
  VALUES (_uid, trim(_business_name), nullif(trim(coalesce(_business_description,'')),''), nullif(_logo_url,''), 'active')
  ON CONFLICT (id) DO UPDATE SET business_name = EXCLUDED.business_name,
    business_description = EXCLUDED.business_description,
    logo_url = COALESCE(EXCLUDED.logo_url, public.sellers.logo_url), updated_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.purchase_product(_product_id uuid, _coupon_code text DEFAULT NULL)
RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _prod public.products; _login public.product_logins; _profile public.profiles;
  _seller public.sellers; _order public.orders; _price numeric; _discount numeric := 0; _coupon_id uuid; _quote jsonb;
  _new_balance numeric; _seller_new_balance numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _profile FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile missing'; END IF;
  IF _profile.is_suspended THEN RAISE EXCEPTION 'Account suspended'; END IF;
  SELECT * INTO _prod FROM public.products WHERE id = _product_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not available'; END IF;
  IF _prod.seller_id IS NOT NULL THEN
    SELECT * INTO _seller FROM public.sellers WHERE id = _prod.seller_id FOR UPDATE;
    IF NOT FOUND OR _seller.status <> 'active' THEN RAISE EXCEPTION 'Seller unavailable'; END IF;
  END IF;
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
  UPDATE public.product_logins SET status='sold', sold_to=_uid, sold_at=now() WHERE id = _login.id;
  INSERT INTO public.orders(user_id, product_id, product_name, price, delivered_credential, delivered_password, delivered_notes, login_id)
  VALUES (_uid, _prod.id, _prod.name, _price, _login.credential, _login.password, _login.notes, _login.id) RETURNING * INTO _order;
  INSERT INTO public.wallet_transactions(user_id,type,amount,balance_after,description,reference_id,metadata)
  VALUES (_uid,'purchase',-_price,_new_balance,_prod.name,_order.id, jsonb_build_object('product_id',_prod.id,'discount',_discount,'seller_id',_prod.seller_id));
  IF _prod.seller_id IS NOT NULL THEN
    UPDATE public.sellers SET balance = balance + _price, updated_at = now() WHERE id = _prod.seller_id RETURNING balance INTO _seller_new_balance;
    INSERT INTO public.seller_transactions(seller_id,type,amount,balance_after,description,reference_id,metadata)
    VALUES (_prod.seller_id,'sale',_price,_seller_new_balance,_prod.name,_order.id, jsonb_build_object('buyer_id',_uid,'product_id',_prod.id));
  END IF;
  IF _coupon_id IS NOT NULL THEN
    INSERT INTO public.coupon_redemptions(coupon_id,user_id,context,reference_id,amount_discounted)
    VALUES (_coupon_id,_uid,'purchase',_order.id,_discount);
    UPDATE public.coupons SET uses_count = uses_count + 1 WHERE id = _coupon_id;
  END IF;
  RETURN _order;
END $$;

CREATE OR REPLACE FUNCTION public.request_withdrawal(_bank_name text,_account_number text,_account_name text,_amount numeric)
RETURNS public.withdrawal_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _seller public.sellers; _new_balance numeric; _req public.withdrawal_requests;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT * INTO _seller FROM public.sellers WHERE id = _uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not a seller'; END IF;
  IF _seller.status <> 'active' THEN RAISE EXCEPTION 'Seller not active'; END IF;
  IF _seller.balance < _amount THEN RAISE EXCEPTION 'Withdrawal exceeds balance'; END IF;
  UPDATE public.sellers SET balance = balance - _amount, updated_at = now() WHERE id = _uid RETURNING balance INTO _new_balance;
  INSERT INTO public.withdrawal_requests(seller_id,bank_name,account_number,account_name,amount)
  VALUES (_uid,trim(_bank_name),trim(_account_number),trim(_account_name),_amount) RETURNING * INTO _req;
  INSERT INTO public.seller_transactions(seller_id,type,amount,balance_after,description,reference_id)
  VALUES (_uid,'withdrawal_hold',-_amount,_new_balance,'Withdrawal request',_req.id);
  RETURN _req;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_status(_id uuid, _status withdrawal_status, _note text DEFAULT NULL)
RETURNS public.withdrawal_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _req public.withdrawal_requests; _new_balance numeric;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO _req FROM public.withdrawal_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF _req.status IN ('rejected','paid') THEN RAISE EXCEPTION 'Already finalized'; END IF;
  IF _status = 'rejected' AND _req.status <> 'rejected' THEN
    UPDATE public.sellers SET balance = balance + _req.amount, updated_at = now() WHERE id = _req.seller_id RETURNING balance INTO _new_balance;
    INSERT INTO public.seller_transactions(seller_id,type,amount,balance_after,description,reference_id)
    VALUES (_req.seller_id,'withdrawal_refund',_req.amount,_new_balance,'Withdrawal rejected',_req.id);
  ELSIF _status = 'paid' THEN
    INSERT INTO public.seller_transactions(seller_id,type,amount,balance_after,description,reference_id)
    VALUES (_req.seller_id,'withdrawal_paid',0,(SELECT balance FROM public.sellers WHERE id = _req.seller_id),'Withdrawal paid out',_req.id);
  END IF;
  UPDATE public.withdrawal_requests SET status = _status, admin_note = COALESCE(_note,admin_note), updated_at = now() WHERE id = _id RETURNING * INTO _req;
  RETURN _req;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_sellers_updated BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_withdrawal_updated BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Update assign_default_role: special admin email always becomes admin
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int;
BEGIN
  IF lower(coalesce(NEW.email,'')) = '1sammystore1@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;
  SELECT count(*) INTO _count FROM public.user_roles;
  IF _count = 0 THEN INSERT INTO public.user_roles(user_id,role) VALUES (NEW.id,'admin');
  ELSE INSERT INTO public.user_roles(user_id,role) VALUES (NEW.id,'user'); END IF;
  RETURN NEW;
END $$;