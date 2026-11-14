"""Smoke V5.6: execução DEMO offline, aprovação de plano, revisão e CAS simulado.
Não acessa Supabase nem valida RLS real.
Executar: python tests-atuais/test_v56_browser.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent
html=(root/'estudos-demo.html').read_text(encoding='utf8')
for sheet in ['style.css','topos-design.css','topos-labs.css','topoz-v56.css']:
 html=html.replace(f'<link rel="stylesheet" href="{sheet}">',f'<style>\n{(root/sheet).read_text(encoding="utf8")}\n</style>')
for script in ['topos-voice.js','topos-labs.js','topoz-guard.js','topoz-v56.js']:
 html=html.replace(f'<script src="{script}"></script>',f'<script>\n{(root/script).read_text(encoding="utf8")}\n</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900},is_mobile=width==390)
  errs=[];page.on('pageerror',lambda error:errs.append(str(error)))
  page.set_content(html,wait_until='load')
  page.wait_for_selector('.nav-item')
  assert page.locator('.nav-item').count()>=23
  page.evaluate("navigate('planejador')")
  assert 'Semana de estudos' in page.locator('#content').inner_text()
  page.get_by_role('button',name='Gerar proposta').click()
  assert page.locator('.v56-plan-item').count()==7
  before=page.evaluate('STATE.events.length')
  page.on('dialog',lambda d:d.accept())
  page.get_by_role('button',name='Aprovar e adicionar ao calendário').click()
  assert page.evaluate('STATE.events.length')==before+7
  page.evaluate("navigate('fila')")
  assert 'Fila integrada de revisão' in page.locator('#content').inner_text()
  # Integridade de normalização por ciclos maliciosos em backup.
  assert page.evaluate("()=>{const a=normalizeState({topics:[{id:'x',name:'X',parentId:'y'},{id:'y',name:'Y',parentId:'z'},{id:'z',name:'Z',parentId:'x'}]});return a.topics.some(t=>!t.parentId)}")
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2'),width
  # A mudança para pós-demo permite injetar uma RPC mock: CAS sem backend externo.
  page.evaluate("""()=>{
    window.TOPOS_STUDY_STANDALONE=false;
    sb.rpc=async(name,args)=>({data:args.p_expected_revision+1,error:null});
  }""")
  assert page.evaluate('async()=>await saveStateNow()') is True
  assert page.evaluate('DATA_REVISION')==1
  page.evaluate("sb.rpc=async()=>({data:null,error:{message:'REVISION_CONFLICT'}})")
  assert page.evaluate('async()=>await saveStateNow()') is False
  assert page.evaluate('SYNC_CONFLICT') is True
  assert page.evaluate('DATA_READY') is True
  assert not errs,errs
  page.close()
 print('PASSOU: 2 viewports, fila, plano com aceite, ciclos, CAS e bloqueio de conflito (simulado)')
 browser.close()
