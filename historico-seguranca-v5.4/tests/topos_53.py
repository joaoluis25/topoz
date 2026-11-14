from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
def inline_html(name):
 s=(root/name).read_text()
 for file in ['style.css','topos.css','topos-design.css','topos-demo.css','topos-planner-v2.css']:
  s=s.replace(f'<link rel="stylesheet" href="{file}">',f'<style>\n{(root/file).read_text()}\n</style>')
 s=s.replace('<script src="topos.js"></script>',f'<script>\n{(root/"topos.js").read_text()}\n</script>')
 s=s.replace('<link rel="icon" type="image/svg+xml" href="topos-symbol.svg">','')
 s=s.replace('src="topos-symbol.svg"','src="data:image/svg+xml,'+((root/'topos-symbol.svg').read_text().replace('#','%23').replace('\n',''))+'"')
 return s
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for name in ['estudos-demo.html','topos-demo.html']:
  page=browser.new_page(viewport={'width':1450,'height':950});errs=[];requests=[]
  page.on('pageerror',lambda e:errs.append(str(e)));page.on('request',lambda r:requests.append(r.url))
  page.set_content(inline_html(name),wait_until='load');page.wait_for_timeout(700)
  print(name,'pageerrors',errs[:3],'count',len(errs),'non-data requests',[r for r in requests if not r.startswith('data:')][:4])
  print('sidebar',page.locator('.sidebar').count(),'tp-app',page.locator('.tp-app').count(),'dashboard:',page.get_by_text('Dashboard').count())
  page.screenshot(path=str(root/'tests'/('v53-estudos-original.png' if name=='estudos-demo.html' else 'v53-administracao.png')),full_page=True)
  if name=='estudos-demo.html':
   assert page.locator('.sidebar').count()==1,errs
   page.locator('.sidebar .nav-item').filter(has_text='Anotações').first.click();page.wait_for_timeout(200)
   assert page.get_by_text('Polissemia e contexto').count()>0,'note not shown'
   print('study notes opens',page.get_by_text('Polissemia e contexto').count())
  else:
   page.evaluate("TOPOS.enterDemo('organization')");page.wait_for_timeout(200)
   page.locator('.tp-nav-item').filter(has_text='Planejamento').first.click();page.wait_for_timeout(250)
   print('demo cards',page.locator('.tp-task-card').count());assert page.locator('.tp-task-card').count()>=3
   page.locator('.tp-card-title').first.click();page.wait_for_timeout(100)
   print('modal',page.locator('.tp-task-modal').count(),'delete_button',page.get_by_text('Excluir tarefa').count())
   page.get_by_text('Excluir tarefa').first.click();page.wait_for_timeout(120)
   assert page.get_by_text('Excluir definitivamente').count()==1
   assert page.get_by_text('AÇÃO PERMANENTE').count()==1
   page.get_by_text('Cancelar').last.click()
   assert page.get_by_text('Excluir definitivamente').count()==0
   # CSV test: button downloads in demo data
   page.get_by_text('Exportar tarefas (CSV)').click();page.wait_for_timeout(100)
   print('CSV clicked')
  page.close()
 browser.close()
