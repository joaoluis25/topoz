/* TOPOS - configuracao PUBLICA do Supabase para teste da conta existente.
 * Conexao herdada da V4. NAO use esta instancia para testes de migracao ou
 * testes de escrita de novos modulos: prefira um Supabase de homologacao.
 * A chave publishable/anon e publica; NUNCA inclua service_role ou tokens privados.
 * Para alternar ao staging, troque SOMENTE os valores abaixo.
 */
window.TOPOS_PUBLIC_CONFIG = Object.freeze({
  url: 'https://btyxrzknkygylvnrzsuo.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0eXhyemtua3lneWx2bnJ6c3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDk4NzgsImV4cCI6MjEwNDEyNTg3OH0.aJwjeWU16xe5909SodLvkhhjUu8FiVbiNZvNE65jSlk'
});
