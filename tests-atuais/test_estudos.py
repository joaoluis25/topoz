"""TOPOS Estudos: smoke da separação, 100% offline e dados fictícios.
Não comprova conexão real Supabase ou políticas RLS.
Requer Playwright e Chromium.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'estudos-demo.html').read_text()
for style in ['style.css','topos-design.css']:
    html=html.replace(f'<link rel="stylesheet" href="{style}">', f'<style>{(ROOT/style).read_text()}</style>')
html=html.replace('<script src="topos-voice.js"></script>',f'<script>{(ROOT/"topos-voice.js").read_text()}</script>')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='commit',timeout=20000)
    page.wait_for_timeout(500)
    assert page.locator('.topbar h1').inner_text()=='Dashboard'
    assert page.locator('.nav-item').count()>=16
    assert page.locator('.brand').inner_text().strip().startswith('TOPOS')
    assert 'Mudar de espaço' not in page.locator('.sidebar').inner_text()
    assert page.evaluate('DATA_READY') is True
    for route in ('anotacoes','conteudos','questoes','flashcards','revisoes','metas','sessoes'):
        page.evaluate(f"navigate('{route}')")
        assert len(page.locator('.content').inner_text())>20,route
    page.evaluate("navigate('anotacoes')")
    assert page.locator('.note-card-v5').count()>=1
    page.locator('.note-card-v5').first.click()
    assert page.locator('#mNoteBody').count()==1
    page.locator('#mNoteBody').fill('Resumo de teste')
    assert page.locator('#tpVoiceToggle').count()==1
    assert not errors, errors
    print('TOPOS Estudos: PASSOU - menu e editor originais, principais módulos, sem erro de JS; dados fictícios.')
    browser.close()
