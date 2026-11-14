# TOPOZ Estudos — matriz da Beta V5.6 (14/11/2026)

**Situação:** beta de código local, **NÃO homologada em produção**. Continuidade da Beta V5.5, sem reconstrução do zero; `schemaVersion: 4` conservado. A cópia anterior e o histórico V5.4 são preservados.

**Rastreabilidade:** os *temas* dos prompts anteriores S1–S13, F1–F15 e AI-0–AI-6 foram recuperados do histórico da conversa, mas seus textos originais integrais não estão incluídos nos arquivos disponíveis nesta execução. Portanto esta matriz mapeia os temas recuperados e as evidências reais de código; não certifica conformidade literal a todos os critérios de aceite que constavam dos prompts integrais.

Legenda: **CÓDIGO** = implementado localmente, ainda sujeito a homologação quando usa backend; **PARCIAL** = há base funcional mas requisitos faltantes; **PENDENTE** = não implementado; **STAGING** = migração/backend propostos, não implantados nem testados em ambiente real.

## Segurança S1–S13

| ID | Tema recuperado | Situação V5.6 | Evidência e limitações |
|---|---|---|---|
| S1 | Isolamento A/B e anon em RLS e Storage | PARCIAL | `SUPABASE-SEGURANCA.sql`, `SUPABASE-PDFS.sql`, `tests-atuais/test_rls_staging.py`. Sem credenciais/staging: **não testado**. Auditar políticas preexistentes e funções. |
| S2 | CSP/SRI, assets locais, remover `onclick` | PENDENTE | Interface legada tem handlers/scripts inline e Supabase/DOMPurify CDN. Dependências externas não foram vendorizadas. CSP rigorosa exige refatoração substancial. |
| S3 | Prevenir ciclos `parentId` | CÓDIGO | `topoz-guard.js` usado em `normalizeState` e normalizador dos mapas; remove ciclos e IDs duplicados. Testes de importação/ciclos locais. |
| S4 | Estado até 5 MB, versão atômica, conflito/múltiplas abas | CÓDIGO + STAGING | `save_study_data_v56` em `migrations/v56/001_revisionamento_estudos.sql`, RPC no browser, bloqueio de conflito, `BroadcastChannel`, aborta escrita se não migrado. CAS apenas simulado em navegador; banco real **não testado**. |
| S5 | IA 20/dia, CORS, timeout 20 s, cache | CÓDIGO + STAGING | `study-ai/index.ts`, `002_cotas_e_cache_ia.sql`; controle por servidor, JWT, cota por usuário+dia, cache privado, timeout 20 s; sem execução real da Edge Function. |
| S6 | Turnstile, MFA, recuperação segura | PARCIAL | Fluxos de recuperação preexistentes; configurações Turnstile e MFA exigem Supabase/ambiente, não configurados. |
| S7 | Limpeza de dados locais ao sair/trocar conta | CÓDIGO | `clearLocalPrivateState` remove rascunhos e timer do usuário, limpa timers e rascunho de IA; cache do Supabase Auth depende de `signOut` do SDK. |
| S8 | Sanitização restritiva/fail closed | PARCIAL | `sanitizeNoteHtml` usa DOMPurify se disponível e recua para **texto escapado**, não para sanitizador HTML caseiro. Ausência de dependência perde formatação, mas não injeta HTML; CSP ainda pendente. |
| S9 | Histórico, importação segura e exclusão | PARCIAL | Backup legado mantido, importação agora limitada a 5 MB e normalização verificada; auditoria imutável/fluxos de exclusão integral pendentes. |
| S10 | PDF 50 itens/300 MB/órfãos | PARCIAL | Browser verifica 50 e 300 MB; MIME + assinatura + 15 MB legados; novo salvamento imediato de metadados e tentativa de reversão do upload se falhar. Falta **enforcement servidor**, varredura de órfãos, testes físicos de Storage. |
| S11 | Ambientes, migrações, segredos, deploy/rollback | PARCIAL | `topos-config.js` agora contém **somente placeholders** para staging. SQL versionado e sem execução automática. Sem CI/CD, backup/restauração ou deploy reais. |
| S12 | LGPD, exportar/apagar dados | PARCIAL | Backup existente; texto de reset deixa explícito que não apaga conta, rascunhos remotos e arquivos Storage. Fluxo integral auditável pendente. |
| S13 | Observabilidade sem PII | PARCIAL | Gateway novo não registra prompts, textos nem segredos. Logs legados precisam de auditoria; monitoramento/alertas externos não configurados. |

