# Correção de conexão — TOPOZ Estudos V5.6.1

## O que causou a mensagem de erro

Na V5.6, `topos-config.js` foi distribuído com **placeholders** de staging e a validação da URL exigia correspondência exata com `https://…supabase.co`. Uma barra final ou domínio personalizado disparava o aviso **antes de qualquer tentativa de login**. Outra possibilidade era editar um arquivo diferente do efetivamente carregado.

## Como configurar sem divulgar chaves

1. Extraia esta nova versão em uma pasta diferente da antiga, sem sobrescrever seus arquivos existentes de forma automática.
2. Localize o `topos-config.js` **efetivamente usado** na instalação antiga. Preserve o seu original em backup privado.
3. No arquivo da nova versão, mantenha os nomes `url` e `anonKey` exatamente como estão e substitua **somente** os valores de exemplo pelos dados públicos do mesmo projeto Supabase que já utiliza (ou do staging devidamente homologado). A chave deve ser `sb_publishable_...` ou a JWT `anon` antiga. Nunca use `sb_secret_...`, `service_role`, senha ou token de usuário.
4. Execute pelo VS Code Live Server ou um servidor local, usando `index.html?entrar=1`. Evite misturar arquivos de versões diferentes e não use o `estudos-demo.html` para entrar em conta real.
5. Visite `diagnostico-conexao.html` na **mesma pasta/servidor** e confira o diagnóstico local. Clique em “Verificar Supabase” para testar contato com o serviço de autenticação; a chave não é exibida.
6. Se ainda falhar, pressione F12 → Rede, recarregue e confira se `topos-config.js` e `topoz-connection.js` retornam HTTP 200 e não estão bloqueados. Não envie sua chave nem sua senha para ninguém.

## Ajustes técnicos

- URL normalizada: espaços nas extremidades e barra final são aceitos, resultando na origem HTTPS.
- Suporte a domínios personalizados HTTPS e Supabase local via HTTP em `localhost`/`127.0.0.1`.
- Rejeição de caminhos extras (`/rest/v1`), query/fragmentos, URL com credenciais, placeholders e chaves administrativas.
- Mensagens diferentes para script ausente, `url` faltante, `anonKey` faltante, URL incorreta, chave de formato inadequado e papel JWT não-`anon`.
- Mesmo validador na página de login, diagnóstico de conexão e retorno de autenticação.
- **Nenhuma chave real foi incorporada a esta versão.** SQL e dados de usuários não foram alterados.

## Limite de segurança

O diagnóstico de formato não comprova que a chave esteja ativa ou que o RLS esteja homologado. O botão de teste verifica resposta da API de autenticação, não permissões RLS. Faça backup e testes A/B/anon em ambiente controlado antes de conectar a V5.6.1 a dados reais.
