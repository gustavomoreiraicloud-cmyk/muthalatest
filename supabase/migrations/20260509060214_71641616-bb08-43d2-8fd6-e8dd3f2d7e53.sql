-- Limpeza de funções antigas para evitar conflitos de tipos e parâmetros
DROP FUNCTION IF EXISTS public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid);
DROP FUNCTION IF EXISTS public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid, integer);
DROP FUNCTION IF EXISTS public.lookup_order_status(integer, text);

-- 1. Helper de Rate Limiting (SECURITY DEFINER para acessar orders com RLS ativado)
CREATE OR REPLACE FUNCTION public.check_rate_limit(_user_id uuid, _ip text, _limit integer, _interval interval)
RETURNS boolean AS $$
DECLARE
    recent_count integer;
BEGIN
    SELECT count(*) INTO recent_count
    FROM public.orders
    WHERE (user_id = _user_id OR customer_phone = _ip)
      AND created_at > now() - _interval;
      
    RETURN recent_count < _limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Função place_order Reforçada
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
  _user_id uuid DEFAULT auth.uid(),
  _points_used integer DEFAULT 0
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
  -- Bloqueia se houver mais de 5 pedidos na última hora para este "identificador"
  IF NOT public.check_rate_limit(_user_id, _customer_phone, 5, interval '1 hour') THEN
    RAISE EXCEPTION 'Muitas tentativas de pedido. Por favor, aguarde um pouco.';
  END IF;

  IF _total < 0 THEN RAISE EXCEPTION 'Valor total inválido'; END IF;

  INSERT INTO public.orders (
    customer_name, customer_phone, delivery_method, subtotal, discount,
    delivery_fee, total, payment_method, address_street, address_number,
    address_neighborhood, address_complement, address_reference, notes,
    coupon_code, user_id, items, status, points_used
  ) VALUES (
    _customer_name,
    regexp_replace(_customer_phone, '\D', '', 'g'),
    _delivery_method, _subtotal, _discount,
    _delivery_fee, _total, _payment_method, _address_street, _address_number,
    _address_neighborhood, _address_complement, _address_reference, _notes,
    _coupon_code, _user_id, _items, 'novo', _points_used
  )
  RETURNING public.orders.id, public.orders.order_number INTO new_order_id, new_order_number;

  RETURN QUERY SELECT new_order_id, new_order_number;
END;
$$;

-- 3. Proteção de Perfis (Apenas dono ou Admin)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Busca de Status Segura (Evita enumeração)
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
    delivery_method text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.order_number, o.status, o.items, o.subtotal, o.delivery_fee,
         o.discount, o.total, o.delivery_method, o.created_at, o.updated_at
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND regexp_replace(o.customer_phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
    AND o.created_at > now() - interval '30 days';
$$;

-- 5. Controle de Permissões de Execução
REVOKE ALL ON FUNCTION public.lookup_order_status(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order_status(integer, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, numeric, numeric, numeric, numeric, text, text, text, text, text, text, text, text, jsonb, uuid, integer) TO anon, authenticated;
