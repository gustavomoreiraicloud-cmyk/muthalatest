ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code_url TEXT;

COMMENT ON COLUMN public.store_settings.pix_key IS 'Chave PIX da loja para exibição ao cliente';
COMMENT ON COLUMN public.store_settings.pix_qr_code_url IS 'URL da imagem do QR Code do PIX (opcional)';