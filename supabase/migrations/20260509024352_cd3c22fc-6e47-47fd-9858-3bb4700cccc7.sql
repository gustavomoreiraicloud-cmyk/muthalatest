
-- Remove public insert on order_items (place_order stores items in orders.items JSONB)
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

-- Tighten public order insert to prevent discount/points abuse via direct API
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
ON public.orders
FOR INSERT
TO public
WITH CHECK (
  status = 'novo'
  AND total >= 0
  AND COALESCE(discount, 0) = 0
  AND COALESCE(points_used, 0) = 0
  AND user_id IS NULL
);

-- Fix mutable search_path on functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  RETURN NEW;
END;
$function$;
