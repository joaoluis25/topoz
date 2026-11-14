# Instalação, dados e recuperação — TOPOS V5 Beta

## 1. Nunca comece em produção

- Faça backup dos arquivos atuais da V4 e do pacote anterior; mantenha uma cópia fora da hospedagem.
- Exporte as anotações, questões, metas e sessões no JSON da aplicação original.
- Faça **backup do banco de dados** em ferramenta administrativa confiável. Exportar o JSON da interface não equivale a backup completo do banco.
- Faça **backup separado do Supabase Storage**, incluindo todos os PDFs (`study-materials`) e metadados, testando a restauração.
- Crie ambiente de homologação com credenciais e URL próprios; não aponte o staging para o banco de produção.

## 2. Preparar a estrutura no Supabase de testes

- Crie um projeto separado e configure autenticação, URLs de confirmação e regras de e-mail.
- Se está começando um projeto de Supabase novo, migre os dados legados e crie as tabelas antigas (como `study_data`) e políticas RLS apropriadas. Os arquivos `SUPABASE-SEGURANCA.sql` e `SUPABASE-RASCUNHOS.sql` são históricos: **revise antes de executar**.
- Execute **uma única vez** `db/001_topos_foundation.sql` no SQL Editor do staging. O script não é idempotente em relação a triggers/policies. Faça snapshot do banco antes.
- Verifique que tabelas `tp_*` possuem RLS e que os papéis autenticados não conseguem atualizar `tp_profiles`, `tp_memberships`, `tp_organizations`, `tp_plan_catalog` ou `tp_activity` diretamente.
- PDFs pessoais: revise e configure `SUPABASE-PDFS.sql` no projeto de homologação. PDF de organização ainda NÃO está habilitado nesta beta.
- Em `index.html`, use somente **Supabase URL e chave `anon`/publishable** do ambiente. Nunca publique `service_role`, tokens de pagamentos nem chave de IA.

## 3. Publicar os arquivos

Envie para uma hospedagem HTTPS de teste todos os arquivos preservando as pastas. `index.html` referencia `style.css`, `topos.css`, `topos.js` e as imagens na raiz. `auth-callback.html` deve estar acessível sob o mesmo domínio configurado no Auth.

## 4. Teste de migração com dados reais COPIADOS

Use um backup de teste não sensível. Confirme contagens e amostras de matérias, anotações, HTML formatado, flashcards, questões, revisões, histórico e PDFs. Depois crie registros novos nos espaços Pessoal e Organização. **O código não migra automaticamente as metas antigas para `tp_goals`: são conjuntos separados nesta etapa.**

## 5. Rollback

- Não execute atualizações destrutivas no legado. Em caso de falha, retire os novos arquivos TOPOS e publique novamente o pacote anterior. As tabelas `tp_*` são separadas e não precisam ser apagadas durante o rollback.
- Se ocorrer falha em SQL, restaure o snapshot de homologação. Não rode SQL de destruição para "reverter" sem verificar dependências.
- Nunca use uma conta de produção para testar alterações de regras de negócio com documentos sensíveis.

## 6. Quando NÃO ativar em produção

- Qualquer falha dos casos SEC-01 a SEC-09 em `SEGURANCA_E_TESTES.md`.
- Ausência de recuperação comprovada de documentos e dados.
- Cobrança ou assinatura sem webhooks validados no servidor.
- Sem testes reais de acesso por departamento, responsáveis e revogação.
- Uso de planos além de 10 integrantes sem correção das cotas, validação do faturamento e carga.

## 7. Observação sobre o teste gratuito

A implementação desta beta aplica 30 dias às tabelas novas de planejamento e colaboração, com dados preservados em modo leitura após o prazo. O código antigo de Estudos não foi integrado ao novo mecanismo contratual. **Não use esta beta para cobrar nem para afirmar que o bloqueio abrange todos os módulos.**
