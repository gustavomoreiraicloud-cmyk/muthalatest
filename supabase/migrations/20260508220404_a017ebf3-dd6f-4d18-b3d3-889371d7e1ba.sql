-- Tabela de bairros e taxas
CREATE TABLE IF NOT EXISTS public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public read neighborhoods" ON public.neighborhoods FOR SELECT USING (true);
CREATE POLICY "Admin manage neighborhoods" ON public.neighborhoods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Inserir bairros comuns de Assis com taxas estimadas
INSERT INTO public.neighborhoods (name, fee) VALUES 
('Centro', 5.00),
('Vila Operária', 6.00),
('Vila Xavier', 6.00),
('Prudenciana', 8.00),
('Jardim Europa', 7.00),
('Vila Santa Cecília', 6.00),
('Vila Fiães', 5.00),
('Jardim Aeroporto', 10.00),
('Vila Cláudia', 7.00),
('Vila Progresso', 6.00),
('Jardim Amauri', 8.00),
('Vila Adileta', 6.00),
('Vila Glória', 6.00),
('Vila Santana', 6.00),
('Parque das Flores', 9.00),
('Jardim Alvorada', 8.00),
('Vila Ribeiro', 7.00)
ON CONFLICT (name) DO NOTHING;
