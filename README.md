# TOPOS · Estudos

Versão separada do módulo de Estudos da TOPOS V5.4. **O Dashboard, o menu e todas as funções de Estudos foram mantidos**; apenas a seleção de Pessoal/Organizações foi retirada. Este é o único projeto que usa a marca TOPOS.

## Como abrir

1. Abra a pasta no VS Code / Live Server.
2. Configure `topos-config.js` com a URL e a chave **publicável** do mesmo projeto Supabase que já utiliza em Estudos. Nunca coloque `service_role` no navegador.
3. Acesse `index.html?entrar=1` para usar sua conta existente.
4. `estudos-demo.html` abre a interface educacional completa com dados fictícios, sem banco.
5. Antes de modificar banco ou publicar, exporte backup JSON e PDFs do Storage.

## Recursos mantidos

Dashboard, calendário, Meu Dia, matérias e PDFs, anotações/editor rico, questões, flashcards, revisões, metas de estudos, sessões/timer, dúvidas, eventos, favoritos, histórico, estatísticas e assistente IA (dependente de Edge Function configurada). Ditado por voz opcional preservado.

## Separação e dados

Os dados continuam no banco antigo `study_data` e no Storage privado, como na V5.4. **Não houve migração, exclusão nem redefinição de conta.** Pessoal e Organizações foram para outro projeto, com configuração independente.

## Segurança e testes

`historico-seguranca-v5.4/` contém as evidências e scripts de teste anteriores sem alterações, com hashes conferidos em `HISTORICO-SEGURANCA.md`. O histórico não equivale a homologação real de um novo ambiente. Novos testes ficam em `tests-atuais/`.

**Não use a nova interface com dados sensíveis sem testar os controles do Supabase.**

## Beta V5.5 — laboratórios integrados (14/11/2026)

Esta atualização preserva a aplicação V5.4 de Estudos e acrescenta cinco rotas originais: **Mapas mentais**, **Pesquisa acadêmica**, **Trilhas de aprendizagem**, **Estúdio de aulas** e **Ditado & transcrições**. O nome exibido na interface desta beta é **TOPOZ Estudos**; identificadores legados de código, banco e configurações permanecem como `topos` por compatibilidade.

Os dados dos novos módulos são objetos opcionais em `study_data.data.labs`; o arquivo demo não salva na nuvem e mostra aviso sobre o caráter temporário de suas alterações. Leia `ENTREGA_BETA_V5_5.md` para escopo, limites, licenças, resultados de testes e próximos passos. O diretório `historico-seguranca-v5.4/` não foi modificado.

Testes locais: `node tests-atuais/test_labs_node.cjs` e, com Playwright Python + Chromium disponíveis, `python tests-atuais/test_labs_browser.py`. A integração com Supabase real e testes de RLS dependem de homologação externa.

## Beta V5.6 — segurança, fila e planejamento (14/11/2026)

Nova versão incremental, em **staging por padrão**: `topos-config.js` usa placeholders (sem dados reais ou tokens). Mantenha `schemaVersion 4`; arquivos SQL de `migrations/v56/` não foram aplicados a nenhum banco. Antes de login real, faça backup, execute migrations em staging, teste isolamento A/B/anon e configure somente a chave pública de staging. Não configure segredo `service_role` no navegador.

Para abrir a demonstração offline, use `estudos-demo.html`. Para descobrir o escopo e pendências, **leia `STATUS-IMPLEMENTACAO.md` e `MIGRACOES.md`**. Os novos menus são `Fila de revisão` e `Planejamento inteligente` (planejador de regras locais; não é geração IA). A IA exige Edge Function, chave de provedor e ambiente homologado e não está habilitada neste pacote.

Testes: `node tests-atuais/test_v56_node.cjs`, `python tests-atuais/test_v56_browser.py` e suites da V5.5 em `tests-atuais/`. Mais detalhes em `RELATORIO-ENTREGA.md`.
