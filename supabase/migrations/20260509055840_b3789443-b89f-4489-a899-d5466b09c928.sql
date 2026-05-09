-- Create a security definer function to get public settings safely
CREATE OR REPLACE FUNCTION public.get_public_store_settings()
RETURNS SETOF public.store_settings_public
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.store_settings_public LIMIT 1;
$$;

-- Revoke all on the function and grant to anon/authenticated
REVOKE ALL ON FUNCTION public.get_public_store_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_settings() TO anon, authenticated, service_role;