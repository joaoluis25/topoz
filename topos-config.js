/* TOPOZ Estudos V5.6 — configuração pública de STAGING, sem chaves no pacote.
 * COPIE os seus valores públicos já existentes apenas quando o ambiente estiver homologado.
 * O arquivo precisa estar AO LADO de index.html. Não use chaves secret/service_role.
 * Nunca coloque service_role aqui. Mantenha produção isolada.
 */
window.TOPOS_PUBLIC_CONFIG=Object.freeze({
  url:'https://SEU-STAGING.supabase.co',
  anonKey:'SUA_CHAVE_PUBLICAVEL_DE_STAGING'
});
