# Entrega V5.6 — TOPOZ Estudos

Versão de trabalho: **Beta V5.6 / segurança e planejamento — NÃO apta para produção**.

## Entregue

- Cópia incremental da V5.5, incluindo 5 módulos e legado; o histórico de segurança V5.4 é intocado.
- Fila integrada de revisão de cartões e anotações existentes (não altera algoritmo de agendamento para FSRS).
- Planejador semanal determinístico 7/14 dias; configura até 180 min/dia, prioriza matérias com pendências e somente grava eventos com aceite.
- Normalização mais robusta de relações pai/filho, inclusive mapas, proteção de importação 5 MB e fallback de HTML em texto escapado.
- Proposta CAS no Supabase via `revision` com bloqueio de sobrescrita, sinalização multiaba e migração SQL manual.
- Gateway de IA server-side com JWT, cache privado, cota de 20/dia, CORS allowlist, timeout 20s e JSON estruturado; aprovação explícita ao transformar resultado em anotação.
- Checagem na UI de 50 PDFs/300 MB e reversão do upload caso os metadados não sincronizem; políticas e cotas físicas do servidor ainda precisam de implementação.
- Configuração de Supabase em **placeholders** por segurança, impedindo conexão acidental à instância anteriormente incluída na V5.5.
- Testes locais e matriz de implementação; SQL/Edge **não** executados externamente.

## Não entregue/não homologado

FSRS verdadeiro; PWA; compartilhamento; OCR; RAG/pgvector; busca híbrida; criação de aulas em vídeo/slide; coach IA; vinculação de citações verificadas; enforcement servidor das cotas físicas de PDF; remoção de todos os handlers inline/CSP; monitoramento e LGPD completos; testes reais de A/B/anon; SQL e Edge Function em staging ou produção.

## Documentos

`STATUS-IMPLEMENTACAO.md`, `DECISOES-ARQUITETURA.md`, `MIGRACOES.md`, `SEGURANCA-MATRIZ.md`, `TESTES-REGRESSAO.md`, `ENTREGA_BETA_V5_5.md`, `HISTORICO-SEGURANCA.md`.
