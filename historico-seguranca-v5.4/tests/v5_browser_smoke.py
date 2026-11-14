import asyncio,json,re
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
D={
 'schemaVersion':3,
 'topics':[{'id':'top_1','name':'Português','parentId':None,'color':'teal','progress':30}],
 'notes':[{'id':'note_1','title':'Semântica','html':'<p>O sentido das palavras depende do contexto.</p>','topicId':'top_1','tags':['portugues'],'priority':'normal','favorite':False,'reviewOn':False,'notebookDone':False,'nextReview':None,'interval':0,'createdAt':'2026-11-01T10:00:00Z','updatedAt':'2026-11-01T10:00:00Z'}],
 'goals':[], 'questions':[],'flashcards':[{'id':'fc_1','front':'Verbo','back':'Palavra que expressa ação','topicId':'top_1','difficulty':'facil','nextReview':'2026-10-25','createdAt':'2026-11-01T10:00:00Z'}],
 'sessions':[],'events':[],'doubts':[], 'settings':{'pomodoro':{'work':25,'brk':5,'presets':[{'id':'p25','name':'Clássico','work':25,'brk':5}],'cycles':[]},'reviewIntervals':[1,3,7]}
}
MOCK='''window.__uploads=[];window.supabase={createClient:()=>({
 auth:{getSession:async()=>({data:{session:{user:{id:'00000000-0000-4000-8000-000000000001',email:'qa@example.test'}}},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},
 storage:{from:()=>({upload:async (path,file)=>{window.__uploads.push({path,size:file.size});return {error:null}},createSignedUrl:async()=>({data:{signedUrl:'https://example.test/signed.pdf'},error:null}),remove:async()=>({error:null})})},
 from:()=>({select(){return this},eq(){return this},upsert:async()=>({error:null}),maybeSingle:async()=>({data:{data:DATA_HERE},error:null})})})};'''.replace('DATA_HERE',json.dumps(D,ensure_ascii=False))
