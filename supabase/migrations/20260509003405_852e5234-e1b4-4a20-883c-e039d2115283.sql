-- Fix Orders INSERT policy
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (status = 'novo' AND total >= 0);

-- Fix Order Items INSERT policy
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
CREATE POLICY "Public can insert order items" 
ON public.order_items 
FOR INSERT 
TO public
WITH CHECK (quantity > 0 AND price >= 0);

-- Fix Storage SELECT policies to prevent listing
DROP POLICY IF EXISTS "Public menu images access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Fix Security Definer functions permissions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.set_random_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_random_order_number() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.generate_unique_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_unique_order_number() TO anon, authenticated;
