from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
html=(root/'estudos-demo.html').read_text()
for name in ['style.css','topos-design.css','topos-labs.css','topoz-v56.css','topoz-next.css']:
    html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(root/name).read_text()}</style>')
for name in ['topos-voice.js','topos-labs.js','topoz-guard.js','topoz-v56.js','topoz-calc-engine.js','topoz-calc-ui.js','topoz-export-kit.js','topoz-next.js','topoz-simulado.js']:
    html=html.replace(f'<script src="{name}"></script>',f'<script>{(root/name).read_text()}</script>')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 for w in (390,768,1024,1440):
  page=b.new_page(viewport={'width':w,'height':900})
  errors=[]
  page.on('pageerror',lambda ex: errors.append(str(ex)))
  page.evaluate("""() => { const m=new Map();const s={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{configurable:true,value:s});Object.defineProperty(window,'sessionStorage',{configurable:true,value:s}); }""")
  page.set_content(html,wait_until='load')
  page.wait_for_timeout(250)
  routes=page.evaluate('ROUTES.map(r=>r.id)')
  for r in routes:
   page.evaluate('(r) => navigate(r)',r)
   page.wait_for_timeout(15)
  assert len(routes)==25
  assert errors==[],(w,errors)
  # new simulation form and practice route
  page.evaluate('navigate("simulado")')
  assert page.get_by_text('Cadastrar questão objetiva').is_visible()
  page.locator('#tpzQStatement').fill('Qual é o resultado de dois mais dois?')
  for l,t in zip('ABCDE',['4','3','5','6','7']): page.locator('#tpzQ'+l).fill(t)
  page.locator('#tpzQCorrect').select_option('A')
  page.locator('[data-tpz-sim=addQuestion]').click()
  page.locator('#tpzSimCount').fill('1')
  page.locator('[data-tpz-sim=create]').click()
  assert page.get_by_text('Questão 1 de 1').count()>0 or page.get_by_text('Questão',exact=False).count()>0
  page.locator('[name=tpzSimAnswer][value=A]').check()
  # Simula confirmação explícita do aluno para concluir a prova
  page.evaluate('window.confirm=()=>true')
  page.locator('[data-tpz-sim=finish]').click()
  assert page.get_by_text('Gabarito comentado').count()>0
  # modal from core app, accessible title/role
  page.evaluate('navigate("anotacoes")')
  first=page.locator('button').filter(has_text='Nova anotação').first
  if first.count(): first.click()
  modal=page.locator('#activeModalOverlay [role=dialog]')
  assert modal.count()>0,(w,'no modal')
  assert modal.get_attribute('aria-modal')=='true'
  assert page.evaluate('document.activeElement.closest("#activeModalOverlay")!==null'),(w,'focus outside modal')
  page.keyboard.press('Escape');assert page.locator('#activeModalOverlay').count()==0
  print(json.dumps({'width':w,'routes':len(routes),'pageErrors':len(errors),'simulado':'ok','modal':'ok'}))
  page.close()
 b.close()
