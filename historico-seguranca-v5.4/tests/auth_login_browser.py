"""Regression test for TOPOS login: fake Supabase only; no real account or network requests."""
import asyncio, re, json
from pathlib import Path
from playwright.async_api import async_playwright
from topos_browser_smoke import ROOT, MOCK

base=MOCK
base=base.replace("getSession:async()=>({data:{session:{user}},error:null})", "getSession:async()=>({data:{session:null},error:null})")
base=base.replace("onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})", "onAuthStateChange:(cb)=>{window.__onAuth=cb;return {data:{subscription:{unsubscribe(){}}}}}")
base=base.replace("signOut:async()=>({error:null})", "signInWithPassword:async({email,password})=>{if(window.__authFailure)return {error:window.__authFailure};queueMicrotask(()=>window.__onAuth('SIGNED_IN',{user}));return {data:{user},error:null}},signOut:async()=>({error:null})")
base=base.replace("if(name==='tp_init_profile')return {data:null,error:null}", "if(name==='tp_init_profile')return {data:null,error:{message:'TOPOS SQL ainda não implantado'}}")
async def run():
 html=(ROOT/'index.html').read_text()
 for file in ('style.css','topos.css'):
  html=html.replace(f'<link rel="stylesheet" href="{file}">',f'<style>{(ROOT/file).read_text()}</style>')
 html=re.sub(r'<link[^>]*href="https://fonts.googleapis.com[^>]*>', '', html)
 html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/dompurify[^>]*></script>', '<script>window.DOMPurify={sanitize:x=>x};</script>',html)
 html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/@supabase[^>]*></script>', '<script>'+base+'</script>',html)
 for file in ('topos-config.js','topos.js'):
  html=html.replace(f'<script src="{file}"></script>',f'<script>{(ROOT/file).read_text()}</script>')
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await browser.new_page()
  exceptions=[]
  page.on('pageerror',lambda e: exceptions.append(str(e)))
  html=html.replace("const APP_REDIRECT_URL=()=>new URL('auth-callback.html',window.location.href).href;","const APP_REDIRECT_URL=()=> 'http://localhost:5500/auth-callback.html';")
  html=html.replace('<body>', '<body><script>window.__cache={};Object.defineProperty(window,"localStorage",{value:{getItem(k){return window.__cache[k]||null},setItem(k,v){window.__cache[k]=String(v)},removeItem(k){delete window.__cache[k]}}});</script>',1)
  await page.set_content(html,wait_until='domcontentloaded',timeout=20000)
  await page.get_by_role('button',name='Entrar').first.click(timeout=1500)
  await page.locator('#authEmail').fill('teste@example.test')
  await page.locator('#authPassword').fill('abcdefgh')
  await page.evaluate("window.__authFailure={message:'Invalid login credentials',status:400,code:'invalid_credentials'}")
  await page.locator('#authSubmitBtn').click()
  await page.get_by_text('E-mail ou senha incorretos.',exact=False).wait_for(timeout=2500)
  assert await page.locator('#authSubmitBtn').is_enabled()
  assert await page.locator('#authEmail').input_value()=='teste@example.test'
  await page.locator('#authEmail').fill('teste@example.test')
  await page.locator('#authPassword').fill('abcdefgh')
  await page.evaluate("window.__authFailure={message:'Failed to fetch',status:0}")
  await page.locator('#authSubmitBtn').click()
  await page.get_by_text('Não foi possível conectar ao Supabase.',exact=False).wait_for(timeout=2500)
  await page.locator('#authEmail').fill('teste@example.test')
  await page.locator('#authPassword').fill('abcdefgh')
  await page.evaluate("window.__authFailure=null")
  await page.locator('#authSubmitBtn').click()
  await page.locator('.tp-space-grid').wait_for(timeout=3000)
  assert await page.get_by_text('Estudos',exact=True).count()>=1
  assert not exceptions,exceptions
  print('PASS: mapeamento de senha incorreta, erro de rede, login com sessão simulada e acesso ao módulo Estudos (sem SQL TOPOS).')
  await browser.close()
if __name__=='__main__':asyncio.run(run())
