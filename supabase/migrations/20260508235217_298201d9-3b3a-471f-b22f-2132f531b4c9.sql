ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS estimated_delivery_time INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS order_prep_time_multiplier INTEGER DEFAULT 5;

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);