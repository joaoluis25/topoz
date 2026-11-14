"""Demonstration-mode smoke: disconnected from TOPOS schema, does not touch remote tables."""
import asyncio, sys, json, http.server, threading, re
from pathlib import Path
from playwright.async_api import async_playwright
sys.path.insert(0,str(Path(__file__).parent))
from topos_browser_smoke import MOCK
ROOT=Path(__file__).resolve().parent.parent
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
# Force missing TOPOS tables, retain historical study_data.
MOCK_OFFLINE=MOCK.replace("if(name==='tp_init_profile')return {data:null,error:null};", "if(name==='tp_init_profile')return {data:null,error:{message:'relation tp_profiles does not exist'}};")
async def test():
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**kw:QuietHandler(*a,directory=str(ROOT),**kw))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 issues=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':940},device_scale_factor=1)
  page.on('pageerror',lambda err: issues.append(str(err)))
  page.set_default_timeout(6000)
  html=(ROOT/'index.html').read_text()
  for name in ('style.css','topos.css','topos-design.css'):
   html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(ROOT/name).read_text()}</style>')
  html=re.sub(r'<link[^>]*href="https://fonts.googleapis.com[^>]*>', '', html)
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/dompurify[^>]*></script>', '<script>window.DOMPurify={sanitize:(x)=>x};</script>', html)
  html=html.replace('<script src="topos-config.js"></script>','<script>'+(ROOT/'topos-config.js').read_text()+'</script>')
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/@supabase[^>]*></script>', '<script>'+MOCK_OFFLINE+'</script>', html)
  html=html.replace('<script src="topos.js"></script>','<script>'+(ROOT/'topos.js').read_text()+'</script>')
  html=html.replace('<body>', '<body><script>window.__cache={};Object.defineProperty(window,"localStorage",{value:{getItem(k){return window.__cache[k]||null},setItem(k,v){window.__cache[k]=String(v)},removeItem(k){delete window.__cache[k]}}});</script>',1)
  html=html.replace('<head>','<head><base href="http://127.0.0.1:'+str(server.server_port)+'/">',1)
  await page.set_content(html,wait_until='domcontentloaded',timeout=20000)
  await page.wait_for_selector('.tp-space-grid')
  assert not await page.locator('.tp-space-card').first.is_disabled()
  assert await page.locator('.tp-organization-card button.tp-outlined').last.is_visible()
  assert await page.locator('.topos-logo-icon').count()>=1
  await page.screenshot(path=str(ROOT/'tests/topos-hub-unificado.png'),full_page=True)
  await page.evaluate('renderPublicLanding()')
  await page.screenshot(path=str(ROOT/'tests/topos-landing-unificado.png'),full_page=True)
  await page.evaluate("AUTH_VIEW='auth';AUTH_MODE='login';renderAuth()")
  assert await page.locator('.auth-brand .topos-logo-icon').is_visible()
  await page.screenshot(path=str(ROOT/'tests/topos-login-unificado.png'),full_page=True)
  await page.evaluate('TOPOS.home()')
  await page.wait_for_selector('.tp-space-grid')
  # Personal demo, editable without SQL.
  await page.locator('.tp-space-card').first.click()
  await page.wait_for_selector('.tp-demo-banner')
  assert await page.locator('.tp-task-card').count()==0 or await page.locator('.tp-stats').count()==4
  assert await page.get_by_text('Dados fictícios e temporários').count()>0
  before=await page.evaluate('window.__testDB.tp_tasks.length')
  await page.get_by_role('button',name='+ Nova tarefa').click()
  await page.locator('#tpTaskForm input[name=title]').fill('Tarefa fictícia para experimentar')
  await page.locator('#tpTaskForm button[type=submit]').click()
  await page.get_by_role('button',name='Planejamento').click()
  await page.get_by_role('button',name='Quadro').click()
  assert await page.get_by_text('Tarefa fictícia para experimentar').count()==1
  assert (await page.evaluate('window.__testDB.tp_tasks.length'))==before, 'Demo data leaked into backend mock'
  await page.screenshot(path=str(ROOT/'tests/topos-pessoal-demo.png'),full_page=True)
  await page.get_by_role('button',name='Trocar espaço').click()
  await page.wait_for_selector('.tp-space-grid')
  # Organizational manager vs department-only member.
  await page.locator('.tp-organization-card button.tp-outlined').last.click()
  await page.wait_for_selector('.tp-demo-banner')
  assert await page.get_by_role('button',name='Equipe e acessos').is_visible()
  assert await page.get_by_text('Tarefas registradas').count()==1
  assert await page.get_by_text('6',exact=True).count()>=1
  await page.get_by_role('button',name='Departamentos').click()
  assert await page.get_by_text('Financeiro',exact=True).count()>=1
  assert await page.get_by_text('Recursos Humanos',exact=True).count()>=1
  # Demo departments editable in memory.
  await page.get_by_role('button',name='+ Departamento').click()
  await page.locator('.tp-modal input[name=name]').fill('Operações de teste')
  await page.locator('.tp-modal form button.tp-button').click()
  assert await page.get_by_text('Operações de teste').count()>=1
  assert await page.evaluate('window.__testDB.tp_departments.length')==0
  await page.locator('select[aria-label="Simular papel na demonstração"]').select_option('finance')
  assert await page.get_by_role('button',name='Equipe e acessos').count()==0
  await page.get_by_role('button',name='Departamentos').click()
  assert await page.get_by_text('Financeiro',exact=True).count()>=1
  assert await page.get_by_text('Recursos Humanos',exact=True).count()==0
  await page.get_by_role('button',name='Planejamento').click()
  await page.get_by_role('button',name='Quadro').click()
  assert await page.get_by_text('Conferir fechamento do mês').count()==1
  assert await page.get_by_text('Preparar integração de colaboradores').count()==0
  await page.screenshot(path=str(ROOT/'tests/topos-financeiro-demo.png'),full_page=True)
  await page.locator('.tp-new-task').click()
  await page.locator('#tpTaskForm input[name=title]').fill('Tarefa financeira de demonstração')
  await page.locator('#tpTaskForm button[type=submit]').click()
  assert await page.get_by_text('Tarefa financeira de demonstração').count()==1
  assert (await page.evaluate('TOPOS.state.demoStore.tp_tasks.find(t=>t.title==="Tarefa financeira de demonstração").department_id'))=='demo-dept-finance'
  await page.set_viewport_size({'width':390,'height':844})
  await page.screenshot(path=str(ROOT/'tests/topos-mobile-demo.png'),full_page=True)
  assert await page.locator('.tp-mobile-nav').is_visible()
  assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+5'), 'Horizontal overflow on mobile'
  await page.set_viewport_size({'width':1440,'height':940})
  await page.locator('select[aria-label="Simular papel na demonstração"]').select_option('manager')
  assert await page.get_by_role('button',name='Equipe e acessos').is_visible()
  assert await page.evaluate('window.__testDB.tp_tasks.length')==0
  # Study still connected to old legacy data.
  await page.evaluate('TOPOS.openStudy()')
  await page.wait_for_selector('.topbar')
  await page.evaluate("navigate('anotacoes')")
  assert await page.locator('.note-card-v5').count()==1
  await page.screenshot(path=str(ROOT/'tests/topos-estudos-unificado.png'),full_page=True)
  assert not issues,issues
  print('PASS demo: portal unlocked, personal CRUD, department creation, manager/Finance visibility, no API writes, study preserved',flush=True)
  await browser.close()
 server.shutdown()
if __name__=='__main__':asyncio.run(test())
