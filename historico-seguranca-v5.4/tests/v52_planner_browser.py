from pathlib import Path
import asyncio
from playwright.async_api import async_playwright

HTML=Path(__file__).resolve().parents[1]/'TOPOS-DEMO-COMPLETA-SEM-LOGIN.html'
SCREEN=Path(__file__).resolve().parents[1]/'tests'

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
  errors=[]; requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:requests.append(r.url))
  await page.set_content(HTML.read_text(), wait_until="load")
  await page.wait_for_timeout(500)
  print('hub visible',await page.locator('.tp-space-grid').is_visible())
  await page.evaluate("TOPOS.enterDemo('personal')")
  await page.wait_for_timeout(300)
  await page.locator('.tp-nav-item').filter(has_text='Planejamento').first.click()
  await page.locator('.tp-task-card').first.wait_for()
  print('personal cards',await page.locator('.tp-task-card').count())
  await page.screenshot(path=str(SCREEN/'v52-personal-planner.png'),full_page=True)
  await page.locator('.tp-card-title').first.click()
  print('modal opens',await page.locator('.tp-task-modal').is_visible())
  await page.locator('.tp-inline-add input').fill('Validar os indicadores com o gestor')
  await page.locator('.tp-inline-add button').click()
  assert await page.locator('.tp-check-row').count() == 1
  await page.locator('.tp-check-row input').check()
  assert await page.locator('.tp-check-row input').is_checked()
  await page.locator('.tp-message-form textarea').fill('Verificação inicial concluída; aguardando a próxima etapa.')
  await page.locator('.tp-message-form button').click()
  assert await page.locator('.tp-comment').count() == 1
  await page.screenshot(path=str(SCREEN/'v52-detalhes-tarefa.png'),full_page=True)
  await page.get_by_role('button',name='Fechar',exact=True).last.click()
  assert await page.locator('.tp-planner-card .tp-card-activity').first.inner_text() != ''
  await page.evaluate("TOPOS.home(); TOPOS.enterDemo('organization')")
  await page.wait_for_timeout(300)
  await page.locator('.tp-nav-item').filter(has_text='Planejamento').first.click()
  assert await page.locator('.tp-planner-card').count() >= 3
  await page.screenshot(path=str(SCREEN/'v52-organizacao-planner.png'),full_page=True)
  await page.get_by_label('Simular papel na demonstração').select_option('finance')
  assert await page.get_by_text('Preparar integração de colaboradores').count()==0
  await page.screenshot(path=str(SCREEN/'v52-financeiro-planner.png'),full_page=True)
  await page.evaluate("TOPOS.home();TOPOS.openStudy()")
  await page.wait_for_timeout(300)
  assert await page.get_by_text('Estudos · demonstração').count()>=1
  await page.locator('.tp-nav-item').filter(has_text='Flashcards').first.click()
  assert await page.locator('.tp-study-demo-card').count()==2
  await page.screenshot(path=str(SCREEN/'v52-estudos-demo.png'),full_page=True)
  mobile=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  mobile.on('pageerror',lambda e:errors.append(str(e)))
  await mobile.set_content(HTML.read_text(), wait_until="load")
  await mobile.evaluate("TOPOS.enterDemo('organization');TOPOS.setScreen('tasks')")
  await mobile.wait_for_timeout(450)
  dims=await mobile.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
  print('mobile sizes',dims)
  await mobile.screenshot(path=str(SCREEN/'v52-mobile-planner.png'),full_page=True)
  print('pageerrors',errors)
  print('non-file requests', [x for x in requests if not x.startswith('file:')][:5])
  assert not errors,errors
  assert dims['scroll']<=dims['client']+2,dims
  await browser.close()

if __name__=='__main__':asyncio.run(main())
