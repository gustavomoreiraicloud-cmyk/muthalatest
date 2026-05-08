-- Adicionar coordenadas na loja
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);

-- Atualizar localização da loja (Assis - SP - R. Smith Vasconcelos, 312)
UPDATE public.store_settings 
SET latitude = -22.6612, longitude = -50.4132
WHERE latitude IS NULL;

-- Adicionar max_km se não existir
ALTER TABLE public.delivery_ranges ADD COLUMN IF NOT EXISTS max_km NUMERIC(5,2);

-- Atualizar intervalos existentes (baseado no pedido anterior do usuário)
UPDATE public.delivery_ranges SET min_km = 0, max_km = 2, fee = 6 WHERE label ILIKE '%2km%';
UPDATE public.delivery_ranges SET min_km = 2, max_km = 4, fee = 8 WHERE label ILIKE '%4km%';
UPDATE public.delivery_ranges SET min_km = 4, max_km = 6, fee = 10 WHERE label ILIKE '%6km%';
UPDATE public.delivery_ranges SET min_km = 6, max_km = 8, fee = 12 WHERE label ILIKE '%8km%';
UPDATE public.delivery_ranges SET min_km = 8, max_km = 99, fee = 15 WHERE label ILIKE '%8+%';
