-- Adicionar coluna points_used na tabela orders se não existir
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0;

-- Atualizar place_order
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
    _user_id uuid DEFAULT NULL,
    _points_used integer DEFAULT 0
)
 RETURNS TABLE(id uuid, order_number integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_order_id uuid;
  new_order_number integer;
BEGIN
  -- Deduzir pontos do usuário se houver
  IF _points_used > 0 AND _user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET points = points - _points_used 
    WHERE public.profiles.id = _user_id AND public.profiles.points >= _points_used;
    
    IF NOT FOUND THEN
       RAISE EXCEPTION 'Saldo de pontos insuficiente';
    END IF;
  END IF;

  -- Inserir o pedido
  INSERT INTO public.orders (
    customer_name, customer_phone, delivery_method, subtotal, discount,
    delivery_fee, total, payment_method, address_street, address_number,
    address_neighborhood, address_complement, address_reference, notes,
    coupon_code, user_id, items, status, points_used
  ) VALUES (
    _customer_name, _customer_phone, _delivery_method, _subtotal, _discount,
    _delivery_fee, _total, _payment_method, _address_street, _address_number,
    _address_neighborhood, _address_complement, _address_reference, _notes,
    _coupon_code, _user_id, _items, 'novo', _points_used
  )
  RETURNING public.orders.id, public.orders.order_number INTO new_order_id, new_order_number;

  RETURN QUERY SELECT new_order_id, new_order_number;
END;
$function$;