-- Remover políticas anteriores que eram muito abertas
DROP POLICY IF EXISTS "Public menu images access" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update delete menu images" ON storage.objects;

-- Visualização por URL (pública), mas sem listagem (opcional se não quiser listagem via API)
CREATE POLICY "Public menu images access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'menu-images');

-- Inserção: Apenas se autenticado (admin via aplicação)
CREATE POLICY "Admin upload menu images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'menu-images');

-- Atualização e Exclusão: Apenas se autenticado
CREATE POLICY "Admin manage menu images" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'menu-images');
