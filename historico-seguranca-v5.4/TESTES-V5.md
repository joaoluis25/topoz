# Testes da V5 — etapa 1

## Executado localmente

- `node --check` para o JavaScript inline extraído do HTML — aprovado.
- `tinycss2` (759 regras de topo) — sem erros de parsing.
- `node tests/regression.test.js` — aprovado: metas, normalização, ciclos, timer, flashcards e carregamento seguro.
- `python tests/v5_browser_smoke.py` em Chromium + Supabase **simulado** — aprovado:
  - cards de anotação e ação “Passou para o caderno”;
  - barra unificada de edição em anotações;
  - fonte no texto selecionado de anotações/questões, persistência após salvar e reabrir;
  - edição de matéria e cor;
  - upload de PDF com mock de Storage;
  - preenchimento automático de matéria/dificuldade;
  - ocultar caderno em questões sem ocultar anotações;
  - abertura em desktop e layout compacto de celular sem exceções JavaScript.
- Integridade do pacote ZIP verificada após a criação.

## Não testado/garantido

- Supabase Storage real: criação do bucket, upload, download, exclusão e isolamento entre duas contas requerem execução de `SUPABASE-PDFS.sql` e teste real.
- Sincronização concorrente em dois dispositivos, migração para tabelas separadas, testes de carga, pentest, integração de pagamentos, legal e operação comercial.
- Editor rich text é baseado em `contenteditable`, e não em um editor transacional colaborativo. O funcionamento pode variar entre navegadores; exige teste adicional em Safari/iOS e Android antes de produção.
- O backup JSON inclui **somente metadados dos PDFs**; os bytes precisam ser preservados em backup próprio do Storage.
