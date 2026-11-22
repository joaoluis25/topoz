# TOPOZ Estudos V5.7.0 — entrega incremental de desenvolvimento

**Natureza:** beta técnica, **não homologada para produção/comercialização**.
**Base preservada:** V5.6.1, `public.study_data(data jsonb, revision integer)`, RPC `save_study_data_v56`, `schemaVersion: 4`.

## 1. O que foi efetivamente acrescentado

- Integração da calculadora científica fornecida no ZIP (`topoz-calc-engine.js` e `topoz-calc-ui.js`), incluindo Alt+C, modos de ângulo, histórico em memória e inserção no editor rico.
- Ajustes de responsividade e comportamento inicial de modais (role dialog, Tab, ESC, foco e retorno, bloqueio de scroll, medidas para 390 px).
- Correção da priorização da fila/planejador para usar `topicId` em vez de nomes de matérias iguais.
- Exportação inicial de anotações com identidade TOPOZ: arquivo **DOCX real** gerado localmente e opção **Imprimir / Salvar como PDF** pelo navegador. Ainda não inclui imagens embutidas, sumário sofisticado nem o kit completo de todos os cards.
- Nova rota **Simulados**: cadastro de questões objetivas A–E, sorteio com semente, filtro por matéria/subtópico, realização, retomada dos dados sincronizados, correção e histórico. **Este é o núcleo inicial; ainda não inclui exportação de caderno, provas ENEM completas, distribuição manual ou cronômetro de prova.**
- Landing pública com comparativo **provisório** de Grátis/Essencial/Pro/Pro Max, sem checkout, sem promessas falsas de período de teste.
- Botões contextuais de IA em diferentes áreas, tela de envio explícito do material, consentimento registrado por usuário, validação e aprovação humana. Até 23 tarefas de geração textual/questões/cartões no catálogo, com respostas **reais somente quando o gateway for configurado e implantado em STAGING**.
- Novo gateway `supabase/functions/ai-gateway` com fornecedor OpenAI-compatível configurável por segredo, controle de acesso, requisição de conteúdo não confiável, resposta validada, limitação de chamadas via funções SQL e cache isolado por usuário.
- Migração **003 em arquivo, não executada**, para consentimento de IA, planos internos de cota e funções v57. Não altera `study_data`, não reexecuta a migração V5.6.1 e não ativa cobrança.

## 2. O que continua PENDENTE

Não foram concluídas todas as tarefas dos documentos BUG-1, SEG-1, FUNC-1, CALC-2, COM-1/2 e AI-A a AI-F. Em especial:

- Homologação de RLS e Storage A/B/anon com escrita real, prevenção robusta de escrita direta revisionada e recuperação/restore em staging;
- CSP rigorosa, remoção dos numerosos handlers inline legados, bibliotecas/frontes locais com auditoria de licenças;
- Renderização avançada e universal de documentos (incluindo imagens e sumários), simulado com PDF do caderno, cartão-resposta, gabarito separado e tempo de prova;
- RAG/pgvector, OCR e STT verdadeiros; transcrição de áudio hospedada; recursos avançados dos laboratórios;
- Auditoria de IA com casos reais por área, segurança LGPD completa e revisão jurídica de Termos/Privacidade;
- Paywall, pagamentos Pix/cartão, webhook e assinatura; planos apenas exibidos como **hipóteses**, sem entitlements de funcionalidades fora do gateway;
- Testes de contraste e rótulos em todos os controles existentes, testes reais Safari/Firefox/celular, testes E2E com Supabase de dois usuários.

**Não publique como produto pago; não forneça dados pessoais reais para IA antes da adequação jurídica e homologação.**

## 3. Segurança do Supabase — NÃO repetir o erro de `revision`

**NÃO execute novamente** as migrações anteriores no banco que já está funcionando. Em particular, não remova ou recrie `public.study_data`, `revision` ou `save_study_data_v56`.

