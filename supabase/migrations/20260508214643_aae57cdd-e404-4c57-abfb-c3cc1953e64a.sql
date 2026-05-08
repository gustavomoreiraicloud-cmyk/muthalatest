-- Criar o bucket se não existir (o comando insert ignora se já houver)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao storage

-- Visualização: Pública para todos
CREATE POLICY "Public menu images access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'menu-images');

-- Inserção: Apenas administradores autenticados
CREATE POLICY "Admin upload menu images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'menu-images');

-- Atualização/Exclusão: Apenas administradores autenticados
CREATE POLICY "Admin update delete menu images" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'menu-images');
