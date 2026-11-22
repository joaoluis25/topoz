from playwright.sync_api import sync_playwright
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
import re
html=re.sub(r'<link[^>]+(?:fonts.googleapis.com|fonts.gstatic.com)[^>]*>','',html)
for name in ['style.css','topos-design.css','topos-labs.css','topoz-v56.css','topoz-next.css']:
 html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(root/name).read_text()}</style>')
for name in ['topos-voice.js','topos-labs.js','topoz-guard.js','topoz-v56.js','topoz-calc-engine.js','topoz-calc-ui.js','topoz-export-kit.js','topoz-next.js','topoz-simulado.js']:
 html=html.replace(f'<script src="{name}"></script>',f'<script>{(root/name).read_text()}</script>')
html=html.replace('<script src="https://cdn.jsdelivr.net/npm/dompurify@3.4.16/dist/purify.min.js"></script>', '<script>window.DOMPurify={sanitize:s=>String(s)}</script>')
html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', '''<script>window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null},error:null}),onAuthStateChange:()=>{}},functions:{invoke:async()=>({data:null,error:new Error('mock')})}})}</script>''')
html=html.replace('<script src="topos-config.js"></script>','<script>window.TOPOS_PUBLIC_CONFIG={url:"https://demo.supabase.co",anonKey:"mock"}</script>')
html=html.replace('<script src="topoz-connection.js"></script>','<script>window.TOPOS_CONNECTION={check:()=>({ready:true,url:"https://demo.supabase.co",anonKey:"mock"})}</script>')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'],headless=True)
 for w in [390,768,1024,1440]:
  page=b.new_page(viewport={'width':w,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate("""() => { const m=new Map();const s={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};Object.defineProperty(window,'localStorage',{value:s});Object.defineProperty(window,'sessionStorage',{value:s}); }""")
  page.set_content(html,wait_until='domcontentloaded',timeout=12000);page.wait_for_timeout(180)
  plans=page.locator('.tpz-price').count();h=page.locator('#tpzPlanTitle').count();trial=page.get_by_text('Experimentar 30 dias').count();calc=page.locator('#tpzCalcFab').is_visible();overflow=page.evaluate('document.documentElement.scrollWidth-innerWidth')
  print(json.dumps({'width':w,'plans':plans,'section':h,'falseTrial':trial,'calcVisible':calc,'overflowPx':overflow,'errors':errors},ensure_ascii=False))
  assert plans==4 and h==1 and trial==0 and not calc and overflow<=1 and not errors
  page.close()
 b.close()
