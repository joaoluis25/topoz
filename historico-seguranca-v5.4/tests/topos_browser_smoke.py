"""Browser smoke with a fake, in-memory Supabase. NOT an RLS/security test.
Runs the actual HTML/CSS/topos.js bundle using Chromium via local HTTP.
"""
import asyncio, contextlib, http.server, threading, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
LEGACY={"schemaVersion":4,"materials":[],"topics":[{"id":"mat01","name":"Português","parentId":None,"color":"teal"}],"notes":[{"id":"nota01","title":"Leitura de prova","html":"<p>Conteúdo de estudos preservado.</p>","topicId":"mat01","createdAt":"2026-11-05T00:00:00Z","updatedAt":"2026-11-05T00:00:00Z"}],"goals":[],"sessions":[],"events":[],"doubts":[],"questions":[],"flashcards":[],"settings":{}}
MOCK='''(() => {
const user={id:'00000000-0000-4000-8000-000000000001',email:'teste@topos.example'};
const db={tp_profiles:[{user_id:user.id,plan_code:'trial',subscription_status:'trialing',trial_started_at:'2026-11-07T12:00:00Z'}],tp_organizations:[],tp_memberships:[],tp_departments:[],tp_department_members:[],tp_tasks:[],tp_projects:[],tp_goals:[],tp_activity:[],study_data:[{user_id:user.id,data:DATA_LEGACY}]};
window.__testDB=db; window.__testUser=user;
const id=()=> 'a'+Math.random().toString(16).slice(2).padEnd(31,'0').slice(0,31);
const ref=(table) => {
 const f=[]; let method='get',body,cols='*',sort=null,range=null;
 const api={
 select(str='*'){cols=str;return api},
 eq(key,value){f.push(row=>row[key]===value);return api},
 is(key,value){f.push(row=>row[key]===null);return api},
 in(key,arr){f.push(row=>arr.includes(row[key]));return api},
 order(key,options={}){sort=[key,options.ascending!==false];return api},
 range(a,b){range=[a,b];return api},
 insert(value){method='insert';body=value;return api},
 update(value){method='update';body=value;return api},
 delete(){method='delete';return api},
 upsert(value){method='upsert';body=value;return api},
 then(resolve,reject){return Promise.resolve(run(false)).then(resolve,reject)},
 single(){return Promise.resolve(run(true))},
 maybeSingle(){return Promise.resolve(run(true))}
 };
 function run(one){let coll=db[table]||[];let entries=coll.filter(x=>f.every(fn=>fn(x)));
 if(method==='insert'){const arr=Array.isArray(body)?body:[body];entries=arr.map(p=>({...p,id:p.id||id(),created_at:p.created_at||new Date().toISOString()}));coll.push(...entries)}
 else if(method==='update'){entries.forEach(x=>Object.assign(x,body))}
 else if(method==='delete'){for(const x of entries)coll.splice(coll.indexOf(x),1)}
 else if(method==='upsert'){return {data:null,error:null}}
 if(sort)entries.sort((a,b)=>((a[sort[0]]||'')>(b[sort[0]]||'')?1:-1)*(sort[1]?1:-1));
 if(range)entries=entries.slice(range[0],range[1]+1);
 return {data:one?entries[0]||null:entries,error:null}; }
 return api;
};
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})},storage:{from:()=>({upload:async()=>({error:null}),createSignedUrl:async()=>({data:{signedUrl:'https://example.test/obj'},error:null}),remove:async()=>({error:null})})},from:ref,rpc:async(name,args={})=>{
 if(name==='tp_init_profile')return {data:null,error:null};
 if(name==='tp_create_organization') {const org={id:id(),owner_id:user.id,name:args.org_name,trial_started_at:new Date().toISOString(),subscription_status:'trialing',plan_code:'trial'};db.tp_organizations.push(org);db.tp_memberships.push({organization_id:org.id,user_id:user.id,role:'owner',active:true});return {data:org.id,error:null}}
 if(name==='tp_create_invite')return {data:'a'.repeat(48),error:null};
 if(name==='tp_accept_invite')return {data:db.tp_organizations[0]?.id,error:null};
 return {data:null,error:null};}})};
})();'''.replace('DATA_LEGACY',json.dumps(LEGACY,ensure_ascii=False))
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
async def test():
 issues=[]
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**kw:QuietHandler(*a,directory=str(ROOT),**kw))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda error:issues.append(str(error)))
  page.set_default_timeout(4500)
  html=(ROOT/'index.html').read_text()
  html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'style.css').read_text()+'</style>')
  html=html.replace('<link rel="stylesheet" href="topos.css">','<style>'+(ROOT/'topos.css').read_text()+'</style>')
  import re
  html=re.sub(r'<link[^>]*href="https://fonts.googleapis.com[^>]*>', '', html)
  html=re.sub(r'<link[^>]*rel="icon"[^>]*>', '', html)
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/dompurify[^>]*></script>', '<script>window.DOMPurify={sanitize:(x)=>x};</script>', html)
  html=html.replace('<script src="topos-config.js"></script>','<script>'+(ROOT/'topos-config.js').read_text()+'</script>')
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/@supabase[^>]*></script>', '<script>'+MOCK+'</script>', html)
  html=html.replace('<script src="topos.js"></script>','<script>'+(ROOT/'topos.js').read_text()+'</script>')
  html=html.replace('<body>', '<body><script>window.__cache={};Object.defineProperty(window,"localStorage",{value:{getItem(k){return window.__cache[k]||null},setItem(k,v){window.__cache[k]=String(v)},removeItem(k){delete window.__cache[k]}}});</script>',1)
  await page.set_content(html,wait_until='domcontentloaded',timeout=20000)
  print('loaded', (await page.locator('body').inner_text())[:240].replace('\n',' '), 'issues', issues, flush=True)
  await page.wait_for_selector('.tp-space-grid')
  assert await page.locator('.tp-space-card').count()==3,'Three spaces not available'
  assert await page.get_by_text('Pessoal',exact=True).count()>=1
  assert not issues,issues
  await page.screenshot(path=str(ROOT/'tests/topos-inicio.png'),full_page=True)
  await page.locator('.tp-space-card').first.click()
  await page.wait_for_selector('.tp-stats')
  await page.get_by_role('button',name='+ Nova tarefa').click()
  await page.locator('#tpTaskForm input[name=title]').fill('Revisar metas da semana')
  await page.locator('#tpTaskForm input[name=planned_on]').fill('2026-11-07')
  await page.locator('#tpTaskForm button[type=submit]').click()
  await page.wait_for_timeout(150)
  assert len(await page.evaluate('window.__testDB.tp_tasks'))==1,'Task not persisted in mock'
  await page.get_by_role('button',name='Planejamento').click()
  await page.get_by_role('button',name='Quadro').click()
  assert await page.locator('.tp-task-card').count()==1
  await page.locator('.tp-card-next').first.click()
  await page.wait_for_timeout(150)
  assert (await page.evaluate('window.__testDB.tp_tasks[0].status'))=='doing'
  await page.get_by_role('button',name='Metas').first.click()
  await page.get_by_role('button',name='+ Nova meta').click()
  await page.locator('.tp-modal input[name=title]').fill('Ler três livros')
  await page.locator('.tp-modal form button.tp-button').click()
  assert len(await page.evaluate('window.__testDB.tp_goals'))==1
  await page.get_by_role('button',name='Projetos').first.click()
  await page.get_by_role('button',name='+ Novo projeto').click()
  await page.locator('.tp-modal input[name=title]').fill('Plano de desenvolvimento')
  await page.locator('.tp-modal form button.tp-button').click()
  assert len(await page.evaluate('window.__testDB.tp_projects'))==1
  await page.get_by_role('button',name='Calendário').first.click()
  assert await page.locator('.tp-calendar-grid').count()==1
  await page.screenshot(path=str(ROOT/'tests/topos-desktop.png'),full_page=True)
  # Org-specific queries, department and owner role UI.
  await page.get_by_role('button',name='Trocar espaço').click()
  await page.get_by_role('button',name='+ Nova organização').click()
  await page.locator('.tp-modal input[name=name]').fill('Organização Aurora')
  await page.locator('.tp-modal form button.tp-button').click()
  await page.wait_for_selector('.tp-stats')
  assert await page.get_by_text('Organização Aurora',exact=True).count()>=1
  await page.get_by_role('button',name='Departamentos').click()
  await page.get_by_role('button',name='+ Departamento').click()
  await page.locator('.tp-modal input[name=name]').fill('Financeiro')
  await page.locator('.tp-modal form button.tp-button').click()
  await page.wait_for_timeout(200)
  assert len(await page.evaluate('window.__testDB.tp_departments'))==1
  await page.get_by_role('button',name='Equipe e acessos').click()
  await page.get_by_role('button',name='+ Criar convite').click()
  await page.locator('.tp-modal form button.tp-button').click()
  await page.wait_for_timeout(100)
  assert await page.locator('.tp-code').count()==1
  await page.set_viewport_size({'width':390,'height':844})
  await page.screenshot(path=str(ROOT/'tests/topos-mobile.png'),full_page=True)
  assert await page.locator('.tp-mobile-nav').is_visible(),'Mobile navigation unavailable'
  await page.evaluate('TOPOS.openStudy()')
  await page.wait_for_selector('.topbar')
  await page.evaluate("navigate('anotacoes')")
  assert await page.locator('.note-card-v5').count()==1,'Legacy note lost'
  await page.evaluate('TOPOS.home()')
  # When 30-day trial expires the new planner is read-only.
  await page.evaluate("TOPOS.state.profile.trial_started_at='2026-01-01T00:00:00Z'")
  await page.evaluate('TOPOS.enterPersonal()')
  await page.wait_for_selector('.tp-readonly-banner')
  assert await page.get_by_role('button',name='+ Nova tarefa').count()==0
  assert not issues,issues
  print('PASS: hub/pessoal/estudos/organização, tarefas CRUD/status, metas, projetos, calendário, departamentos, convite, responsividade, trial bloqueado (Supabase simulado).')
  await browser.close()
 server.shutdown()
if __name__=='__main__':asyncio.run(test())
