from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
def inline_html(name):
 html=(root/name).read_text()
 for css in ['style.css','topos.css','topos-design.css','topos-demo.css','topos-planner-v2.css','topos-v54.css']:
  html=html.replace(f'<link rel="stylesheet" href="{css}">',f'<style>\n{(root/css).read_text()}\n</style>')
 for script in ['topos-preferences.js','topos-reports.js','topos.js','topos-voice.js']:
  html=html.replace(f'<script src="{script}"></script>',f'<script>\n{(root/script).read_text()}\n</script>')
 html=html.replace('<link rel="icon" type="image/svg+xml" href="topos-symbol.svg">','')
 html=html.replace('src="topos-symbol.svg"','src="data:image/svg+xml,'+((root/'topos-symbol.svg').read_text().replace('#','%23').replace('\n',''))+'"')
 return html
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(inline_html('topos-demo.html'),wait_until='load')
  assert page.locator('text=Organizações').count()>0
  page.evaluate("TOPOS.enterDemo('organization')")
  page.evaluate("TOPOS.setScreen('projects')")
  assert page.locator('.tp-project-pro').count()>0,'Missing project cards'
  page.locator('.tp-project-pro').first.click()
  assert page.locator('.tp-project-modal').count()==1,'Project modal missing'
  assert page.locator('text=Atividades do projeto').count()>0
  page.evaluate('TOPOS.closeModal()')
  page.evaluate("TOPOS.setScreen('departments')")
  assert page.locator('.tp-department-pro').count()>0
  page.locator('.tp-department-pro').first.click()
  assert page.locator('text=Equipe e organograma').count()>0
  assert page.locator('.tp-person-chip').count()>0
  page.locator('.tp-person-chip').first.click()
  assert page.locator('.tp-staff-profile').count()==1
  page.evaluate('TOPOS.closeModal()')
  page.evaluate("TOPOS.setScreen('news')")
  assert page.locator('.tp-news-card').count()>=1
  page.locator('button',has_text='+ Publicar comunicado').click()
  page.locator('input[name=title]').fill('Orientações de projeto')
  page.locator('textarea[name=body]').fill('Conferir atividades da semana.')
  page.locator('button[type=submit]',has_text='Publicar').click()
  assert page.locator('.tp-news-card',has_text='Orientações de projeto').count()==1
  page.evaluate("TOPOS.setScreen('settings')")
  page.locator('button',has_text='Tema claro').click()
  assert page.evaluate('document.documentElement.dataset.toposTheme')=='light'
  page.screenshot(path=str(root/'tests'/'v54-organizacoes-claro.png'),full_page=True)
  page.locator('button',has_text='Tema escuro').click()
  page.evaluate("TOPOS.setScreen('reports')")
  for ext in ('xlsx','docx','pdf'):
   with page.expect_download(timeout=15000) as info:
    page.locator('button',has_text={'xlsx':'Excel profissional','docx':'Documento Word','pdf':'Relatório PDF'}[ext]).click()
   dl=info.value
   target=root/'tests'/('relatorio-validacao.'+ext)
   dl.save_as(str(target))
   assert target.stat().st_size>400,target
  page.screenshot(path=str(root/'tests'/'v54-relatorios.png'),full_page=True)
  page.evaluate("TOPOS.home()")
  page.evaluate("TOPOS.enterDemo('personal')")
  page.evaluate("TOPOS.setScreen('professional')")
  assert page.locator('text=Meu trabalho').count()>0
  assert page.locator('text=Revisar relatório da equipe (exemplo)').count()>0
  page.screenshot(path=str(root/'tests'/'v54-pessoal-trabalho.png'),full_page=True)
  # Confirm that study demo still uses its complete original sidebar, not the 5-card preview.
  page.close()
  page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(inline_html('estudos-demo.html'),wait_until='load')
  assert page.locator('.sidebar .nav-item').count()>=10
  # Check voice features are attached only to the note editor.
  page.evaluate("openNoteModal()")
  assert page.locator('#tpVoiceToggle').count()==1
  page.evaluate("document.getElementById('tpVoiceDraft').hidden=false;document.getElementById('tpVoiceDraft').value='Texto de teste com segurança.';document.getElementById('tpVoiceInsert').hidden=false;TOPOS_VOICE.insert()")
  assert page.locator('#mNoteBody').inner_text().find('Texto de teste com segurança.')!=-1
  print('Page errors:',errors)
  assert not errors,errors
  browser.close()
print('PASS: projects, departments, staff, announcements, themes, exports, personal professional tasks and Studies voice insertion')
