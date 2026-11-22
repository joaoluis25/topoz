-- TOPOZ v5.7 — Somente leitura. Executar inicialmente apenas em STAGING.
-- Não transforma dados e não concede permissões.
SELECT 'study_data.revision' AS item,
 EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='study_data' AND column_name='revision') AS existe
UNION ALL SELECT 'save_study_data_v56',to_regprocedure('public.save_study_data_v56(jsonb,integer)') IS NOT NULL
UNION ALL SELECT 'study_ai_usage',to_regclass('public.study_ai_usage') IS NOT NULL
UNION ALL SELECT 'study_ai_requests',to_regclass('public.study_ai_requests') IS NOT NULL
UNION ALL SELECT 'user_consents',to_regclass('public.user_consents') IS NOT NULL
UNION ALL SELECT 'claim_study_ai_v57',to_regprocedure('public.claim_study_ai_v57(uuid,text)') IS NOT NULL;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='public' AND tablename IN ('study_data','study_drafts','study_ai_usage','study_ai_requests','user_consents','entitlements')
ORDER BY tablename,policyname;
SELECT c.relname AS tabela,c.relrowsecurity AS rls_ativo
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('study_data','study_drafts','user_consents','entitlements','study_ai_usage','study_ai_requests');
SELECT p.rolname AS role,
 has_table_privilege(p.rolname,'public.study_data','SELECT') AS leitura,
 has_table_privilege(p.rolname,'public.study_data','INSERT') AS insercao,
 has_table_privilege(p.rolname,'public.study_data','UPDATE') AS atualizacao,
 has_table_privilege(p.rolname,'public.study_data','DELETE') AS exclusao,
 has_table_privilege(p.rolname,'public.study_data','TRUNCATE') AS truncate
FROM pg_roles p WHERE p.rolname IN ('anon','authenticated');
SELECT bucket_id,name FROM storage.objects WHERE bucket_id='study-materials' LIMIT 0;
-- Para políticas de Storage, consulte:
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname='storage' AND tablename='objects' ORDER BY policyname;