1. Faça uma **cópia recuperável e teste restauração** do STAGING (CSV isolado não equivale a backup integral do Supabase).
2. Crie ou utilize projeto de **STAGING separado** do banco real. Copie só esquema/dados de teste autorizados, nunca dados privados de produção.
3. Comece executando `migrations/v57/000_diagnostico_STAGING_SOMENTE_LEITURA.sql`; confirme `revision=true`, `save_study_data_v56=true`, RLS e políticas.
4. **Somente após validar o backup e as permissões**, aplique em STAGING `migrations/v57/003_gateway_consentimento_e_cotas_STAGING.sql` uma única vez. Não aplique automaticamente no banco real.
5. Configure a Edge Function `ai-gateway` e desligue o endpoint legado `study-ai` **apenas após** a nova função passar nos testes de homologação. Não aplique uma desativação isolada na produção, pois quebraria a IA antiga.
6. Execute teste de usuário A, usuário B, anônimo, RLS (leitura e escrita), cota, consentimento, provedor com falha, reembolso da cota, cache e rollback antes de qualquer promoção.

### Configuração pública do site

O arquivo `topos-config.js` foi deliberadamente mantido com **placeholders para STAGING**. Preencha apenas URL pública e chave **publicável/anon** do projeto STAGING no seu computador, sem colocar `service_role` ou chaves de IA no navegador. Se o arquivo estiver com valores fictícios, **o login não funcionará**; isso é esperado e evita expor acesso a uma base errada. Não copie a configuração do projeto de produção para staging.

Inicie com Live Server (VS Code) ou servidor HTTP de desenvolvimento; não use a página de diagnóstico em deploy público.

### Variáveis de ambiente da Edge Function (STAGING)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (apenas no servidor), `AI_API_KEY` (ou `OPENAI_API_KEY`), `AI_BASE_URL` (HTTPS), `AI_MODEL_FAST`, `AI_MODEL_STRONG`, `AI_PROMPT_VERSION`, `ALLOWED_ORIGINS` (origens exatas de staging).

O gateway não liga sozinho; **sem chave, provedor real e migração 003, a IA permanece indisponível**. Isso é intencional. Configure teto de gastos no provedor **antes** de chamadas reais.

**Importante:** as funções da versão v57 são específicas do conjunto de migrações incluído; revisar SQL e testar na sua instância antes de publicar. Não pressupõem o estado real do seu Supabase.

## 4. Testes executados localmente

- `node calc-reference/test-engine.cjs`: **240/240**.
- `node tests-atuais/test_v56_node.cjs`: **12 verificações**.
- `node tests-atuais/test_simulado_node.cjs`: **6/6**.
- `node --experimental-strip-types tests-atuais/test_ai_tasks.mjs`: **7/7** de validação de saída/trechos.
- `python tests-atuais/test_v57_flows.py`: Chromium, telas 390/768/1024/1440, **25 rotas sem exceções**, fluxo de simulado e modal.
- `python tests-atuais/test_v57_landing.py`: landing, quatro planos, sem trial falso, sem overflow de documento em 390/768/1024/1440 px.
- `python tests-atuais/test_export_kit.py`: abre e analisa um DOCX com python-docx; verifica identidade, metadados mínimos e bloqueio de HTML executável.

Nesses scripts de interface, foi usada **demonstração com dados fictícios e mock de banco**, não Supabase real. Não equivalem a pentest nem a homologação em produção.

## 5. Arquivos entregues

- Pacote de código-fonte completo: mantém documentação, testes e migrações em pastas próprias.
- Pacote web **somente STAGING**: apenas os arquivos necessários para servir o front-end, sem diagnósticos, testes, demos e SQL. Nenhum segredo está embutido.

## 6. Critérios de avanço para produção

Sem lançamentos automáticos; aplicar S1/N1/S2/LGPD/backup testado e testes A/B/anon antes de publicar. Somente depois de homologar pagamentos, políticas de privacidade e termos, considerar a venda. Enquanto isso, manter a versão como beta privada.
