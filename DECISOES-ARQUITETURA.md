# Decisões de arquitetura da V5.6

1. **Preservar dados legados**: `schemaVersion:4` dentro do JSON permanece. A migração SQL altera apenas coluna `revision` e cria RPC de persistência com CAS; não reestrutura listas, IDs ou tabelas antigas. Não atualizar produção sem staging.
2. **Não fazer escrita cega**: telas de conta real só carregam com coluna `revision`; se não estiver migrado, bloqueiam edição. Um conflito deve ser resolvido com backup e recarga/manual merge, nunca sobrescrevendo automaticamente.
3. **IA somente em servidor**: o navegador envia JWT e texto para a função Edge. Chave de provedor e `service_role` ficam no ambiente da Edge, nunca em JS/HTML. A chamada pode envolver transferência de material para provedor terceirizado.
4. **Cota/Cache no banco**: `claim_study_ai_v56` usa chave SHA-256 por requisição e usuário, lock transacional por chave e quota atômica diária. Cache/uso ficam indisponíveis a `anon`/`authenticated` em queries diretas; somente `service_role` da Edge. Falhas do provedor **consomem uma cota**; política sujeita a revisão.
5. **Aprovação explícita**: saídas da IA só viram anotação com clique e confirmação humana. Planejamento é determinístico, sem promessa de IA e igualmente exige aprovação antes de criar eventos.
6. **Separação de ambientes**: para evitar escrita acidental na instância legado/produção, configuração incluída no ZIP é um placeholder STAGING. A V5.5 original continua intacta no ZIP anterior para rollback.
7. **Sanitização prioritária**: sem DOMPurify o conteúdo HTML é escapado como texto. A dependência CDN não foi substituída por vendor local, logo políticas CSP/SRI ainda não estão prontas.
8. **Privacidade**: não integra Pessoal & Organizações, sem compartilhamento multiusuário ou migração destrutiva. Não armazena chave privada no frontend.
9. **Licenças**: mantém código próprio desenvolvido na V5.5 sem incorporar código de Anki, LearnHarness, WiseMapping, Academic Research Skills, OpenMAIC ou OpenWhispr. Consulte `ENTREGA_BETA_V5_5.md`.
