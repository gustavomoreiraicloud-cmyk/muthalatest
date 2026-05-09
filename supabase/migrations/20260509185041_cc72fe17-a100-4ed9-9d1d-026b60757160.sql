CREATE OR REPLACE FUNCTION public.lookup_order_status_v2(_order_number int4, _phone text)
 RETURNS TABLE(id uuid, order_number int4, status text, items jsonb, subtotal numeric, delivery_fee numeric, discount numeric, total numeric, delivery_method text, created_at timestamptz, updated_at timestamptz)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.id, o.order_number, o.status, o.items, o.subtotal, o.delivery_fee,
         o.discount, o.total, o.delivery_method, o.created_at, o.updated_at
  FROM public.orders o
  WHERE (
    (o.order_number = _order_number AND _order_number > 0)
    OR 
    (regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g') AND _phone <> '')
  )
  AND o.created_at > now() - interval '30 days'
  ORDER BY o.created_at DESC
  LIMIT 1;
$function$;