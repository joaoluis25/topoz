from playwright.sync_api import sync_playwright
from pathlib import Path
import base64,io,zipfile
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page()
 page.evaluate("""() => { const m=new Map(),s={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};Object.defineProperty(window,'localStorage',{value:s});Object.defineProperty(window,'sessionStorage',{value:s}); }""")
 page.add_script_tag(content=(root/'topoz-export-kit.js').read_text())
 obj=page.evaluate("""async()=>{
 const notes=[{title:'Revisão de Matemática',html:'<h2>Operações</h2><p>Dois + dois = 4.</p><script>alert(1)</script><iframe src="https://evil.test"></iframe>',topicId:'m'}];
 const blob=await window.TOPOZ_EXPORT.docx('Meu caderno',notes,[{id:'m',name:'Matemática'}]);
 const data=Array.from(new Uint8Array(await blob.arrayBuffer()));
 const html=window.TOPOZ_EXPORT.htmlDocument('Meu caderno',notes,[{id:'m',name:'Matemática'}]);
 return {bytes:data,html,filename:window.TOPOZ_EXPORT.safeName('../titulo\\x00.docx')};
 }""")
 doc=bytes(obj['bytes']);z=zipfile.ZipFile(io.BytesIO(doc));names=z.namelist();print('DOCX entries',names)
 assert 'word/document.xml' in names and 'word/media/logo.png' in names
 document=z.read('word/document.xml').decode();assert 'Revisão de Matemática' in document and 'Dois + dois' in document
 assert '<script>' not in document and 'evil.test' not in document
 assert '<script>' not in obj['html'] and 'evil.test' not in obj['html']
 assert '..' not in obj['filename']
 try:
  from docx import Document
  parsed=Document(io.BytesIO(doc));assert any('Matemática' in p.text for p in parsed.paragraphs)
  print('Word parse OK',len(parsed.paragraphs),'parágrafos,',len(doc),'bytes')
 except ImportError: print('python-docx não disponível')
 page.close();b.close()
