# TOPOS V5.3 — Relatório de testes locais

- `node --check topos.js` — aprovado.
- `node tests/regression.test.js` — aprovado (estado/normalização, timers, revisões, proteção de carregamento).
- `python tests/auth_login_browser.py` — aprovado com **autenticação simulada** (senha incorreta, erro de rede, sessão de teste).
- `python tests/study_regression_browser.py` — aprovado com **Supabase simulado** (anotações, edição, questões, PDFs mock e responsividade).
- Navegador Chromium com páginas renderizadas em memória: `estudos-demo.html` exibiu a barra lateral **completa** sem erros JavaScript e sem requisições de rede; abertura de Anotações confirmada.
- Navegador Chromium: Pessoal/Organizações demonstrativos, cartões e modal de tarefa, confirmação/cancelamento de exclusão, remoção, duplicação +7 dias e relatórios por projeto/setor — aprovados.
- Simulação de Financeiro: relatório restrito somente aos itens do departamento visível — aprovada.
- CSV de tarefas — ação executada em demonstração. **Não foi ensaiada importação em todos os aplicativos de planilhas.**

Limites: não houve teste contra conta Supabase real, e-mail de convite real, pagamentos, métricas de escala, auditoria independente ou pentest. Testes automatizados não provam ausência de defeitos.
