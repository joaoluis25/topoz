# TOPOZ Estudos — Beta V5.5 · módulos incrementais

Data: 14/11/2026. Base utilizada: `TOPOS-ESTUDOS-INDEPENDENTE.zip` (V5.4, extraída de arquivos do usuário). A versão anterior permanece preservada no arquivo ZIP original.

## O que foi implementado em código

A aplicação continua HTML/CSS/JavaScript e com os recursos originais (dashboard, matérias, anotações, questões, flashcards, revisões, calendário, sessões, metas, dúvidas, histórico, configurações e assistente existente). Adicionamos os arquivos `topos-labs.js` e `topos-labs.css` e cinco novas rotas visíveis na barra lateral, tanto na versão autenticada quanto na demonstração.

1. **Mapas mentais:** coleções com tema central, ideias e subideias hierárquicas, editar/excluir ramos, exportação Markdown; não é o editor gráfico com drag-and-drop completo do WiseMapping.
2. **Pesquisa acadêmica:** perguntas de pesquisa, hipóteses, fontes adicionadas manualmente (autor, ano, URL http/https, status e anotações), síntese e exportação Markdown. **Não há busca automática, auditoria de fontes ou geração de citações por IA.**
3. **Trilhas:** metas de aprendizagem, etapas marcáveis, cálculo de progresso, exportação Markdown.
4. **Estúdio de aulas:** roteiros em texto editável, vínculo opcional a matéria, exportação Markdown e criação em lote de flashcards usando linhas `Pergunta | Resposta`. Não gera vídeos, slides interativos ou professores por IA.
5. **Ditado e transcrições:** área dedicada para reconhecimento de fala nativo do navegador, revisão manual e salvamento do texto, conversão opcional em anotação; sem gravação, upload ou transcrição de arquivo de áudio. A ferramenta original de ditado dentro das anotações também permanece.

**Persistência:** novos dados vivem em `study_data.data.labs` (colunas e nomes existentes não mudaram); o normalizador preserva coleções legadas. No modo demo, os registros são voláteis e o aviso é visível. Para uma conta real, o salvamento usa as rotinas Supabase já existentes; não foi feito teste contra instância Supabase real. O nome visível foi ajustado para **TOPOZ** sem alterar nomes legados de arquivos, banco ou chaves `TOPOS_*`.

## Matriz dos seis projetos de referência

| Projeto recebido | Licença identificada no ZIP | Decisão para esta beta | Lacuna até equivalência |
|---|---|---|---|
| `academic-research-skills-3.24.3.zip` | CC BY-NC 4.0 (não comercial) | Não utilizar código/conteúdo do pacote; desenvolver workflow original de pesquisa | pesquisa assistida por IA, auditoria bibliográfica, métodos especializados |
| `anki-main.zip` | AGPL-3.0-or-later | Manter flashcards/revisões próprios; acrescentar geração em lote a partir de texto | importador `.apkg`, FSRS real, decks avançados e sincronização Anki |
| `learnharness-main.zip` | AGPL-3.0 | Não integrar componentes desktop/agent; trilhas originais para organização do estudo | agentes locais, provedores de IA, sessões assistidas |
| `OpenMAIC-main.zip` | MIT | Estúdio de aulas original sem dependências/serviços externos | geração de mídias, aulas interativas, slides e vídeos por IA |
| `openwhispr-main.zip` | MIT | Aproveitar apenas o conceito de transcrição; usar Web Speech API, já compatível com o browser quando disponível | Whisper local, diarização, processamento offline e arquivos de áudio |
| `wisemapping-open-source-develop.zip` | WiseMapping Public License 1.0 (atribuição especial) | Editor hierárquico próprio; não importar implementação/bibliotecas | canvas interativo, arrastar e soltar, compartilhamento colaborativo |

Nenhuma linha de código destes seis projetos foi vendorizada ou incorporada à beta. São referências funcionais; suas licenças foram analisadas a partir dos arquivos LICENSE presentes nos ZIPs recebidos. Esse levantamento não substitui parecer jurídico.

## Testes executados

- Sintaxe JavaScript: `node --check topos-labs.js` — passou. Testes unitários sem dependências: `node tests-atuais/test_labs_node.cjs` — passou.
- Teste automatizado de interface (`tests-atuais/test_labs_browser.py`), Chromium/Playwright, carregando HTML+JS localmente sem chamadas de rede: novas rotas, CRUD de mapa com subideia, pesquisa/fonte com rejeição de URL `javascript:`, trilha/checklist, geração de flashcards, transcrição convertida em anotação, sete rotas originais e viewport móvel de 390 px — passou sem exceções de página.
- Verificação de normalização e backup: rotina `normalizeState` integrada às coleções opcionais `labs`, compatível com schemaVersion 4. **Sem homologação real de RLS ou armazenamento na instância Supabase do usuário.**

## Instruções rápidas

1. Extraia o ZIP completo sem excluir os arquivos originais e abra a pasta `TOPOS-ESTUDOS/` no VS Code.
2. Abra `estudos-demo.html` para explorar com dados de exemplo; as alterações no demo **não persistem** após atualizar a página.
3. Para contas reais, configure apenas a URL Supabase e a chave **publicável** em `topos-config.js`, mantendo o projeto antigo de Estudos. Abra `index.html?entrar=1` por Live Server/servidor HTTP.
4. Não configure chave `service_role` no frontend. Antes de implantar, faça backup de `study_data` e `storage`, teste importação/exportação de backup, autenticação e RLS com duas contas isoladas.
5. Novos campos são JSON opcionais e não exigem executar SQL, mas devem ser testados com políticas reais antes de declarar produção pronta.

## Limites e próximos passos recomendados

Esta **é uma beta funcional incremental**, não a portabilidade dos seis produtos open source. Em prioridade: testar armazenamento real com duas contas distintas; implementar importação controlada CSV/Anki e auditoria de revisão; ampliar mapas com canvas acessível; adicionar editor de slides e mediação de aulas com IA somente após definição de custo/permissões; avaliar transcrição local e upload com infraestrutura e privacidade apropriadas; testes automatizados cross-browser e mobile com dados persistidos. Não foram acionados serviços pagos nem alterados bancos reais.
