# Segurança e critérios de aceite — TOPOS V5

## Controles já codificados, mas não homologados

- Autenticação via Supabase Auth existente, sem credencial de serviço no navegador.
- Entidades relacionalmente separadas: `tp_profiles`, `tp_organizations`, `tp_memberships`, `tp_departments`, `tp_department_members`, `tp_projects`, `tp_goals`, `tp_tasks`, `tp_invites` e `tp_activity`.
- Políticas RLS no novo esquema: dados pessoais limitados ao proprietário; dados corporativos dependem de vínculo ativo e departamento, com gestor geral designado; operações de administração de membros através de RPCs controlados.
- Convites aleatórios de uso único, hash SHA-256, duração de 7 dias, limite de 10 membros no trial.
- Verificações de que projeto, tarefa, meta e responsável não pertencem a escopo incompatível.
- Estado de assinatura controlado por funções do banco; interface não cria nem ativa uma assinatura por conta própria.
- Escape de texto não confiável na UI TOPOS e isolamento de CSS do módulo novo.

Esses controles representam uma **primeira implementação para avaliação**. Nenhum teste de isolamento real, pentest, análise de código independente ou auditoria LGPD foi executado.

## Casos bloqueadores de acesso (usar duas a quatro contas reais em STAGING)

| Caso | Tentativa | Resultado obrigatório |
|---|---|---|
| SEC-01 | Financeiro tenta `SELECT tp_tasks` de departamento RH | Zero registros, inclusive via API direta |
| SEC-02 | RH tenta `UPDATE` tarefa do Financeiro por UUID conhecido | Negado, nenhum registro alterado |
| SEC-03 | Gestor designado pelo proprietário lista RH + Financeiro | Somente os registros corporativos autorizados |
| SEC-04 | Mesmo gestor tenta consultar tarefa pessoal de funcionário | Negado |
| SEC-05 | Colaborador remove `organization_id` do payload ou troca para outro tenant | Negado pelo RLS ou trigger |
| SEC-06 | Colaborador tenta atualizar papel em `tp_memberships` | Negado; somente RPC do proprietário |
| SEC-07 | Convite vencido/reutilizado ou 11º membro no trial | Negado |
| SEC-08 | Membro removido tenta reutilizar sessão e link de tarefa | Negado imediatamente após revogação no banco |
| SEC-09 | Usuário atribui tarefa confidencial a pessoa sem acesso ao departamento | Negado pelo trigger |

### Testes adicionais

- XSS nos nomes/títulos de projeto, HTML de estudos, anexos e convites; CSRF e redirecionamentos de autenticação; sessão expirada; MFA de gestores.
- Verificar que exportações, buscas, relatórios e notificações só contêm os dados acessíveis.
- Invocar RPCs com parâmetros manipulados; testar concorrência de convites e cotas.
- Testar concorrência entre dois dispositivos, edição simultânea e perda de rede.
- Auditoria de chamadas públicas, políticas de armazenamento e DNS/HTTPS.
- Teste de carga incremental com registros reais e medição de latência/CPU/memória.

## Riscos importantes ainda abertos

1. **Estudos legados:** ainda usa `study_data` (JSON por usuário) e as próprias políticas da instalação. O novo SQL **não protege essa tabela automaticamente**.
2. **Sem criptografia ponta a ponta:** PostgreSQL e Storage dependem da segurança de infraestrutura do provedor, configurações corretas e controle de chaves.
3. **Sem classificações finas:** gestor geral pode ler departamentos corporativos por função; conteúdos sigilosos de RH/financeiro exigirão regras adicionais antes de produção.
4. **Sem garantia de performance em escala:** a UI ainda carrega os primeiros 250 registros por tipo; paginação e consultas por período serão necessárias.
5. **Sem pagamento:** qualquer status `active` deverá ser alterado somente por backend confiável após confirmação de pagamento; nenhum código incluído faz isso.
6. **Sem exportação completa:** exportação TOPOS cobre tarefas/metas/projetos acessíveis; a do legado não inclui bytes de PDFs; nenhum backup substitui recuperação de desastres do provedor.
7. **Sem conformidade certificada:** OWASP ASVS, WCAG 2.2 AA e LGPD são referenciais de trabalho, não declarações de certificação.

## Aceitação antes do lançamento

Todos os testes críticos com evidência, nenhuma vulnerabilidade crítica/alta sem resolução, restauração integral de dados e Storage, provas de pagamento e direitos de acesso, observabilidade, plano de incidentes, documentação legal revisada e pilotos com empresas reais.
