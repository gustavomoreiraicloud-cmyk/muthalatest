-- Fix search_path for check_rate_limit
ALTER FUNCTION public.check_rate_limit(uuid, text, integer, interval) SET search_path TO 'public';

-- Restrict execution permissions for security definer functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid, integer) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_order_status(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_status(integer, text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.lookup_order_status_v2(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_status_v2(integer, text) TO anon, authenticated;

-- Ensure get_public_store_settings is secure
CREATE OR REPLACE FUNCTION public.get_public_store_settings()
 RETURNS SETOF public.store_settings_public
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM public.store_settings_public LIMIT 1;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_public_store_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_settings() TO anon, authenticated;