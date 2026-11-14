# Matriz de segurança por conta e recurso — V5.6

`A` e `B` representam identidades autenticadas diferentes; `anon` representa pessoa não autenticada. **Esperado** indica controle pretendido, **não** resultado medido. A homologação exige tokens de staging e logs/auditoria específicos, sem imprimir conteúdos privados.

| Recurso / ação | A sobre A | A sobre B | B sobre A | anon | Estado |
|---|---|---|---|---|---|
| `study_data` SELECT próprio | Permitir | Negar | Negar | Negar | SQL legado; teste real pendente |
| `study_data` INSERT/UPDATE/DELETE | Permitir para próprio | Negar | Negar | Negar | Policies legadas; revisão completa pendente |
| RPC `save_study_data_v56` | Permitir com versão esperada | Não pode escolher user_id | Não pode escolher user_id | Negar | Novo SQL, não implantado |
| Storage bucket `study-materials` | Permitir prefixo UID | Negar | Negar | Negar | SQL legado; enforcement de cota pendente |
| `study_drafts` | Permitir com `user_id=A` | Negar | Negar | Negar | SQL legado; revisão pendente |
| `study_ai_usage`, `study_ai_requests` | Negar acesso direto | Negar | Negar | Negar | Novo SQL; **service_role apenas na Edge** |
| RPC `claim_study_ai_v56` | Negar acesso direto | Negar | Negar | Negar | Novo SQL; invocação service_role na Edge |
| Edge `study-ai` | JWT válido com limite/cota | Não aceita ID arbitrário | Não aceita ID arbitrário | 401 | Código pronto, integração real pendente |

**Casos obrigatórios:** A ler B, B ler A, A alterar B, anon ler/inserir, `revision` desatualizada em 2 abas, bucket público, MIME e tamanho efetivo de PDF, arquivo órfão, cotas de IA concorrentes, origin CORS não autorizado, JWT expirado/forjado, cache isolado entre A/B, logout/rascunhos e backup/importação. Nenhum desses testes de Supabase real foi executado nesta sessão.
