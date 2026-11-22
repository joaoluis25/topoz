/* TOPOZ — kit de documentos sem bibliotecas externas.
 * PDF: documento HTML A4 via impressão do navegador. Word: arquivo DOCX OOXML real, ZIP Store.
 * Não importa HTML não sanitizado e não inclui metadados pessoais. */
(function(g){'use strict';
const encoder=new TextEncoder();
const LOGO_PNG_B64='iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABgklEQVR4nO2bvY3CQBCF364o4Uq4CF0VBHRyGSUQXglkdHIBVSAiSqAHLjitZBmvzfjvzc7OFyF5wPOe3443YAOEfHx+PaXfWZPH/Rok9W8Vaxed4x0zegtKFd6mz4iYu2BFPNCvpdMAS+ITOU0vBlgUn+jSFocKrNHWGHMXLNPUmh2CtRCBup5+Imn2BLAbYBNqjH+TDevGx9/zYM3P/nvxPqpfAm4AuwE2bgDjploGIOAJcAPcAHYDbGg7wancTrvBmu3hMlhTfQLcAHYDbIo0YK71DxAM0LQLBApNwJy4AewG2LgB7AbYTNoKMyb6nK9AwBPgBow2QNuGZiyrJkCjab4E2A2wGWWAxiiPpagEzL0HAAozYAncAHYDbMQGWBqAgCdgPQO0JqeYBCzxCgSEBmh9ilMoJgFLEaVnbCzxuF9DAOr8rzDwb4AvAUB+1MwCSbMnIH2oKQVNrTF3wSptjS9LwLIJXdo6Z4BFE3KaskPQkgl9WvzwtPRHtZshTe4fN9x8HQ5DXksAAAAASUVORK5CYII=';
const logoBytes=()=>Uint8Array.from(atob(LOGO_PNG_B64),c=>c.charCodeAt(0));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xml=esc;
const safeName=x=>String(x||'documento').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/\x00-\x1f:<>|?*]/g,'-').replace(/\.\.+/g,'-').replace(/[^a-zA-Z0-9 _.-]/g,'').trim().replace(/\s+/g,'_').slice(0,70)||'documento';
const dateBR=()=>new Date().toLocaleDateString('pt-BR');
const dateID=()=>new Date().toISOString().slice(0,10).replace(/-/g,'');
const strip=s=>{const d=new DOMParser().parseFromString(String(s||''),'text/html');return d.body.textContent||'';};
const getBlocks=(notes,topics)=>{
 const topicName=new Map((topics||[]).map(t=>[t.id,t.name]));
 const out=[];
 if(!Array.isArray(notes)||notes.length>300)throw Error('Limite de 300 anotações por documento; selecione menos itens');
 for(const n of notes){
  out.push({type:'heading',level:1,text:String(n.title||'Anotação').slice(0,250)});
  if(n.topicId)out.push({type:'meta',text:'Matéria: '+(topicName.get(n.topicId)||'Sem matéria')});
  const d=new DOMParser().parseFromString(String(n.html||''),'text/html');
  for(const el of [...d.body.querySelectorAll('script,iframe,object,embed,form,style,svg,video,audio')])el.remove();
  const walk=(node)=>{
   for(const child of [...node.childNodes]){
    if(child.nodeType===3){if(child.textContent?.trim())out.push({type:'paragraph',text:child.textContent});continue;}
    if(child.nodeType!==1)continue;const tag=child.tagName.toLowerCase();
    if(tag==='img'){
     const src=String(child.getAttribute('src')||'');
     // No external URLs ever embedded. PNG/JPEG etc require explicit image pipeline in future.
     out.push({type:'paragraph',text:'[Imagem na anotação: '+String(child.getAttribute('alt')||'sem descrição').slice(0,100)+']'});
    }else if(['h1','h2','h3','h4'].includes(tag)){out.push({type:'heading',level:Number(tag[1]),text:child.textContent||''});}
    else if(tag==='li'){out.push({type:'bullet',text:child.textContent||''});}
    else if(tag==='pre'||tag==='code'){out.push({type:'code',text:child.textContent||''});}
    else if(tag==='blockquote'){out.push({type:'quote',text:child.textContent||''});}
    else if(tag==='p'||tag==='div'){out.push({type:'paragraph',text:child.textContent||''});}
    else if(tag==='br'){out.push({type:'paragraph',text:''});}
    else walk(child);
   }
  };walk(d.body);
 }
 if(out.length>3000)throw Error('Limite de 3.000 blocos por documento; selecione menos itens');
 return out;
};
function htmlDocument(title,notes,topics){
 const blocks=getBlocks(notes,topics);
 return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>
 @page{size:A4;margin:20mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#14242c;font:11pt/1.5 Georgia,'Times New Roman',serif}
 header{display:flex;align-items:center;gap:14px;border-bottom:3px solid #83d7bd;background:#14242c;padding:12px 16px;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 header img{width:42px;height:42px}header span{font:700 12px monospace;letter-spacing:.13em}main{margin:24px 0}
 h1{font-size:22px;margin:28px 0 6px;break-after:avoid}h2{font-size:17px;break-after:avoid}h3{font-size:14px;break-after:avoid}p{margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f0f5f4;padding:9px;border-left:3px solid #83d7bd}
 blockquote{border-left:3px solid #e8b46e;margin:12px 0;padding-left:12px}.meta{font:10px Inter,Arial,sans-serif;color:#52656b}
 footer{border-top:1px solid #d7e2e6;padding:9px 0;font:10px monospace;color:#52656b;display:flex;justify-content:space-between}
 </style></head><body><header><img src="data:image/png;base64,${LOGO_PNG_B64}" alt=""><span>TOPOZ ESTUDOS // CADERNO DE ANOTAÇÕES</span></header><main>
 <h1>${esc(title)}</h1><p class="meta">Documento gerado em ${esc(dateBR())}. Apenas as anotações selecionadas, sem dados de conta ou identificadores internos.</p>
 ${blocks.map(b=>b.type==='heading'?`<h${Math.min(3,b.level||1)}>${esc(b.text)}</h${Math.min(3,b.level||1)}>`:b.type==='code'?`<pre>${esc(b.text)}</pre>`:b.type==='quote'?`<blockquote>${esc(b.text)}</blockquote>`:b.type==='bullet'?`<p>• ${esc(b.text)}</p>`:`<p class="${b.type==='meta'?'meta':''}">${esc(b.text)}</p>`).join('')}
 </main><footer><span>TOPOZ // PLANEJE. EXECUTE. EVOLUA.</span><span>${esc(dateBR())}</span></footer></body></html>`;
}
function printPDF(title,notes,topics){
 if(!notes?.length)throw Error('Selecione pelo menos uma anotação');
 if(notes.length>300)throw Error('Limite de 300 anotações por documento');
 const popup=window.open('','_blank');
 if(popup)popup.opener=null;
 if(!popup)throw Error('Permita janelas pop-up para gerar o PDF pelo navegador');
 popup.document.open();popup.document.write(htmlDocument(title,notes,topics));popup.document.close();
 popup.addEventListener('load',()=>{try{popup.focus();popup.print();}catch{}},{once:true});
}
// PKZIP store; no external package/CDN.
let crcTable=null;
function crc32(buf){if(!crcTable){crcTable=new Uint32Array(256);for(let i=0;i<256;i++){let x=i;for(let j=0;j<8;j++)x=x&1?(x>>>1)^0xEDB88320:x>>>1;crcTable[i]=x>>>0;}}let crc=0xFFFFFFFF;for(const x of buf)crc=(crc>>>8)^crcTable[(crc^x)&255];return (crc^0xFFFFFFFF)>>>0;}
function zip(entries){const parts=[],central=[];let offset=0;const u16=(d,n)=>d.setUint16(n[0],n[1],true),u32=(d,n)=>d.setUint32(n[0],n[1],true);
 const segment=(signature,length)=>{const a=new Uint8Array(length),d=new DataView(a.buffer);d.setUint32(0,signature,true);return [a,d];};
 for(const [name,data] of entries){const fn=encoder.encode(name),bytes=data instanceof Uint8Array?data:encoder.encode(data),crc=crc32(bytes);
  const [loc,ld]=segment(0x04034b50,30);ld.setUint16(4,20,true);ld.setUint16(6,2048,true);ld.setUint32(14,crc,true);ld.setUint32(18,bytes.length,true);ld.setUint32(22,bytes.length,true);ld.setUint16(26,fn.length,true);
  parts.push(loc,fn,bytes);
  const [cent,cd]=segment(0x02014b50,46);cd.setUint16(4,20,true);cd.setUint16(6,20,true);cd.setUint16(8,2048,true);cd.setUint32(16,crc,true);cd.setUint32(20,bytes.length,true);cd.setUint32(24,bytes.length,true);cd.setUint16(28,fn.length,true);cd.setUint32(42,offset,true);
  central.push(cent,fn);offset+=loc.length+fn.length+bytes.length;
 }
 const centralBytes=central.reduce((a,b)=>a+b.length,0);
 const [end,ed]=segment(0x06054b50,22);ed.setUint16(8,entries.length,true);ed.setUint16(10,entries.length,true);ed.setUint32(12,centralBytes,true);ed.setUint32(16,offset,true);
 return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
const wpar=(text,style)=>`<w:p>${style?`<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`:''}<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
async function docx(title,notes,topics){
 if(!notes?.length||notes.length>300)throw Error('Selecione entre 1 e 300 anotações');
 const blocks=getBlocks(notes,topics);
 if(blocks.length>3000)throw Error('Documento acima do limite de blocos');
 let logo=logoBytes();
 const image=logo?`<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="457200" cy="457200"/><wp:docPr id="1" name="Símbolo TOPOZ"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="457200" cy="457200"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`:'';
 const docBody=image+wpar('TOPOZ ESTUDOS  //  CADERNO DE ANOTAÇÕES','Brand')+wpar(title,'Title')+wpar('Gerado em '+dateBR()+'. Contém somente as anotações selecionadas.','Subtitle')+
  blocks.map(b=>wpar((b.type==='bullet'?'• ':'')+(b.text||''),b.type==='heading'?'Heading'+Math.min(3,b.level||1):b.type==='meta'?'Subtitle':b.type==='code'?'Code':undefined)).join('');
 const documentXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${docBody}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708"/></w:sectPr></w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Normal" w:default="1"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="22"/><w:color w:val="14242C"/></w:rPr></w:style>${[['Brand',22,'83D7BD'],['Title',34,'14242C'],['Subtitle',18,'536C72'],['Heading1',28,'14242C'],['Heading2',24,'14242C'],['Heading3',22,'14242C'],['Code',20,'14242C']].map(([nm,sz,col])=>`<w:style w:type="paragraph" w:styleId="${nm}"><w:name w:val="${nm}"/><w:rPr><w:b/><w:color w:val="${col}"/><w:sz w:val="${sz}"/></w:rPr></w:style>`).join('')}</w:styles>`;
 const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo?'<Default Extension="png" ContentType="image/png"/>':''}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
 const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
 const documentRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${logo?'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>':''}</Relationships>`;
 const entries=[['[Content_Types].xml',types],['_rels/.rels',rels],['word/document.xml',documentXml],['word/styles.xml',styles],['word/_rels/document.xml.rels',documentRels]];
 if(logo)entries.push(['word/media/logo.png',logo]);
 return zip(entries);
}
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=safeName(filename);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
const API={safeName,getBlocks,htmlDocument,printPDF,docx,download};
g.TOPOZ_EXPORT=Object.freeze(API);if(typeof module==='object'&&module.exports)module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
