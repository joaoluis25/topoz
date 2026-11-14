"""Visual and data-scope demonstration-only regression; not a Supabase RLS test."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
def inline(name):
    html=(root/name).read_text()
    for css in ['style.css','topos.css','topos-design.css','topos-demo.css','topos-planner-v2.css','topos-v54.css']:
        html=html.replace(f'<link rel="stylesheet" href="{css}">',f'<style>{(root/css).read_text()}</style>')
    for script in ['topos-preferences.js','topos-reports.js','topos.js','topos-voice.js']:
        html=html.replace(f'<script src="{script}"></script>',f'<script>{(root/script).read_text()}</script>')
    return html
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(inline('topos-demo.html'),wait_until='load')
    page.evaluate("TOPOS.enterDemo('organization')")
    page.evaluate("TOPOS.setDemoRole('finance')")
    page.evaluate("TOPOS.setScreen('departments')")
    assert page.locator('.tp-department-pro').count()==1
    assert page.locator('text=Recursos Humanos').count()==0
    page.locator('.tp-department-pro').click()
    assert page.locator('text=Camila Ribeiro').count()==0
    assert page.locator('text=Lucas Almeida').count()>=1
    page.evaluate("TOPOS.setScreen('news')")
    assert page.locator('.tp-news-card',has_text='Fechamento financeiro').count()==1
    assert page.locator('.tp-news-card',has_text='Planejamento do próximo trimestre').count()==1
    page.evaluate("TOPOS.setDemoRole('hr')")
    page.evaluate("TOPOS.setScreen('news')")
    assert page.locator('.tp-news-card',has_text='Fechamento financeiro').count()==0
    page.evaluate("TOPOS.setDemoRole('manager')")
    page.evaluate("TOPOS.setScreen('projects')")
    page.evaluate("TOPOS.state.demoStore.tp_projects.push({id:'inj',organization_id:'demo-org',owner_id:'demo-user',title:'<img src=x onerror=window.__codeRan=1>',description:'<svg onload=window.__codeRan=2>',status:'active'})")
    page.evaluate("TOPOS.setDemoRole('manager')")
    assert not page.evaluate('window.__codeRan||false'), 'unsafe markup executed'
    assert page.locator('.tp-project-pro img').count()==0
    page.screenshot(path=str(root/'tests'/'v54-mobile-390.png'),full_page=True)
    assert not errors,errors
    browser.close()
print('PASS: mobile navigation, department-scoped simulated visibility, escaped project text and no script execution')
