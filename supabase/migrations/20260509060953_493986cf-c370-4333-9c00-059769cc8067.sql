
-- Drop function + view together to clear the dependency
DROP FUNCTION IF EXISTS public.get_public_store_settings();
DROP VIEW IF EXISTS public.store_settings_public;

-- Recreate view with security_invoker so it does not bypass RLS
CREATE VIEW public.store_settings_public
WITH (security_invoker = true)
AS
SELECT id, store_name, phone, address, hours, business_hours, is_open,
       min_order, delivery_fee, updated_at, latitude, longitude,
       estimated_delivery_time, order_prep_time_multiplier
FROM public.store_settings;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;

-- Public RLS policy: allow reading store_settings rows; sensitive columns
-- (pix_key, pix_qr_code_url) are excluded by revoking column privileges below.
DROP POLICY IF EXISTS "Public can only read via public view" ON public.store_settings;
DROP POLICY IF EXISTS "Public can read non-sensitive store settings" ON public.store_settings;
CREATE POLICY "Public can read non-sensitive store settings"
ON public.store_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Column-level protection: anon/authenticated cannot read pix fields directly
REVOKE SELECT ON public.store_settings FROM anon, authenticated;
GRANT SELECT (id, store_name, phone, address, hours, business_hours, is_open,
              min_order, delivery_fee, updated_at, latitude, longitude,
              estimated_delivery_time, order_prep_time_multiplier)
ON public.store_settings TO anon, authenticated;

-- Recreate helper returning the view's row type
CREATE OR REPLACE FUNCTION public.get_public_store_settings()
RETURNS SETOF public.store_settings_public
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.store_settings_public LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_store_settings() TO anon, authenticated;
