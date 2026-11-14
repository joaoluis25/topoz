# Relatório de separação · TOPOS Estudos

**Origem:** TOPOS V5.4. **Escopo:** módulo Estudos (único projeto com marca TOPOS).

## Preservado
- `index.html` mantém o código completo de Estudos, rotas, editores, materiais, PDFs, questões, flashcards, revisões, sessões, estatísticas, assistente de IA e login Supabase.
- `style.css` copiado byte a byte da V5.4; `topos-design.css` mantém o estilo aprovado.
- `topos-voice.js`, `supabase/functions/study-ai/index.ts`, scripts históricos de Storage e proteção educacional.
- O banco de estudos NÃO foi migrado nem alterado.

## Removido da navegação da TOPOS
- Seletor Pessoal/Organizações, demo administrativa, módulos corporativos e seus scripts/CSS.
- A página pública foi ajustada apenas no texto para apresentar Estudos.

## Testes realizados agora
- Sintaxe JS dos scripts atuais: passou.
- `tests-atuais/test_estudos.py`: passou com dados fictícios e Chromium; Dashboard, 17 itens de navegação, anotações, matérias, questões, flashcards, revisões, metas e sessões.
- `tests/regression.test.js` da V5.4 ORIGINAL (antes de dividir): passou.
- Histórico de testes de segurança copiado sem alterações byte a byte, SHA-256 conferido, incluindo evidências que dependem do monólito original.

## NÃO testado
- Login com sua conta real, banco e PDFs no Supabase de produção; RLS real; recuperação de desastres; carga; IA paga.

## Recuperação
A versão anterior permanece disponível como `TOPOS-V5-4-EVOLUCAO-FUNCIONAL.zip` (arquivo anterior), sem modificação. Não execute scripts de migração automaticamente.
