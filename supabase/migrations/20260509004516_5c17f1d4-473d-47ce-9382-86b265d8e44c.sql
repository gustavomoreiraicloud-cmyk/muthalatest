
-- 1) Create a secure function to place orders (Security Definer to bypass RLS for the return value)
CREATE OR REPLACE FUNCTION public.place_order(
  _customer_name text,
  _customer_phone text,
  _delivery_method text,
  _subtotal numeric,
  _discount numeric,
  _delivery_fee numeric,
  _total numeric,
  _payment_method text,
  _address_street text DEFAULT NULL,
  _address_number text DEFAULT NULL,
  _address_neighborhood text DEFAULT NULL,
  _address_complement text DEFAULT NULL,
  _address_reference text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _coupon_code text DEFAULT NULL,
  _items jsonb DEFAULT '[]'::jsonb,
  _user_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, order_number integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id uuid;
  new_order_number integer;
BEGIN
  -- Insert into orders
  INSERT INTO public.orders (
    customer_name, customer_phone, delivery_method, subtotal, discount,
    delivery_fee, total, payment_method, address_street, address_number,
    address_neighborhood, address_complement, address_reference, notes,
    coupon_code, user_id, items, status
  ) VALUES (
    _customer_name, _customer_phone, _delivery_method, _subtotal, _discount,
    _delivery_fee, _total, _payment_method, _address_street, _address_number,
    _address_neighborhood, _address_complement, _address_reference, _notes,
    _coupon_code, _user_id, _items, 'novo'
  )
  RETURNING public.orders.id, public.orders.order_number INTO new_order_id, new_order_number;

  -- Return the values
  RETURN QUERY SELECT new_order_id, new_order_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order TO anon, authenticated;

-- 2) Update lookup_order_status to allow admins to see any order by number alone
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
    AND (
      -- Admin can see any order
      public.has_role(auth.uid(), 'admin'::app_role)
      OR
      -- Guest/User must match phone
      regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
    )
    AND o.created_at > now() - interval '7 days'
  LIMIT 1;
$$;
