# Patch para TOPOZ Estudos Beta V5.6 -> V5.6.1

Este pacote corrige a verificação de conexão sem incluir, substituir ou ler `topos-config.js`. A configuração que você já preencheu deve continuar na mesma pasta do `index.html`.

1. Faça cópia de segurança da pasta V5.6 e, principalmente, do `topos-config.js` já configurado.
2. Extraia estes cinco arquivos e a documentação na **mesma pasta da V5.6**; confirme a substituição de `index.html`, `auth-callback.html` e `diagnostico-conexao.html`. O arquivo novo `topoz-connection.js` deve estar nessa mesma pasta.
3. Não altere o seu `topos-config.js` se ele já contém a URL e a chave pública corretas. O patch intencionalmente **não inclui** esse arquivo.
4. Abra `diagnostico-conexao.html` e veja a mensagem de validação; depois teste `index.html?entrar=1` por Live Server.
5. Se ainda houver problema, confira no navegador F12 > Rede se os arquivos `.js` carregam com HTTP 200. Não envie sua chave ou senha.

O patch não executa SQL, não altera Supabase e não autentica usuário automaticamente. As migrações V5.6 seguem exigindo homologação. Consulte também `CORRECAO-CONEXAO-V5-6-1.md`.
