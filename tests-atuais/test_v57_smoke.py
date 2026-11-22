from playwright.sync_api import sync_playwright
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/"estudos-demo.html").read_text()
for name in ["style.css","topos-design.css","topos-labs.css","topoz-v56.css","topoz-next.css"]:
    html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(root/name).read_text()}</style>')
for name in ["topos-voice.js","topos-labs.js","topoz-guard.js","topoz-v56.js","topoz-calc-engine.js","topoz-calc-ui.js","topoz-next.js","topoz-simulado.js"]:
    html=html.replace(f'<script src="{name}"></script>',f'<script>{(root/name).read_text()}</script>')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for w in [390,768,1024,1440]:
        page=browser.new_page(viewport={'width':w,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.evaluate("""() => { const m=new Map(); const s={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}; Object.defineProperty(window,'localStorage',{configurable:true,value:s});Object.defineProperty(window,'sessionStorage',{configurable:true,value:s}); }""")
        page.set_content(html,wait_until='load')
        page.wait_for_timeout(900)
        titles=page.locator('.nav-item').count()
        visible=page.locator('#tpzCalcFab').is_visible()
        try:
            page.locator('#tpzCalcFab').click(timeout=2000)
            calc=page.locator('#tpzCalc.open').count()
            page.keyboard.press('Escape');esc=page.locator('#tpzCalc.open').count()
        except Exception as e:
            calc=0;esc=1;errors.append('calc error '+str(e)[:150])
        sizes=page.evaluate('''() => { let bad=[]; for(const el of document.querySelectorAll('#app *')) {const r=el.getBoundingClientRect(); if(r.right>innerWidth+3||r.left < -3)bad.push({tag:el.tagName,cl:el.className?.toString().slice(0,45),l:Math.round(r.left),r:Math.round(r.right)});} return bad.slice(0,12); }''')
        result={'width':w,'routes':titles,'calcVisible':visible,'calcOpened':calc,'calcClosed':esc==0,'errors':errors[:5],'overflow':sizes[:6]}
        print(json.dumps(result,ensure_ascii=False))
        page.close()
    browser.close()
