# Estado da V5.7.0 beta incremental

| Escopo | Estado honesto |
|---|---|
| Preservação `schemaVersion:4`, RPC v56 e config sem segredos | **Mantido no código**, banco remoto não tocado |
| Calculadora CALC-1 | **Integrada ao front**; 240 testes do motor aprovados, smoke UI local |
| Exportação inicial de anotações | **DOCX local e impressão A4 para salvar como PDF**, sem imagens incorporadas nem sumário avançado; testado com python-docx |
| SIM básico | **Funcional na demo** (questões A–E, seleção, prova, correção); recursos completos SIM-1/2/3 pendentes |
| UX landing e preços 4 planos | **Implementados como proposta**, sem checkout |
| Modais / mobile / `topicId` | **Correções iniciais implementadas e testadas**; auditoria WCAG completa pendente |
| IA contextual (23 tarefas catalogadas) | **Front e gateway implementados**; não se pode declarar IA em produção funcional sem implantar e validar provedor em STAGING |
| Consentimento e cotas IA | **SQL 003 escrito**, não aplicado; teste com banco real pendente |
| LGPD e cobrança | **Não homologado**; sem cobrança ativa |
| RAG, STT, OCR, bibliotecas de pesquisa, mapas/estúdio avançados | **Ainda não integrados** |
| Segurança RLS/Storage A/B/anon, CSP, bibliotecas locais | **Pendentes** (não declarar seguro para venda) |

A versão entregue é incremental, não a implementação exaustiva dos centenas de requisitos recebidos. Tudo que exige banco, segredos, compra de serviços ou testes reais está separado para evitar afetar dados existentes.
