# Testes e evidências de V5.6

Executados localmente em 14/11/2026:

- `node tests-atuais/test_labs_node.cjs` — PASSOU. URLs proibidas, limites e normalização de módulos V5.5.
- `node tests-atuais/test_v56_node.cjs` — PASSOU. UTF-8 5 MB, compatibilidade `schemaVersion 4`, quebra de ciclos, fila e proposta de planejamento.
- `python tests-atuais/test_labs_browser.py` — PASSOU. 5 módulos V5.5, CRUD, 7 rotas originais, campos/links e viewport 390px.
- `python tests-atuais/test_v56_browser.py` — PASSOU. Duas viewports 1440 e 390px, fila integrada, geração e aceite explícito de plano, reparo de ciclos de estado, CAS simulado via RPC mock e bloqueio de conflito.
- `node --check` dos módulos JS e extração de scripts inline para sintaxe Node — ver execução final no relatório de entrega.

**Não testados:** banco real, migrations SQL, Edge Function Deno/OpenAI, cota de 20/dia sob concorrência real, validação completa RLS, autenticação MFA/Turnstile, CSP/SRI, instalações PWA, testes WCAG AA, navegadores Safari/Firefox, alta carga, backup/restauração, Storage completo, testes de custos ou pentest.

`tests-atuais/test_rls_staging.py` é um teste **não executado**, preparado para a fase de homologação. Exige variáveis de ambiente e `TOPOZ_CONFIRM_STAGING_ONLY=YES`; não registra dados privados em stdout. Testa apenas LEITURA A/B/anon e não substitui matriz completa.
