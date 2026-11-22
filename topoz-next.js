/* TOPOZ: extensões incrementais. Funciona com gateway real, nunca gera respostas fictícias. */
(function(g){'use strict';
const tasks={
 dashboard:[['coach_semanal','Análise da semana']],calendario:[['plano_ajustes','Ajustar planejamento']],meudia:[['coach_semanal','Resumo de evolução']],
 fila:[['explicar_erro','Explicar dificuldade']],planejador:[['plano_ajustes','Revisar proposta']],
 anotacoes:[['resumo','Resumir nota'],['cartoes','Gerar flashcards'],['questoes_objetivas','Gerar questões'],['feynman','Técnica Feynman'],['mapa_gerar','Rascunho de mapa']],
 conteudos:[['edital_arvore','Organizar edital']],metas:[['plano_ajustes','Sugerir metas']],revisoes:[['explicar_erro','Entender erro']],
 sessoes:[['coach_semanal','Analisar sessões']],duvidas:[['explicacao','Explicar dúvida']],flashcards:[['cartoes','Criar cartões']],
 mapas:[['mapa_gerar','Gerar mapa textual'],['mapa_expandir','Expandir ramo']],pesquisa:[['resumo_com_trecho','Resumo com fontes'],['termos_de_busca','Termos de pesquisa'],['extrair_campos','Extrair campos']],
 trilhas:[['trilha_gerar','Sugerir trilha']],estudio:[['aula_plano','Criar plano de aula']],ditado:[['transcricao_resumo','Resumir transcrição']],
 questoes:[['questoes_objetivas','Gerar questões'],['explicar_erro','Explicar erro'],['distratores','Sugerir alternativas']],
 eventos:[['plano_ajustes','Planejar até prova']],estatisticas:[['coach_semanal','Analisar dados']],favoritos:[['resumo','Resumir conteúdo']],
 historico:[['coach_semanal','Analisar atividades']],assistente:[['resumo','Resumo'],['cartoes','Gerar cartões'],['questoes_objetivas','Gerar questões']],
 config:[]
};
let state=null,ready=false,route='',lastActivator=null,current=null,prevOverflow='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function buildDialog(){if(document.getElementById('tpzAIDialog'))return;
 const overlay=document.createElement('div');overlay.id='tpzAIDialog';overlay.className='tpz-ai-dialog';overlay.hidden=true;
 overlay.innerHTML=`<div class="tpz-ai-panel" role="dialog" aria-modal="true" aria-labelledby="tpzAITitle">
 <h2 id="tpzAITitle">✦ Assistente de IA</h2>
 <p>Uma sugestão para você revisar. A IA pode errar. Nada será salvo sem sua confirmação.</p>
 <div class="field"><label for="tpzAITask">Tarefa</label><select id="tpzAITask"></select></div>
 <div class="field"><label for="tpzAINote">Utilizar uma anotação existente (opcional)</label><select id="tpzAINote"><option value="">Digitar ou colar material</option></select></div>
 <div class="field"><label for="tpzAIText">Conteúdo a enviar para o provedor</label><textarea id="tpzAIText" maxlength="12000" placeholder="Cole aqui um trecho de estudo (mínimo 20 caracteres)..."></textarea></div>
 <label class="tpz-ai-consent"><input type="checkbox" id="tpzAIConsent"> Autorizo o envio deste conteúdo ao provedor de IA configurado, para gerar esta sugestão. Posso revogar nas configurações da IA. Não envie dados sensíveis.</label>
 <div id="tpzAIStatus" role="status" aria-live="polite"></div><div class="tpz-ai-result" id="tpzAIResult" hidden></div>
 <div class="tpz-ai-actions"><button type="button" class="btn btn-primary" data-tpz-ai="generate">Gerar com IA</button><button type="button" class="btn btn-primary" data-tpz-ai="approve" hidden>Aprovar e salvar</button><button type="button" class="btn" data-tpz-ai="close">Fechar</button></div>
 </div>`;
 document.body.appendChild(overlay);
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 overlay.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.stopPropagation();close();return;}
  if(e.key!=='Tab')return;
  const fs=[...overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(x=>x.getClientRects().length);
  if(fs.length&&(e.shiftKey&&document.activeElement===fs[0]||!e.shiftKey&&document.activeElement===fs[fs.length-1])){e.preventDefault();(e.shiftKey?fs[fs.length-1]:fs[0]).focus();}
 });
 overlay.querySelector('#tpzAINote').addEventListener('change',e=>{
  const note=state?.notes?.find(n=>n.id===e.target.value);
  if(!note)return;const doc=new DOMParser().parseFromString(note.html||'','text/html');
  overlay.querySelector('#tpzAIText').value=(note.title+'\n'+doc.body.textContent).slice(0,12000);
 });
 overlay.addEventListener('click',async e=>{const btn=e.target.closest('[data-tpz-ai]');if(!btn)return;
  if(btn.dataset.tpzAi==='close')close();else if(btn.dataset.tpzAi==='generate')await generate(btn);else if(btn.dataset.tpzAi==='approve')approve();});
}
function open(){if(!ready||!g.CURRENT_USER&&!g.TOPOS_STUDY_STANDALONE){/* lexical CURRENT_USER checked by server */}
 buildDialog();const overlay=document.getElementById('tpzAIDialog');lastActivator=document.activeElement;current=null;
 const select=overlay.querySelector('#tpzAITask');select.innerHTML=(tasks[route]||tasks.assistente).map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('');
 const notes=overlay.querySelector('#tpzAINote');notes.innerHTML='<option value="">Digitar ou colar material</option>'+(state?.notes||[]).slice(0,500).map(n=>`<option value="${esc(n.id)}">${esc(n.title)}</option>`).join('');
 overlay.querySelector('#tpzAIText').value='';overlay.querySelector('#tpzAIConsent').checked=false;overlay.querySelector('#tpzAIStatus').textContent='';
 overlay.querySelector('#tpzAIResult').hidden=true;overlay.querySelector('[data-tpz-ai=approve]').hidden=true;
 prevOverflow=document.body.style.overflow;document.body.style.overflow='hidden';overlay.hidden=false;select.focus();
}
function close(){const overlay=document.getElementById('tpzAIDialog');if(!overlay||overlay.hidden)return;overlay.hidden=true;document.body.style.overflow=prevOverflow;current=null;if(lastActivator?.isConnected)lastActivator.focus();}
async function generate(btn){const overlay=document.getElementById('tpzAIDialog'),input=overlay.querySelector('#tpzAIText').value.trim(),task=overlay.querySelector('#tpzAITask').value,status=overlay.querySelector('#tpzAIStatus');
 if(!state||!ready){status.textContent='Entre com sua conta e conclua o carregamento dos dados.';return;}
 if(g.TOPOS_STUDY_STANDALONE){status.textContent='A IA real não é executada na demonstração offline.';return;}
 if(input.length<20||input.length>12000){status.textContent='Informe entre 20 e 12.000 caracteres.';return;}
 if(!overlay.querySelector('#tpzAIConsent').checked){status.textContent='Confirme o consentimento para o envio do texto.';return;}
 current=null;btn.disabled=true;status.textContent='Conferindo consentimento e solicitando ao provedor...';
 try{
  // Supabase sempre preserva a sessão atual; consentimento é versionado e vinculado ao UID autenticado.
  const sess=await sb.auth.getUser();const uid=sess.data?.user?.id;
  if(!uid)throw new Error('Faça login antes de utilizar a IA.');
  const {error:cErr}=await sb.from('user_consents').upsert({user_id:uid,ai_allowed:true,ai_version:'ai-v1',consented_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(cErr)throw new Error('Consentimento indisponível. Verifique a migração 003 no staging.');
  const {data,error}=await sb.functions.invoke('ai-gateway',{body:{task,text:input}});
  if(error)throw new Error('Serviço indisponível. Consulte a função ai-gateway, sua cota e os segredos no staging.');
  if(!data?.draft||typeof data.draft.body!=='string'||!Array.isArray(data.draft.limitations))throw new Error(data?.error||'Resposta não validada pelo servidor.');
  current={task,draft:data.draft,input};
  const r=overlay.querySelector('#tpzAIResult');
  r.textContent=data.draft.title+'\n\n'+data.draft.body+'\n\n'+(data.draft.limitations.length?'Limitações: '+data.draft.limitations.join('; '):'');
  if(Array.isArray(data.draft.items)&&data.draft.items.length){const pre=document.createElement('pre');pre.textContent=JSON.stringify(data.draft.items,null,2);r.appendChild(pre);}
  r.hidden=false;overlay.querySelector('[data-tpz-ai=approve]').hidden=false;
  status.textContent=`Rascunho recebido ${data.cached?'(cache)':''}. Revise antes de salvar; nenhuma alteração automática foi feita.`;
 }catch(err){status.textContent=err?.message||'Falha no serviço';}
 finally{btn.disabled=false;}
}
function approve(){if(!current||!ready||!state)return;
 const {draft,task}=current;
 if(!confirm('Você conferiu o conteúdo gerado por IA e quer salvar os itens aprovados?'))return;
 const stamp=new Date().toISOString();let count=0;
 if(task==='cartoes'&&Array.isArray(draft.items)){
  for(const x of draft.items.slice(0,15)){
   if(typeof x.front!=='string'||typeof x.back!=='string'||!x.front.trim()||!x.back.trim())continue;
   state.flashcards.push({id:crypto.randomUUID(),front:x.front.slice(0,2000),back:x.back.slice(0,5000),topicId:null,difficulty:'facil',nextReview:new Date().toISOString().slice(0,10),repetitions:0,totalReviews:0,reviewIntervalDays:0,easeFactor:2.5,reviewHistory:[],notebookDone:false,createdAt:stamp});count++;
  }
 }else if((task==='questoes'||task==='questoes_objetivas')&&Array.isArray(draft.items)){
  for(const x of draft.items.slice(0,10)){
   if(!x.statement||!x.options||!x.correct)continue;
   const statement=String(x.statement)+'\n'+['A','B','C','D','E'].map(k=>k+') '+String(x.options[k]||'')).join('\n');
   const answer='Gabarito: '+x.correct+'\n'+String(x.explanation||'');
   state.questions.push({id:crypto.randomUUID(),question:statement.slice(0,3000),answer:answer.slice(0,8000),questionHtml:'<p>'+esc(statement).replace(/\n/g,'<br>')+'</p>',answerHtml:'<p>'+esc(answer).replace(/\n/g,'<br>')+'</p>',topicId:null,difficulty:'medio',tags:['ia-revisada'],status:'ativa',notebookDone:false,createdAt:stamp});count++;
  }
 }else{
  state.notes.push({id:crypto.randomUUID(),title:String(draft.title||'Rascunho assistido').slice(0,200),html:'<p>'+esc(draft.body).replace(/\n/g,'<br>')+'</p>',topicId:null,tags:['ia-revisada'],priority:'normal',favorite:false,reviewOn:false,nextReview:null,interval:0,createdAt:stamp,updatedAt:stamp});count=1;
 }
 if(count){g.saveState();close();g.navigate((task==='cartoes')?'flashcards':(['questoes','questoes_objetivas'].includes(task)?'questoes':'anotacoes'));g.toast(count+' item(ns) aprovado(s). Confira o status da sincronização.');}
}
function addExportUI(area,s){
 const notes=(s?.notes||[]);if(!notes.length)return;
 const box=document.createElement('section');box.className='tpz-ai-box tpz-export-box';box.setAttribute('aria-label','Exportar anotações');
 const label=document.createElement('label');label.textContent='CADERNO DE ANOTAÇÕES · EXPORTAÇÃO';label.setAttribute('for','tpzExportScope');
 const select=document.createElement('select');select.id='tpzExportScope';
 select.innerHTML='<option value="all">Todas as anotações</option>'+notes.slice(0,500).map(n=>`<option value="note:${esc(n.id)}">${esc(n.title)}</option>`).join('')+
 (s.topics||[]).map(t=>`<option value="topic:${esc(t.id)}">Matéria: ${esc(t.name)}</option>`).join('');
 const pdf=document.createElement('button');pdf.type='button';pdf.className='btn btn-sm';pdf.textContent='Imprimir / Salvar PDF';
 const word=document.createElement('button');word.type='button';word.className='btn btn-sm';word.textContent='Baixar Word (.docx)';
 const selection=()=>{const v=select.value;if(v==='all')return notes.slice(0,300);if(v.startsWith('note:'))return notes.filter(n=>n.id===v.slice(5));
 const topicId=v.slice(6),ids=new Set([topicId]);let changed=true;while(changed){changed=false;for(const t of s.topics||[])if(ids.has(t.parentId)&&!ids.has(t.id)){ids.add(t.id);changed=true;}}
 return notes.filter(n=>ids.has(n.topicId)).slice(0,300);};
 pdf.addEventListener('click',()=>{try{const chosen=selection();if(!chosen.length)throw Error('Nenhuma anotação nessa seleção');
  g.TOPOZ_EXPORT.printPDF('Meu caderno de estudos',chosen,s.topics||[]);}catch(e){g.toast(e.message||'Não foi possível imprimir');}});
 word.addEventListener('click',async()=>{word.disabled=true;try{const chosen=selection();if(!chosen.length)throw Error('Nenhuma anotação nessa seleção');
  const blob=await g.TOPOZ_EXPORT.docx('Meu caderno de estudos',chosen,s.topics||[]);g.TOPOZ_EXPORT.download(blob,'TOPOZ_Anotacoes_'+new Date().toISOString().slice(0,10)+'.docx');}
 catch(e){g.toast(e.message||'Não foi possível gerar documento');}finally{word.disabled=false;}});
 box.append(label,select,pdf,word);area.prepend(box);
}
function afterRender(s,isReady,r){state=s;ready=!!isReady;route=r;
 const area=document.getElementById('content');if(!area)return;
 const available=tasks[r]||[];if(!ready)return;
 if(r==='anotacoes')addExportUI(area,s);
 if(!available.length)return;
 const first=area.firstElementChild; if(first?.classList?.contains('tpz-ai-box') && !first.classList.contains('tpz-export-box'))return;
 const box=document.createElement('div');box.className='tpz-ai-box';
 const label=document.createElement('span');label.textContent='✦ ASSISTÊNCIA OPCIONAL · REVISÃO HUMANA';
 const button=document.createElement('button');button.className='btn btn-sm';button.type='button';button.textContent='Usar IA nesta área';button.addEventListener('click',open);
 box.append(label,button);area.prepend(box);
}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){
 const search=g.openSearch;if(typeof search==='function'&&!e.target.closest('[contenteditable=true],textarea,input')){e.preventDefault();search();}}
});
g.TOPOZ_NEXT=Object.freeze({afterRender});
})(window);
