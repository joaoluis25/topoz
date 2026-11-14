-- CENTRAL DE ESTUDOS V5 · bucket privado para PDFs
-- Execute no SQL Editor do Supabase, após conferir as políticas existentes.
-- Não insira chaves de API neste script.
-- A coluna study_data.data armazena só metadados; o PDF fica no Storage.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('study-materials', 'study-materials', FALSE, 15728640, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
SET public=FALSE, file_size_limit=15728640, allowed_mime_types=ARRAY['application/pdf'];

-- Políticas limitadas ao prefixo do UID no caminho do objeto:
-- {uid}/{materia_id}/{arquivo_id}.pdf
DROP POLICY IF EXISTS "ce_pdf_read_own" ON storage.objects;
CREATE POLICY "ce_pdf_read_own" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id='study-materials' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

DROP POLICY IF EXISTS "ce_pdf_insert_own" ON storage.objects;
CREATE POLICY "ce_pdf_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='study-materials' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
   AND storage.extension(name)='pdf');

DROP POLICY IF EXISTS "ce_pdf_delete_own" ON storage.objects;
CREATE POLICY "ce_pdf_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='study-materials' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

-- Não existe política de UPDATE: cada upload usa nome novo e upsert:false.
-- Para produção, configure limite de arquivos por usuário no backend.
-- Se precisar desfazer, faça backup dos objetos antes de apagar o bucket.
