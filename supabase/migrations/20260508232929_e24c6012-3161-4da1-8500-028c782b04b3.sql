-- Create a function to generate a random 4-digit number that doesn't exist yet for today's orders
CREATE OR REPLACE FUNCTION public.generate_unique_order_number()
RETURNS INTEGER AS $$
DECLARE
    new_code INTEGER;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generate random number between 1000 and 9999
        new_code := floor(random() * 9000 + 1000)::INTEGER;
        
        -- Check if it exists in recent orders (last 24h) to avoid collisions
        SELECT EXISTS (
            SELECT 1 FROM public.orders 
            WHERE order_number = new_code 
            AND created_at > now() - interval '24 hours'
        ) INTO exists_already;
        
        EXIT WHEN NOT exists_already;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Update the default value of order_number to use this function
-- Note: Existing orders might have sequential numbers, but new ones will be random.
-- We use a trigger to ensure the number is generated on insert if not provided.

CREATE OR REPLACE FUNCTION public.set_random_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number < 1000 THEN
        NEW.order_number := public.generate_unique_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_order_number ON public.orders;
CREATE TRIGGER tr_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_random_order_number();
