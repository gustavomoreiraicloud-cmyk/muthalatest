CREATE OR REPLACE FUNCTION public.lookup_order_status(_order_number integer DEFAULT NULL, _phone text DEFAULT NULL)
 RETURNS TABLE(id uuid, order_number integer, status text, items jsonb, subtotal numeric, delivery_fee numeric, discount numeric, total numeric, payment_method text, delivery_method text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.id, o.order_number, o.status, o.items, o.subtotal, o.delivery_fee,
         o.discount, o.total, o.payment_method, o.delivery_method, o.created_at, o.updated_at
  FROM public.orders o
  WHERE 
    (
      -- Se _order_number for fornecido, deve bater
      (_order_number IS NULL OR o.order_number = _order_number)
      AND
      -- O telefone é obrigatório para segurança (exceto se for admin)
      (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR
        regexp_replace(coalesce(o.customer_phone,''), '\D', '', 'g')
          = regexp_replace(coalesce(_phone,''), '\D', '', 'g')
      )
    )
    AND o.created_at > now() - interval '7 days'
  ORDER BY o.created_at DESC
  LIMIT 1;
$function$;