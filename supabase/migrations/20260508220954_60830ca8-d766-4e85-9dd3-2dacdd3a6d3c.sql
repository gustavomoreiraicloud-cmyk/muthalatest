-- Remover tabela antiga de bairros para migrar para quilometragem
DROP TABLE IF EXISTS public.neighborhoods;

-- Criar tabela de faixas de entrega por KM
CREATE TABLE public.delivery_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL, -- Ex: "Até 2km", "2km a 4km"
    min_km NUMERIC(5,2) NOT NULL,
    max_km NUMERIC(5,2), -- NULL para "acima de X km"
    fee NUMERIC(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.delivery_ranges ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public read delivery ranges" ON public.delivery_ranges FOR SELECT USING (true);
CREATE POLICY "Admin manage delivery ranges" ON public.delivery_ranges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Inserir faixas sugeridas
INSERT INTO public.delivery_ranges (label, min_km, max_km, fee) VALUES 
('Até 2km', 0, 2, 5.00),
('2km a 4km', 2, 4, 7.00),
('4km a 6km', 4, 6, 9.00),
('6km a 8km', 6, 8, 12.00),
('Acima de 8km', 8, NULL, 15.00);
