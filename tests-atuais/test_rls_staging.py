"""Teste A/B/anon somente de LEITURA em projeto de homologação do Supabase.
Requer duas contas descartáveis de staging e seus JWT; não imprime conteúdo privado.
Uso: TOPOZ_CONFIRM_STAGING_ONLY=YES STAGING_SUPABASE_URL=... STAGING_ANON_KEY=...
     STAGING_JWT_A=... STAGING_USER_ID_A=... STAGING_JWT_B=... STAGING_USER_ID_B=...
     python tests-atuais/test_rls_staging.py
NÃO execute em produção. Não testa escrita, delete nem SQL ao vivo.
"""
import os,sys,urllib.request,urllib.parse,json
keys='STAGING_SUPABASE_URL STAGING_ANON_KEY STAGING_JWT_A STAGING_USER_ID_A STAGING_JWT_B STAGING_USER_ID_B'.split()
if os.getenv('TOPOZ_CONFIRM_STAGING_ONLY')!='YES' or any(not os.getenv(k) for k in keys):
 print('NÃO EXECUTADO: requer autorização explícita, dois JWT de STAGING e URL de homologação.')
 sys.exit(2)
url=os.environ['STAGING_SUPABASE_URL'].rstrip('/')
assert url.startswith('https://') and '.supabase.co' in url
anon=os.environ['STAGING_ANON_KEY']
users={x:{'id':os.environ[f'STAGING_USER_ID_{x}'],'token':os.environ[f'STAGING_JWT_{x}']} for x in ('A','B')}
def get(token,target):
 query=urllib.parse.urlencode({'select':'user_id,revision','user_id':'eq.'+target})
 req=urllib.request.Request(url+'/rest/v1/study_data?'+query,headers={'apikey':anon,'Authorization':'Bearer '+(token or anon),'Accept':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=10) as resp:
   return resp.status,json.loads(resp.read().decode())
 except urllib.error.HTTPError as e:return e.code,None
for label,u in users.items():
 st,own=get(u['token'],u['id'])
 assert st==200 and isinstance(own,list) and len(own)==1, f'{label} não leu a própria linha (sem extrair dados sensíveis)'
 other=users['B' if label=='A' else 'A']['id']
 st,rows=get(u['token'],other)
 assert st==200 and rows==[], f'FALHA: {label} pode ler o registro alheio'
 print(f'{label}: própria linha visível; linha alheia não visível')
for label,u in users.items():
 st,rows=get(None,u['id']);assert st in (401,403) or (st==200 and rows==[]),f'FALHA: anon leu {label}'
print('LEITURA RLS EM STAGING: PASSOU. Ainda faltam políticas de INSERT/UPDATE/DELETE/Storage e concorrência reais.')
