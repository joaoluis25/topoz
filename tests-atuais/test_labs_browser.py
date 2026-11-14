from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parent.parent
html=(root/'estudos-demo.html').read_text(encoding='utf8')
for sheet in ['style.css','topos-design.css','topos-labs.css','topoz-v56.css']:
 html=html.replace(f'<link rel="stylesheet" href="{sheet}">',f'<style>\n{(root/sheet).read_text(encoding="utf8")}\n</style>')
for script in ['topos-voice.js','topos-labs.js','topoz-guard.js','topoz-v56.js']:
 html=html.replace(f'<script src="{script}"></script>',f'<script>\n{(root/script).read_text(encoding="utf8")}\n</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':930},locale='pt-BR')
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load',timeout=30000)
 page.wait_for_selector('.nav-item')
 assert page.locator('.nav-item').count()>=20
 for route,title in [('mapas','Mapas mentais'),('pesquisa','Pesquisa acadêmica'),('trilhas','Trilhas de aprendizagem'),('estudio','Estúdio de aulas'),('ditado','Ditado e transcrições')]:
  page.evaluate('(r)=>navigate(r)',route)
  assert title in page.locator('#content').inner_text(), (route,page.locator('#content').inner_text()[:150])
 page.evaluate("navigate('mapas')")
 page.get_by_role('button',name='+ Novo mapa').click()
 page.locator('#lTitle').fill('Semântica para concurso')
 page.get_by_role('button',name='Salvar',exact=True).click()
 assert 'Semântica para concurso' in page.locator('.lab-map-theme').inner_text()
 page.get_by_role('button',name='+ Ideia',exact=True).click()
 page.locator('#lTitle').fill('Polissemia')
 page.locator('#lDetail').fill('Uma palavra, sentidos relacionados.')
 page.get_by_role('button',name='Salvar',exact=True).click()
 assert 'Polissemia' in page.locator('.lab-node').inner_text()
 page.locator('.lab-mini').first.click()
 page.locator('#lTitle').fill('Contexto')
 page.get_by_role('button',name='Salvar',exact=True).click()
 assert page.locator('.lab-node').count()==2
 page.evaluate("navigate('pesquisa')")
 page.get_by_role('button',name='+ Nova pesquisa').click()
 page.locator('#lTitle').fill('Crase em provas')
 page.locator('#lQuestion').fill('Como identificar crase?')
 page.get_by_role('button',name='Salvar',exact=True).click()
 page.get_by_role('button',name='+ Adicionar fonte').click()
 page.locator('#lTitle').fill('Gramática')
 page.locator('#lUrl').fill('javascript:alert(1)')
 page.get_by_role('button',name='Salvar',exact=True).click()
 assert page.locator('.modal-overlay').count()==1, 'unsafe URL should be rejected'
 page.locator('#lUrl').fill('https://example.org/fonte')
 page.get_by_role('button',name='Salvar',exact=True).click()
 assert page.locator('.lab-source').count()==1
 page.evaluate("navigate('trilhas')")
 page.get_by_role('button',name='+ Nova trilha').click()
 page.locator('#lTitle').fill('Português TCE')
 page.get_by_role('button',name='Salvar',exact=True).click()
 page.get_by_role('button',name='+ Nova etapa').click()
 page.locator('#lTitle').fill('Revisar crase')
 page.get_by_role('button',name='Salvar',exact=True).click()
 page.locator('.lab-step input').check()
 assert '100%' in page.locator('.lab-hint').inner_text()
 page.evaluate("navigate('estudio')")
 page.get_by_role('button',name='+ Nova aula').click()
 page.locator('#lTitle').fill('Semântica: polissemia')
 page.locator('#lBody').fill('## Conceitos\nA polissemia depende do contexto.')
 page.get_by_role('button',name='Salvar',exact=True).click()
 before=page.evaluate('STATE.flashcards.length')
 page.locator('#labPairs').fill('O que é polissemia? | Mesma palavra com vários sentidos relacionados.')
 page.get_by_role('button',name='Criar flashcards').click()
 assert page.evaluate('STATE.flashcards.length')==before+1
 page.evaluate("navigate('ditado')")
 page.locator('#labVoiceTitle').fill('Explicação oral')
 page.locator('#labVoiceText').fill('Resumo revisado de semântica.')
 page.get_by_role('button',name='Salvar transcrição').click()
 assert page.locator('.lab-source').count()==1
 page.get_by_role('button',name='Abrir',exact=True).click()
 page.get_by_role('button',name='Criar anotação').click()
 assert page.evaluate("STATE.notes.some(n=>n.title==='Explicação oral')")
 # existing routes regression
 for route in ['dashboard','calendario','anotacoes','flashcards','questoes','assistente','config']:
  page.evaluate('(r)=>navigate(r)',route)
  assert page.locator('.topbar h1').inner_text().strip(), route
 page.evaluate("navigate('mapas')")
 # Capturas opcionais são armazenadas em evidencias-beta no pacote entregue.
 # mobile smoke
 mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,device_scale_factor=1)
 mobile.on('pageerror',lambda e:errors.append('mobile: '+str(e)))
 mobile.set_content(html,wait_until='load',timeout=30000)
 mobile.evaluate("navigate('pesquisa')")
 # Teste mobile em viewport estreita.
 assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'), 'horizontal overflow'
 print('RESULTS SUCCESS')
 print('checks routes 5, CRUD maps/research/paths/lesson/voice, unsafe URL, original routes 7, mobile')
 print('console errors:',errors)
 browser.close()
 if errors: raise Exception(errors)
