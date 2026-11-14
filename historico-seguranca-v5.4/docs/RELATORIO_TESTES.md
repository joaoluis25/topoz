# Relatório de testes da TOPOS V5 — 07/11/2026

## Testes locais executados

- **PASS** `node --check topos.js`
- **PASS** verificação de sintaxe de JavaScript inline do `index.html` (Node.js)
- **PASS** `node tests/regression.test.js` — metas, normalização, ciclos, timer, revisão de flashcards e recuperação protegida.
- **PASS** `python tests/topos_browser_smoke.py` com Chromium e Supabase simulado — menu de espaços, tarefas, avanço Kanban, metas, projetos, calendário, organizações, departamentos, convite, transição para Estudos, trial somente leitura e responsividade.
- **PASS** `python tests/study_regression_browser.py` com Chromium e Supabase simulado — anotações e formatação, caderno, matérias/cores, upload PDF simulado, questões contextuais e responsividade.
- **PASS** parsing de `topos.css` com `tinycss2` (sem erros).
- **PENDENTE** SQL em PostgreSQL/Supabase real, isolamento RLS, autenticação/convites reais, Storage real, carga/concorrência, checkout, pentest e avaliação legal.

## Limitações dos testes

Os mocks não têm políticas RLS e não simulam falhas de rede, dados simultâneos ou limites comerciais. Passar nesses testes apenas comprova fluxos de interface e regressão básica. O SQL foi entregue para execução e revisão no seu projeto de testes; não foi aplicado no Supabase real.

## Screenshots

- `tests/topos-desktop.png` — planejador mensal em desktop.
- `tests/topos-mobile.png` — equipe e acessos em celular.
- `tests/v5-notes-desktop.png`, `tests/v5-materias-mobile.png` — capturas históricas da etapa anterior.
