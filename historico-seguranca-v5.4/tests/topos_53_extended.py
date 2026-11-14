from pathlib import Path
from playwright.sync_api import sync_playwright
import re
root=Path(__file__).resolve().parents[1]
def inline(name):
 s=(root/name).read_text()
 for f in ['style.css','topos.css','topos-design.css','topos-demo.css','topos-planner-v2.css']:
  s=s.replace(f'<link rel="stylesheet" href="{f}">',f'<style>{(root/f).read_text()}</style>')
 s=s.replace('<script src="topos.js"></script>',f'<script>{(root/"topos.js").read_text()}</script>')
 return s
with sync_playwright() as play:
 b=play.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
 pg.set_content(inline('topos-demo.html'),wait_until='load');pg.evaluate("TOPOS.enterDemo('personal')");pg.wait_for_timeout(100)
 pg.locator('.tp-nav-item').filter(has_text='Relatórios').first.click();assert pg.get_by_text('Relatórios e desempenho').count()==1
 assert pg.get_by_text('Próximos prazos e atrasos').count()==1
 print('PASS personal reports')
 pg.locator('.tp-nav-item').filter(has_text='Planejamento').first.click()
 pgtasks=pg.locator('.tp-task-card').count();assert pgtasks==2
 pg.locator('.tp-card-title').first.click();pg.get_by_text('Duplicar +7 dias').click();pg.wait_for_timeout(50)
 assert pg.locator('.tp-task-card').count()==3
 print('PASS duplicate next week')
 pg.locator('.tp-card-title').first.click();pg.get_by_text('Excluir tarefa').click()
 assert pg.get_by_text('AÇÃO PERMANENTE').count()==1
 pg.get_by_text('Excluir definitivamente').click();pg.wait_for_timeout(50)
 assert pg.locator('.tp-task-card').count()==2
 print('PASS delete task')
 pg.locator('.tp-nav-item').filter(has_text='Metas').first.click();pg.get_by_label('Editar meta').first.click()
 pg.get_by_text('Excluir meta').click();assert pg.get_by_text('Excluir definitivamente').count()==1
 pg.get_by_text('Excluir definitivamente').click();pg.wait_for_timeout(50)
 print('after goal',pg.evaluate('TOPOS.state.goals.length'), pg.locator('.tp-goal').count());assert pg.evaluate('TOPOS.state.goals.length')==0
 print('PASS delete goal')
 pg.evaluate("TOPOS.home();TOPOS.enterDemo('organization')")
 pg.get_by_label('Simular papel na demonstração').select_option('finance')
 pg.locator('.tp-nav-item').filter(has_text='Relatórios').first.click()
 assert pg.get_by_text('Relatórios e desempenho').count()==1
 assert pg.get_by_text('Recursos Humanos').count()==0
 print('PASS finance scoped report')
 pg.screenshot(path=str(root/'tests/v53-relatorios-financeiro.png'),full_page=True)
 assert not errs,errs
 pg.close();b.close()
