-- SCRIPT DE CORREÇÃO DEFINITIVA PARA UPLOAD DE IMAGENS
-- 1. Garante que o bucket 'product-images' existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Limpa todas as políticas antigas que podem estar bloqueando o acesso
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- 3. Cria novas políticas permissivas para o bucket 'product-images'

-- PERMITIR VISUALIZAÇÃO PÚBLICA (qualquer pessoa vê as imagens)
CREATE POLICY "Public View Product Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- PERMITIR UPLOAD PARA USUÁRIOS LOGADOS (corrige o erro 403 no upload)
CREATE POLICY "Authenticated Upload Product Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- PERMITIR ATUALIZAÇÃO/DELEÇÃO PARA USUÁRIOS LOGADOS
CREATE POLICY "Authenticated Update Product Images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Product Images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- CORREÇÃO EXTRA: PERMITIR CRIAÇÃO DE USUÁRIOS (ERRO DO SIGNUP)
-- Se você também teve erro ao criar usuário ("new row violates row-level security policy")
-- Isso permite que o sistema crie o perfil inicial do usuário
CREATE POLICY "Enable insert for authenticated users and service role"
ON public."BeloriBH_profiles"
FOR INSERT
WITH CHECK (true);
