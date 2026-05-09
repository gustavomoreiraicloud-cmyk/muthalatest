
-- 1) Drop public SELECT on orders and order_items (PII exposure)
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;

-- Keep INSERT for guest checkout. But "Users can view their own orders" used target role public — restrict to authenticated.
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) Order status lookup RPC (verifies caller knows order_number + customer phone)
CREATE OR REPLACE FUNCTION public.lookup_order_status(_order_number integer, _phone text)
RETURNS TABLE (
  id uuid,
  order_number integer,
  status text,
  items jsonb,
  subtotal numeric,
  delivery_fee numeric,
  discount numeric,
  total numeric,
  payment_method text,
  delivery_method text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.status, o.items, o.subtotal, o.delivery_fee,
         o.discount, o.total, o.payment_method, o.delivery_method, o.created_at, o.updated_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
    AND o.created_at > now() - interval '7 days'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_order_status(integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_order_status(integer, text) TO anon, authenticated;

-- 3) Storage menu-images: require admin role
DROP POLICY IF EXISTS "Admin manage menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload menu images" ON storage.objects;

CREATE POLICY "Admin manage menu images"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'::app_role));
