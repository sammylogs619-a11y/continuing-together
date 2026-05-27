
-- 1. Track payment purpose so the webhook routes confirmations correctly
ALTER TABLE public.payment_intents
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'wallet_funding'
  CHECK (purpose IN ('wallet_funding', 'seller_registration'));

-- 2. Track seller registration payment on the sellers row
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS paid_registration_at timestamptz,
  ADD COLUMN IF NOT EXISTS registration_payment_ref text;

-- 3. Constant for the fee (kept in a tiny settings table for future tweakability)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins write settings" ON public.app_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.app_settings(key, value)
VALUES ('seller_registration_fee_ngn', '3000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Create a pending payment intent for the seller registration fee
CREATE OR REPLACE FUNCTION public.create_seller_registration_intent(
  _reference text, _checkout_url text, _external_id text, _raw jsonb
) RETURNS public.payment_intents
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _fee numeric;
  _row public.payment_intents;
  _existing public.sellers;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Already paid? Bail out.
  SELECT * INTO _existing FROM public.sellers WHERE id = _uid;
  IF FOUND AND _existing.paid_registration_at IS NOT NULL THEN
    RAISE EXCEPTION 'Registration fee already paid';
  END IF;

  SELECT (value)::numeric INTO _fee FROM public.app_settings WHERE key = 'seller_registration_fee_ngn';
  IF _fee IS NULL THEN _fee := 3000; END IF;

  INSERT INTO public.payment_intents(
    user_id, provider, provider_reference, external_id,
    amount_paid, credit_amount, currency, purpose, checkout_url, raw_payload
  ) VALUES (
    _uid, 'nowpayments', _reference, _external_id,
    _fee, _fee, 'NGN', 'seller_registration', _checkout_url, _raw
  ) RETURNING * INTO _row;

  RETURN _row;
END $$;

-- 5. Confirm a seller registration payment (called by webhook via service role)
CREATE OR REPLACE FUNCTION public.confirm_seller_registration_payment(
  _provider_reference text, _external_id text, _raw jsonb
) RETURNS public.sellers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _intent public.payment_intents;
  _seller public.sellers;
BEGIN
  SELECT * INTO _intent FROM public.payment_intents
    WHERE provider = 'nowpayments' AND provider_reference = _provider_reference
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment reference'; END IF;
  IF _intent.purpose <> 'seller_registration' THEN
    RAISE EXCEPTION 'Wrong intent purpose';
  END IF;
  IF _intent.status = 'paid' THEN
    SELECT * INTO _seller FROM public.sellers WHERE id = _intent.user_id;
    RETURN _seller;
  END IF;

  -- Upsert seller row with paid status, default to 'pending' for admin review
  INSERT INTO public.sellers(id, business_name, status, paid_registration_at, registration_payment_ref)
  VALUES (
    _intent.user_id,
    (SELECT COALESCE(username, 'Seller ' || substring(_intent.user_id::text, 1, 6)) FROM public.profiles WHERE id = _intent.user_id),
    'pending'::seller_status,
    now(),
    _provider_reference
  )
  ON CONFLICT (id) DO UPDATE
    SET paid_registration_at = COALESCE(public.sellers.paid_registration_at, now()),
        registration_payment_ref = COALESCE(public.sellers.registration_payment_ref, _provider_reference),
        status = CASE WHEN public.sellers.status = 'declined' THEN 'pending'::seller_status ELSE public.sellers.status END,
        updated_at = now()
  RETURNING * INTO _seller;

  UPDATE public.payment_intents
    SET status = 'paid', external_id = COALESCE(_external_id, external_id),
        raw_payload = _raw, paid_at = now(), updated_at = now()
    WHERE id = _intent.id;

  RETURN _seller;
END $$;

-- 6. Update register_seller to require a paid registration fee
CREATE OR REPLACE FUNCTION public.register_seller(_business_name text, _business_description text, _logo_url text)
RETURNS public.sellers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _row public.sellers; _existing public.sellers;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF length(trim(coalesce(_business_name,''))) < 2 THEN RAISE EXCEPTION 'Business name required'; END IF;

  SELECT * INTO _existing FROM public.sellers WHERE id = _uid;
  IF NOT FOUND OR _existing.paid_registration_at IS NULL THEN
    RAISE EXCEPTION 'Seller registration fee not paid';
  END IF;

  UPDATE public.sellers SET
    business_name = trim(_business_name),
    business_description = nullif(trim(coalesce(_business_description,'')),''),
    logo_url = COALESCE(nullif(_logo_url,''), logo_url),
    status = CASE WHEN status = 'declined' THEN 'pending'::seller_status ELSE status END,
    updated_at = now()
    WHERE id = _uid
    RETURNING * INTO _row;
  RETURN _row;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_seller_registration_intent(text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_seller_registration_payment(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_seller_registration_intent(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_seller_registration_payment(text, text, jsonb) TO service_role;