## Funcionalidades F1–F15

> A correspondência numérica abaixo reflete os temas recuperados, e **não** uma reprodução palavra por palavra dos prompts originais.

| ID | Área | Situação V5.6 | Observação |
|---|---|---|---|
| F1 | Onboarding/Hoje | PARCIAL | Dashboard e Meu Dia preexistentes; onboarding guiado falta. |
| F2 | Matérias/editais/PDF | PARCIAL | Matérias e PDF privado preexistentes; importação/análise de editais falta. |
| F3 | Editor e notas | PARCIAL | Editor legado preservado; fallback seguro texto quando DOMPurify ausente; auditoria completa do editor falta. |
| F4 | Revisão espaçada FSRS | PARCIAL | `Fila de revisão` integra agendamentos existentes de notas/flashcards, **mas o algoritmo atual ainda não é FSRS**. |
| F5 | Flashcards | PARCIAL | Flashcards preexistentes e importação por pares V5.5; decks/FSRS/importador Anki pendentes. |
| F6 | Questões | PARCIAL | Módulo questões legado mantido; novos avanços não avaliados nesta beta. |
| F7 | Sessões/timer | PARCIAL | Módulo preexistente mantido; validação de sessões em multiaba pendente. |
| F8 | Planejamento | CÓDIGO | `topoz-v56.js`: proposta determinística 7/14 dias, 15–180 min, baseada em matérias/revisões/metas; só salva após aceite. Não é um planejador IA. |
| F9 | Estatísticas | PARCIAL | Painel legado mantido; sem novos relatórios avançados. |
| F10 | Busca | PARCIAL | Busca global existente; sem embeddings/híbrida. |
| F11 | PWA/offline | PENDENTE | Demo local funciona com arquivos locais; não equivale a PWA instalável nem sync offline. |
| F12 | Motivação | PARCIAL | Sequência de dias e indicadores legados preservados. |
| F13 | Compartilhamento | PENDENTE | Nenhum recurso multiusuário implantado; privacidade por padrão. |
| F14 | Acessibilidade/WCAG AA e 390px | PARCIAL | `nav`, `main`, foco de botões, smoke 390px. Sem auditoria formal WCAG AA/cross-browser. |
| F15 | Modularização/testes | PARCIAL | `topoz-guard.js`, `topoz-v56.js`, `topoz-v56.css`, Edge e migrações isolados; app legado monolítico continua. |

## IA AI-0–AI-6

| ID | Objetivo | Situação V5.6 | O que falta |
|---|---|---|---|
| AI-0 | Gateway JWT/cota/cache/JSON schema/timeout | CÓDIGO + STAGING | Implementado no Edge e SQL como arquitetura de referência. Configurar `ALLOWED_ORIGINS`, secrets e validar JWT/RLS, quotas, custos, schema e testes de carga em staging. Não há plano comercial. |
| AI-1 | Geração revisável com fontes | PARCIAL | Rascunho estruturado só se torna anotação por aceite humano; **não gera citações auditáveis**, pois falta RAG. |
| AI-2 | Coach/tutor adaptativo | PENDENTE | Não implementado. |
| AI-3 | RAG `pgvector`, isolamento, fontes | PENDENTE | Não há embeddings, ingestão de fontes ou recuperação controlada. |
| AI-4 | Planejador IA com aprovação | PARCIAL | Planejador **determinístico** com aceite, sem modelo IA e sem sugerir alterações automáticas. |
| AI-5 | Redação/Feynman | PENDENTE | Não implementado como fluxo dedicado. |
| AI-6 | Busca híbrida, mapa seguro ≤40 nós, OCR com revisão | PARCIAL | Mapa textual V5.5, até 250 nós; **não atende limite de 40 para saída de IA** (não há geração IA de mapas). Busca híbrida/OCR não implementados. |

**Não há compromisso de funcionalidades pagas, serviços ativados, alterações em produção, monitoramento real ou segurança homologada.**
