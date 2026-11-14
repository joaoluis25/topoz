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
