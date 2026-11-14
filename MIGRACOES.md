# Migração V5.6 — preparação, execução e recuo seguro

**NÃO EXECUTADA NESTA ENTREGA.** As migrações são arquivos de código para homologação. O acesso a contas reais fica bloqueado na V5.6 até a coluna `revision` existir e a RPC de salvamento funcionar.

## Pré-condições

1. Criar um **projeto Supabase staging separado** de produção com cópia anonimizada da estrutura, contas de teste e Storage privado. Registrar autorização para o ambiente. Não copiar tokens de produção para staging.
2. Verificar a estrutura real de `public.study_data`, tipo `jsonb`, índices e unicidade de `user_id`; rodar diagnóstico de duplicatas de `SUPABASE-SEGURANCA.sql`. Resolver duplicatas com backup antes de executar o SQL V5.6.
3. Exportar snapshot/backup do banco e objetos e ENSAIAR restauração em staging antes de alterar schema. Revisar policies existentes de `study_data`, `study_drafts`, `storage.objects`, `storage.buckets` e functions.
4. Executar `migrations/v56/001_revisionamento_estudos.sql` no SQL Editor de **staging**. Validar a leitura de `data,revision` e `save_study_data_v56` com conta A. Verificar gravação e conflito com 2 abas, sem perda.
5. Executar `migrations/v56/002_cotas_e_cache_ia.sql` em **staging**. Verificar que `anon` e `authenticated` não podem acessar as tabelas IA nem executar as RPCs da service_role. Configurar `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS` e `OPENAI_MODEL` **somente** no Secrets da Edge Function, não no repositório. Não habilitar uso de API paga sem autorização.
6. Configurar `topos-config.js` com **somente** `url` de staging e chave publicável/anon de staging. Publicar Edge Function `study-ai` em staging. `ALLOWED_ORIGINS` deve listar os endereços HTTPS exatos da aplicação (incluindo scheme e porta, se for ambiente de teste).
7. Rodar `test_rls_staging.py` usando **duas contas descartáveis** e depois matriz manual e automatizada A/B/anon cobrindo SELECT/INSERT/UPDATE/DELETE/RPC/Storage, quotas e concorrência com gravador de eventos. Auditar CSP/SRI e travas de upload antes de produção.

## Recuo não destrutivo

- Em falha no staging, desabilitar a nova Edge Function/aplicação V5.6 e restaurar frontend V5.5 no staging. Manter colunas/tabelas novas **sem apagá-las** enquanto houver dados ou uso; reverter schema só com plano de migração/backup específico aprovado.
- Conflito: exportar o estado em memória, recarregar dados persistidos e reconciliar manualmente. NÃO forçar `revision` nem alterar o usuário da linha.
- Não há script de rollback automático destrutivo. Nunca executar `DROP TABLE` / apagar arquivos privados como “rollback” sem autorização explícita.

## Dependências externas e travas de implantação

- A V5.6 ainda usa Supabase JS e DOMPurify remotos e handlers inline no HTML. Uma CSP estrita exigirá vendor local + refatoração; não considerar S2 homologado.
- PDF: 50 arquivos/300MB é limite de **UX** no cliente. Não é limite imposto pelo servidor; requer controle backend/storage autoritativo e limpeza de órfãos antes de produção.
- Não há testes reais de Edge Function, concorrência SQL, recuperação de desastres, custos de IA, MFA/Turnstile, vazamento por políticas antigas, nem pentest.
