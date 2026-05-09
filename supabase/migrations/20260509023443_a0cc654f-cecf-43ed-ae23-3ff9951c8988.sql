
CREATE OR REPLACE FUNCTION public.place_order(
  _customer_name text,
  _customer_phone text,
  _delivery_method text,
  _subtotal numeric,
  _discount numeric,
  _delivery_fee numeric,
  _total numeric,
  _payment_method text,
  _address_street text DEFAULT NULL::text,
  _address_number text DEFAULT NULL::text,
  _address_neighborhood text DEFAULT NULL::text,
  _address_complement text DEFAULT NULL::text,
  _address_reference text DEFAULT NULL::text,
  _notes text DEFAULT NULL::text,
  _coupon_code text DEFAULT NULL::text,
  _items jsonb DEFAULT '[]'::jsonb,
  _user_id uuid DEFAULT NULL::uuid,
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
  computed_subtotal numeric := 0;
  expected_total numeric;
  coupon_row public.coupons%ROWTYPE;
  validated_discount numeric := 0;
  item jsonb;
  item_price numeric;
  item_qty integer;
BEGIN
  -- Sanity checks
  IF _subtotal IS NULL OR _subtotal < 0 THEN
    RAISE EXCEPTION 'Subtotal inválido';
  END IF;
  IF _delivery_fee IS NULL OR _delivery_fee < 0 THEN
    RAISE EXCEPTION 'Taxa de entrega inválida';
  END IF;
  IF _total IS NULL OR _total < 0 THEN
    RAISE EXCEPTION 'Total inválido';
  END IF;
  IF _discount IS NULL OR _discount < 0 THEN
    RAISE EXCEPTION 'Desconto inválido';
  END IF;

  -- Recompute subtotal from items
  IF _items IS NOT NULL AND jsonb_typeof(_items) = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(_items)
    LOOP
      item_price := COALESCE((item->>'price')::numeric, 0);
      item_qty := COALESCE((item->>'qty')::integer, 0);
      IF item_price < 0 OR item_qty <= 0 THEN
        RAISE EXCEPTION 'Item inválido no pedido';
      END IF;
      computed_subtotal := computed_subtotal + (item_price * item_qty);
    END LOOP;
  END IF;

  IF abs(computed_subtotal - _subtotal) > 0.05 THEN
    RAISE EXCEPTION 'Subtotal inconsistente com os itens';
  END IF;

  -- Re-validate coupon discount server-side
  IF _coupon_code IS NOT NULL AND length(trim(_coupon_code)) > 0 THEN
    SELECT * INTO coupon_row
      FROM public.coupons
     WHERE upper(code) = upper(_coupon_code)
       AND active = true
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom inválido';
    END IF;

    IF computed_subtotal < COALESCE(coupon_row.min_order, 0) THEN
      RAISE EXCEPTION 'Pedido não atinge o mínimo do cupom';
    END IF;

    IF coupon_row.discount_type = 'percent' THEN
      validated_discount := round(computed_subtotal * (coupon_row.discount_value / 100.0), 2);
    ELSE
      validated_discount := coupon_row.discount_value;
    END IF;

    IF validated_discount > computed_subtotal THEN
      validated_discount := computed_subtotal;
    END IF;

    IF abs(validated_discount - _discount) > 0.05 THEN
      RAISE EXCEPTION 'Desconto inconsistente com o cupom';
    END IF;
  ELSE
    IF _discount > 0 THEN
      RAISE EXCEPTION 'Desconto sem cupom';
    END IF;
    validated_discount := 0;
  END IF;

  -- Total must equal subtotal - discount + delivery_fee
  expected_total := computed_subtotal - validated_discount + _delivery_fee;
  IF abs(expected_total - _total) > 0.05 THEN
    RAISE EXCEPTION 'Total inconsistente';
  END IF;

  -- Deduct loyalty points if used
  IF _points_used > 0 AND _user_id IS NOT NULL THEN
    UPDATE public.profiles
       SET points = points - _points_used
     WHERE public.profiles.id = _user_id
       AND public.profiles.points >= _points_used;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Saldo de pontos insuficiente';
    END IF;
  END IF;

  -- Insert with server-validated values
  INSERT INTO public.orders (
    customer_name, customer_phone, delivery_method, subtotal, discount,
    delivery_fee, total, payment_method, address_street, address_number,
    address_neighborhood, address_complement, address_reference, notes,
    coupon_code, user_id, items, status, points_used
  ) VALUES (
    _customer_name, _customer_phone, _delivery_method, computed_subtotal, validated_discount,
    _delivery_fee, expected_total, _payment_method, _address_street, _address_number,
    _address_neighborhood, _address_complement, _address_reference, _notes,
    _coupon_code, _user_id, _items, 'novo', _points_used
  )
  RETURNING public.orders.id, public.orders.order_number
       INTO new_order_id, new_order_number;

  RETURN QUERY SELECT new_order_id, new_order_number;
END;
$function$;
