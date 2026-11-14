from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,re
root=Path(__file__).resolve().parents[1];symbol=base64.b64encode((root/'topos-symbol.svg').read_bytes()).decode();data='data:image/svg+xml;base64,'+symbol
def html(name):
 s=(root/name).read_text()
 for filename in ['style.css','topos.css','topos-design.css','topos-demo.css','topos-planner-v2.css']:
  s=s.replace(f'<link rel="stylesheet" href="{filename}">',f'<style>\n{(root/filename).read_text()}\n</style>')
 s=s.replace('<script src="topos.js"></script>',f'<script>\nwindow.TOPOS_DEMO_LOGO_DATA="{data}";\n{(root/"topos.js").read_text()}\n</script>')
 s=s.replace('src="topos-symbol.svg"',f'src="{data}"')
 return s
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for source in ['topos-demo.html','estudos-demo.html']:
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1);err=[]
  page.on('pageerror',lambda e:err.append(str(e)))
  page.set_content(html(source));page.wait_for_timeout(200)
  if source=='topos-demo.html':page.evaluate("TOPOS.enterDemo('organization');TOPOS.setScreen('tasks')")
  dims=page.evaluate('({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})')
  print(source,dims,'errors',err[:3]);assert not err
  # Board intentionally horizontal-scrolls inside its own wrapper; document itself should not scroll horizontally.
  assert dims['scroll']<=dims['width']+5
  page.screenshot(path=str(root/'tests'/('v53-mobile-organizacoes.png' if source=='topos-demo.html' else 'v53-mobile-estudos.png')),full_page=True)
  page.close()
 # Desktop main full studies screenshot with logo
 page=browser.new_page(viewport={'width':1450,'height':950});page.set_content(html('estudos-demo.html'));page.wait_for_timeout(120)
 page.screenshot(path=str(root/'tests/v53-estudos-completo.png'),full_page=True)
 page.close();browser.close()
