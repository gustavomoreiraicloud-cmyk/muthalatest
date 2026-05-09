-- Recreate dependent policies to use app_role overload, then drop text overload
DROP POLICY IF EXISTS "Admin manage delivery ranges" ON public.delivery_ranges;
CREATE POLICY "Admin manage delivery ranges"
ON public.delivery_ranges FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items"
ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders
  WHERE orders.id = order_items.order_id
  AND (auth.uid() = orders.user_id OR public.has_role(auth.uid(), 'admin'::app_role))
));

-- Now safe to drop the duplicate function
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_random_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number < 1000 THEN
        NEW.order_number := public.generate_unique_order_number();
    END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_unique_order_number()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
    new_code INTEGER;
    exists_already BOOLEAN;
BEGIN
    LOOP
        new_code := floor(random() * 9000 + 1000)::INTEGER;
        SELECT EXISTS (
            SELECT 1 FROM public.orders 
            WHERE order_number = new_code 
            AND created_at > now() - interval '24 hours'
        ) INTO exists_already;
        EXIT WHEN NOT exists_already;
    END LOOP;
    RETURN new_code;
END;
$function$;

-- Restrict products storage bucket
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;

CREATE POLICY "Admin upload products"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update products"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete products"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Restrict coupons: drop public read, add secure validate_coupon RPC
DROP POLICY IF EXISTS "Public read coupons" ON public.coupons;

CREATE POLICY "Admins read coupons"
ON public.coupons FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text)
RETURNS TABLE (
  code text,
  discount_type text,
  discount_value numeric,
  min_order numeric,
  expires_at timestamptz,
  active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.code, c.discount_type, c.discount_value, c.min_order, c.expires_at, c.active
  FROM public.coupons c
  WHERE upper(c.code) = upper(_code)
    AND c.active = true
    AND (c.expires_at IS NULL OR c.expires_at > now())
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;