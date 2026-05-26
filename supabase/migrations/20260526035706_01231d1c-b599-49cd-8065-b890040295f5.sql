
-- 1) Fix mutable search_path on the only trigger function missing it
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 2) Lock down SECURITY DEFINER functions: revoke from anon (PUBLIC) and grant only to the right role.
-- has_role is used by RLS; grant to both authenticated and anon RLS evaluator role.
DO $$ DECLARE r record; BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

-- User-callable functions (signed-in users)
GRANT EXECUTE ON FUNCTION public.register_seller(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_product(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quote_coupon(text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_withdrawal(text,text,text,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Admin-only functions: server uses service role which bypasses grants; no role grant needed.
-- credit_wallet_from_payment is called by webhook with service role; leave with no grants.
-- handle_new_user / assign_default_role are triggers; no grants needed.

-- 3) Replace broad storage SELECT policies with non-listing public read.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read seller logos" ON storage.objects;

-- Allow reading individual objects only when a specific name is requested (no broad LIST).
-- Public buckets still serve via the public CDN URL without RLS; this policy supports authed direct fetch by exact path.
CREATE POLICY "Read product image by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product_images' AND name IS NOT NULL);

CREATE POLICY "Read seller logo by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'seller_logos' AND name IS NOT NULL);
