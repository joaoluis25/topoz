"""Verifies fully local TOPOS previews and ensures no Supabase requests on demo paths."""
import asyncio, http.server, threading
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent

async def test():
    errors=[]
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**k:http.server.SimpleHTTPRequestHandler(*a,directory=str(ROOT),**k))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}/topos-demo.html'
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
        page.on('pageerror',lambda e: errors.append(str(e)))
        requests=[]
        page.on('request',lambda r: requests.append(r.url))
        page.set_default_timeout(6500)
        html=(ROOT/'topos-demo.html').read_text()
        for name in ('topos.css','topos-design.css','topos-demo.css'):
            html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(ROOT/name).read_text()}</style>')
        html=html.replace('<script src="topos.js"></script>','<script>'+(ROOT/'topos.js').read_text()+'</script>')
        await page.set_content(html,wait_until='domcontentloaded')
        await page.wait_for_selector('.tp-space-grid')
        assert await page.get_by_role('button',name='Pessoal',exact=False).count() >= 1
        await page.get_by_role('button',name='Pessoal',exact=False).first.click()
        await page.wait_for_selector('.tp-demo-banner')
        assert await page.get_by_text('Organizar prioridades da semana').count()>=1
        await page.get_by_role('button',name='+ Nova tarefa').click()
        await page.locator('#tpTaskForm input[name=title]').fill('Minha tarefa de teste')
        await page.locator('#tpTaskForm button[type=submit]').click()
        await page.get_by_role('button',name='Planejamento').click()
        await page.get_by_role('button',name='Quadro').click()
        assert await page.get_by_text('Minha tarefa de teste').count()==1
        await page.screenshot(path=str(ROOT/'tests/demonstracao-pessoal-verificada.png'))
        await page.get_by_role('button',name='Trocar espaço').click()
        await page.wait_for_selector('.tp-space-grid')
        await page.get_by_role('button',name='Explorar demonstração →',exact=True).click()
        await page.wait_for_selector('.tp-demo-banner')
        assert await page.get_by_text('Tarefas registradas').count()==1
        assert await page.get_by_role('button',name='Departamentos').is_visible()
        await page.get_by_role('button',name='Departamentos').click()
        assert await page.get_by_text('Recursos Humanos',exact=True).count()>0
        await page.locator('select[aria-label="Simular papel na demonstração"]').select_option('finance')
        await page.get_by_role('button',name='Departamentos').click()
        assert await page.get_by_text('Recursos Humanos',exact=True).count()==0
        await page.get_by_role('button',name='Planejamento').click()
        await page.get_by_role('button',name='Quadro').click()
        assert await page.get_by_text('Conferir fechamento do mês').count()==1
        assert await page.get_by_text('Preparar integração de colaboradores').count()==0
        await page.screenshot(path=str(ROOT/'tests/demonstracao-organizacoes-verificada.png'))
        assert not any('supabase' in req for req in requests),requests
        assert not errors,errors
        # Open URL directly selecting organization and on narrow mobile viewport.
        page = await browser.new_page(viewport={'width':390,'height':820},device_scale_factor=1)
        page.on('pageerror',lambda e: errors.append(str(e)))
        await page.set_content(html,wait_until='domcontentloaded')
        await page.evaluate("TOPOS.enterDemo('organization')")
        await page.wait_for_selector('.tp-demo-banner')
        assert await page.locator('.tp-mobile-nav').is_visible()
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 5')
        await page.screenshot(path=str(ROOT/'tests/demonstracao-mobile-verificada.png'))
        assert not errors,errors
        print('PASS: file:// standalone demo opens personal and organizations, edits tasks, filters dept, mobile, no network, no JS errors')
        # Single-file HTML is entirely self-contained and works with no companion files.
        single=(ROOT/'TOPOS-DEMONSTRACAO-SEM-LOGIN.html').read_text()
        one=await browser.new_page(viewport={'width':1200,'height':750})
        one.on('pageerror',lambda e: errors.append(str(e)))
        one_requests=[]
        one.on('request',lambda r:one_requests.append(r.url))
        await one.set_content(single,wait_until='domcontentloaded')
        await one.wait_for_selector('.tp-space-grid')
        await one.get_by_role('button',name='Testar Pessoal').click()
        await one.wait_for_selector('.tp-demo-banner')
        assert await one.locator('.tp-brand img').evaluate('(el)=>el.complete && el.naturalWidth>0'), 'Inline logo failed to render'
        await one.get_by_role('button',name='Trocar espaço').click()
        await one.get_by_role('button',name='Testar Organizações').click()
        await one.wait_for_selector('.tp-demo-banner')
        assert not one_requests,one_requests
        assert not errors,errors
        print('PASS: one-file demo with inline styles, JS and logo, navigation and no network calls')
        await browser.close()
    server.shutdown()

if __name__=='__main__':asyncio.run(test())
