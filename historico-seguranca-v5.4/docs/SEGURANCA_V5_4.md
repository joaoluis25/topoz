# TOPOS V5.4 — Segurança, evidências e lacunas

**Status:** desenho e testes simulados; **ainda não homologado contra Supabase de verdade**. Não afirmamos conformidade LGPD, certificações ou ausência de vulnerabilidades.

## Inventário e mudanças

| Identificador | Objeto | Risco | Medida nesta entrega | Evidência / status |
|---|---|---|---|---|
| SEC-001 | `study_data` legado | Acesso indevido ou conflito de edição | Código preservado; não tocamos nas políticas de produção | Isolamento real **pendente de prova** |
| SEC-002 | `tp_can_edit_scope` em 001 | Integrante de departamento podia editar tarefas de todo o setor | `004` limita a owner, manager e lead explícito | SQL criado, não executado no banco |
| SEC-003 | Status de tarefa atribuída | Colaborador necessita executar sem editar tudo | RPC escopada `tp_set_assigned_task_status` e `tp_can_work_on_task` | Sintaxe de JS validada, SQL **a homologar** |
| SEC-004 | Checklist da tarefa | Colaborador precisa atualizar apenas tarefa atribuída | Políticas em 004; UI condiciona ações ao vínculo | Simulação visual, teste de banco pendente |
| SEC-005 | Conversas da tarefa | Participante autorizado pode comentar, não alterar mensagem de terceiro | Policies de INSERT por autor e leitura por escopo | Simulação visual, teste de banco pendente |
| SEC-006 | Perfis profissionais | Dados entre departamentos | `003` cria RLS por setor ou gestor; dados pessoais não entram | SQL não executado; conferir Financeiro vs RH |
| SEC-007 | Comunicados | Vazamento de avisos departamentais | RLS org+setor e publicação apenas por gestor; filtro na UI | SQL não executado; conferir acesso cruzado |
| SEC-008 | Exportação | Download de dados de terceiros | Cliente exporta somente registros previamente visíveis; nenhuma query sem escopo nova | Teste de fluxo local; **API/RLS precisa garantir escopo** |
| SEC-009 | Reconhecimento de voz | Áudio enviado a provedor do browser sem ciência do usuário | Ativação explícita, indicação de disponibilidade e edição prévia | Teste de inserção; tratamento externo depende do navegador |
| SEC-010 | XSS em cards/perfis | HTML não confiável injetado em templates | Escapamento de texto por `E` e atributos por `att`, sem HTML livre em novos módulos | Testes locais; análise e pentest ainda necessários |
| SEC-011 | Trial e cobrança | Acesso indevido após expirar | Controle inicial no banco da V5.3 preservado; ausência de gateway real | Não homologado em Supabase nem pagamentos |
| SEC-012 | Administração global | Superadmin poderia violar privacidade | Não criado; arquitetura futura deve usar suporte mínimo auditável | Fora do escopo por determinação do usuário |

## Matriz de isolamento para executar no Supabase de homologação

Cada linha deve ser executada em chamadas **diretas à API/SQL como o usuário autenticado**, não só pela visibilidade de botões.

| Identidade | Ação | Resultado obrigatório |
|---|---|---|
| Usuário Pessoal A | Ler `study_data` de B | **Negado / zero linhas** |
| Colaborador Financeiro A | Ler tarefas, perfis e comunicados privados de RH A | **Negado** |
| Colaborador RH A | Ler dados restritos do Financeiro A | **Negado** |
| Gestor geral A com delegação | Ler os departamentos corporativos autorizados | **Permitido e auditável** |
| Gestor geral A | Ler notas ou metas pessoais de qualquer funcionário | **Negado** |
| Colaborador comum A | Atualizar título/prazo de tarefa de outro membro | **Negado** |
| Colaborador atribuído A | Mudar status da própria tarefa via RPC | **Permitido**, se ainda membro e com trial/plano autorizado |
| Colaborador A | Usar RPC para alterar tarefa de outro setor ou ID arbitrário | **Negado** |
| Usuário B, outra empresa | Consultar projetos e relatórios da empresa A | **Negado** |
| Ex-membro removido de A | Ler dados corporativos de A | **Negado após revogação** |
| Integrante autorizado | Inserir comentário com `author_id` de outro usuário | **Negado** |
| Anônimo | Consultar perfis, comunicados, tarefas e Storage corporativos | **Negado** |
| Gerente A | Solicitar exportação de relatório | **Somente registros autorizados**, inclusive anexos |
| Usuário após fim do trial | Criar/alterar conteúdo sem assinatura válida | **Negado conforme contratos**, preservando leitura/exportação autorizada |

## Histórico de testes

| Teste | Versão | Ambiente | Resultado | Limitação |
|---|---|---|---|---|
| Títulos/cards e campos de projetos | V5.4 | Chromium demo | Aprovado | Dados fictícios |
| Perfis, organograma e comunicados | V5.4 | Chromium demo | Aprovado | RLS simulada na UI |
| Temas e configuração | V5.4 | Chromium demo | Aprovado | Preferência local, não sincronizada |
| Downloads XLSX/DOCX/PDF | V5.4 | Chromium demo + renderização | Aprovado | Dados fictícios; cargas pequenas |
| Inserção de transcrição revisada | V5.4 | Chromium com texto simulado | Aprovado | Não testa reconhecimento externo real |
| Autenticação | V5.3/V5.4 | Supabase simulado | Aprovado nos cenários automatizados | Não prova login real |
| RBAC Financeiro/RH | V5.4 | Chromium, duas visões fictícias | Aprovado visualmente | **Não prova banco ou API** |
| Tentativa de injeção HTML em card | V5.4 | Chromium demonstrativo | Texto escapado, sem execução de script | Não substitui auditoria XSS completa |
| SQL 003/004 | V5.4 | Revisão estática | Escrito e revisado, **não executado** | Requer staging com perfis reais |
| Pentest, scan SAST/DAST e dependências | — | — | Pendente | Não executado |
| Carga, indisponibilidade, restore de backups e PDFs | — | — | Pendente | Não executado |

**Ciclo de validação:** identifique commit/artefato, data, operador, resultado e evidência de cada teste. Reexecute os testes afetados após qualquer alteração de políticas, dependências, login ou schema. Use OWASP ASVS como guia, sem afirmar certificação.

## Estratégia para produção

1. Nunca usar credencial de serviço no browser; chaves públicas Supabase são permissíveis, mas não substituem RLS.
2. Políticas restritivas `deny by default`, escopadas por user/org/dept e recurso; testar inclusão de usuários novos e remoção.
3. MFA para gestores, rate limit de convites/logins, auditoria de alterações sensíveis e prevenção de enumeração.
4. Storage privado, tokens temporários, limite e análise de PDFs/anexos; backups verificáveis separadamente.
5. Pagamentos só com webhooks assinados e autorizações server-side; nada de poder premium liberado somente por JS.
6. Backups, exportação e deleção com procedimentos controlados, revisão LGPD, monitoramento de erros e planos de incidente.

**Bloqueio comercial:** a aplicação não deve receber dados de empresas reais até os testes de isolamento e segurança de staging serem aprovados.
