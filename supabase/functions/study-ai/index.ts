// Desativação controlada da rota legada no STAGING: evitar contornar consentimento do ai-gateway.
// Não publique isoladamente na produção; teste migração 003 + ai-gateway antes.
export default { fetch: (_req: Request) => Response.json(
  {error:'Endpoint legado desativado. Utilize ai-gateway após consentimento.'},
  {status:410,headers:{'Cache-Control':'no-store'}}
)};