async def main():
 errors=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':900})
  page.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'index.html').read_text();css=(ROOT/'style.css').read_text()
  html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+css+'</style>')
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/dompurify[^>]*></script>','',html)
  html=html.replace('<script src="topos-config.js"></script>','<script>'+(ROOT/'topos-config.js').read_text()+'</script>')
  html=re.sub(r'<script src="https://cdn.jsdelivr.net/npm/@supabase[^>]*></script>','<script>'+MOCK+'</script>',html)
  html=html.replace('<body>',"<body><script>window.__testStorage={};Object.defineProperty(window,'localStorage',{value:{getItem(k){return window.__testStorage[k]||null},setItem(k,v){window.__testStorage[k]=String(v)},removeItem(k){delete window.__testStorage[k]}}});</script>",1)
  await page.set_content(html,wait_until='domcontentloaded');await page.wait_for_timeout(400)
  assert await page.locator('.topbar h1').count()==1,'App did not load'
  await page.evaluate("navigate('anotacoes')")
  assert await page.locator('.note-card-v5').count()==1
  assert await page.locator('.note-v5-notebook').is_visible()
  await page.locator('.note-v5-notebook').click()
  assert await page.locator('.note-v5-notebook').get_attribute('aria-pressed')=='true'
  await page.locator('.note-card-v5').click()
  assert await page.locator('.question-editor-toolbar').count()==1,'Note toolbar not unified'
  assert await page.locator('.editor-font-control').count()==1
  assert await page.locator('#mNoteBody').is_visible()
  # Apply format to selected text; then persist via save.
  await page.evaluate('''() => {const el=document.querySelector('#mNoteBody');const text=el.querySelector('p').firstChild;const r=document.createRange();r.setStart(text,0);r.setEnd(text,5);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);questionEditorRemember('mNoteBody');applyEditorFontSize('mNoteBody','22');}''')
  assert 'font-size:22px' in (await page.locator('#mNoteBody').inner_html()).replace(' ',''),'Font formatting not inserted'
  await page.locator('.modal-actions').get_by_role('button',name='Salvar anotação').click()
  assert await page.locator('.note-card-v5').count()==1
  await page.locator('.note-card-v5').click()
  assert 'font-size:22px' in (await page.locator('#mNoteBody').inner_html()).replace(' ',''),'Font format not persisted'
  await page.evaluate('closeModal()')
  await page.evaluate("navigate('conteudos')")
  assert await page.locator('.pdf-library').count()==1
  await page.get_by_role('button',name='Editar matéria ou tema').click()
  await page.locator('#mTopicName').fill('Língua Portuguesa')
  await page.evaluate("selectTopicColor('violet')")
  await page.get_by_role('button',name='Salvar').last.click()
  assert await page.locator('.topic-node .name').first.inner_text()=='Língua Portuguesa'
  assert await page.locator('.topic-node').first.get_attribute('class')=='topic-node color-violet'
  await page.locator('#pdfUploadTopic').select_option('top_1')
  await page.locator('#pdfUploadInput').set_input_files({'name':'material.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.5\n1 0 obj\n<<>>\nendobj\n%%EOF\n'})
  await page.wait_for_timeout(200)
  assert await page.locator('.pdf-file-item').count()==1,'PDF not saved'
  assert len(await page.evaluate('window.__uploads'))==1,'PDF mock upload not invoked'
  await page.evaluate("navigate('questoes');openQuestionList('top_1','dificil');openQuestionModal()")
  assert await page.locator('#mQTopic').input_value()=='top_1','New question topic not contextual'
  assert await page.locator('#mQDiff').input_value()=='dificil','New question difficulty not contextual'
  await page.locator('#mQQuestionEditor').fill('O que é intertextualidade?')
  await page.evaluate('''() => {const e=document.getElementById('mQQuestionEditor');const r=document.createRange();r.selectNodeContents(e);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(r);questionEditorRemember('mQQuestionEditor');}''')
  await page.locator('.question-editor-toolbar .editor-font-control select').first.select_option('20')
  assert 'font-size:20px' in (await page.locator('#mQQuestionEditor').inner_html()).replace(' ',''),'Question font not formatted'
  await page.locator('.question-modal-actions button').last.click()
  assert await page.locator('.question-card').count()==1
  await page.evaluate('openQuestionModal(STATE.questions[0].id)')
  assert await page.locator('#mQTopic').input_value()=='top_1'
  assert await page.locator('#mQDiff').input_value()=='dificil'
  assert 'font-size:20px' in (await page.locator('#mQQuestionEditor').inner_html()).replace(' ',''),'Question font not persisted'
  await page.evaluate('closeModal()')
  await page.evaluate("navigate('config')")
  assert await page.locator('.settings-check-row').count()==2
  await page.locator('.settings-check-row').first.locator('input').uncheck()
  await page.evaluate("navigate('questoes');openQuestionList('top_1','dificil');openQuestionModal()")
  assert await page.locator('#mQNotebook').count()==0,'Notebook checkbox not hidden'
  await page.evaluate('closeModal()')
  await page.evaluate("navigate('anotacoes');openNoteModal('note_1')")
  assert await page.locator('#mNoteNotebook').count()==1,'Note notebook must stay visible'
  await page.evaluate('closeModal()')
  await page.screenshot(path=str(ROOT/'tests/v5-notes-desktop.png'),full_page=True)
  await page.set_viewport_size({'width':390,'height':844});await page.evaluate('navigate("conteudos")')
  await page.screenshot(path=str(ROOT/'tests/v5-materias-mobile.png'),full_page=True)
  assert not errors,errors
  print('PASS: notas com fonte selecionada e persistente; caderno; edição de matéria/cor; upload PDF mock; classificação automática de questão; configurações; responsividade sem exceções')
  await browser.close()
if __name__=="__main__":asyncio.run(main())
