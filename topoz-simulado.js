/* TOPOZ — Simulado básico integrado à base existente. Sem bibliotecas externas. */
(function(g){'use strict';
const letters=['A','B','C','D','E'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>g.crypto?.randomUUID?.()||('sim-'+Math.random().toString(36).slice(2));
let state=null,ready=false,step=0,draft=null,activeId=null;
const qualifying=q=>q&&q.type==='objetiva'&&letters.includes(q.correct)&&letters.every(k=>String(q.options?.[k]||'').trim());
function treeIds(topics,root){let result=new Set([root]),change=true;while(change){change=false;for(const t of topics||[])if(result.has(t.parentId)&&!result.has(t.id)){result.add(t.id);change=true;}}return result;}
function rng(seed){let x=seed|0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function shuffle(a,random){const out=a.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function buildSimulado(st,{topicId='',count=10,seed=1}={}){
 const eligible=(st.questions||[]).filter(qualifying).filter(q=>!topicId||treeIds(st.topics||[],topicId).has(q.topicId));
 count=Math.max(1,Math.min(100,Math.floor(Number(count)||10)));
 const questionIds=shuffle(eligible,rng(Number(seed)||1)).slice(0,count).map(q=>q.id);
 return {questionIds,missing:Math.max(0,count-questionIds.length),available:eligible.length};
}
function currentExam(){return state?.simulados?.find(s=>s.id===activeId)||null;}
function currentAttempt(){const e=currentExam();return e?.attempts?.at(-1)||null;}
function title(){return `<div class="v56-head"><span>PRÁTICA ATIVA</span><h2>Simulados de estudo</h2><p>Monte provas a partir das suas próprias questões objetivas. Gabarito somente após finalizar.</p></div>`;}
function form(){const topics=(state.topics||[]),available=(state.questions||[]).filter(qualifying).length;
 return `<section class="v56-panel tpz-sim-panel"><h3>Montar simulado</h3><p>Questões objetivas disponíveis: <strong>${available}</strong>.</p>
 <div class="tpz-sim-step"><label for="tpzSimTitle">Título do simulado</label><input id="tpzSimTitle" maxlength="120" value="Meu simulado"></div>
 <div class="tpz-sim-controls"><label for="tpzSimTopic">Matérias<select id="tpzSimTopic"><option value="">Todas as matérias</option>${topics.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label>
 <label for="tpzSimCount">Quantidade de questões<input id="tpzSimCount" type="number" min="1" max="100" value="10"></label>
 <label for="tpzSimDuration">Tempo de prova (min)<input id="tpzSimDuration" type="number" min="0" max="300" value="30"></label></div>
 <div id="tpzSimPreview" aria-live="polite"></div><div class="tpz-sim-actions"><button type="button" class="btn" data-tpz-sim="preview">Pré-visualizar</button><button type="button" class="btn btn-primary" data-tpz-sim="create">Criar e iniciar simulado</button></div>
 <p class="review-help">Questões antigas sem alternativas A–E não entram no sorteio. Use o cadastro objetivo abaixo.</p></section>
 <section class="v56-panel tpz-sim-panel"><h3>Cadastrar questão objetiva</h3>
 <div class="field"><label for="tpzQStatement">Enunciado</label><textarea id="tpzQStatement" maxlength="3000" rows="3"></textarea></div>
 ${letters.map(k=>`<div class="field"><label for="tpzQ${k}">Alternativa ${k}</label><input id="tpzQ${k}" maxlength="1000"></div>`).join('')}
 <div class="tpz-sim-controls"><label for="tpzQCorrect">Gabarito<select id="tpzQCorrect">${letters.map(k=>`<option value="${k}">${k}</option>`).join('')}</select></label>
 <label for="tpzQTopic">Matéria<select id="tpzQTopic"><option value="">Sem matéria</option>${topics.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label></div>
 <div class="field"><label for="tpzQComment">Comentário do gabarito</label><textarea id="tpzQComment" maxlength="3000" rows="3"></textarea></div>
 <button type="button" class="btn btn-primary" data-tpz-sim="addQuestion">Salvar questão objetiva</button></section>`;}
function history(){return `<section class="v56-panel tpz-sim-panel"><h3>Simulados criados</h3>${(state.simulados||[]).length?
 [...state.simulados].reverse().slice(0,25).map(e=>`<article class="tpz-sim-history"><div><strong>${esc(e.title)}</strong><small>${e.questionIds.length} questões · ${e.attempts.length} tentativa(s)</small></div><button type="button" class="btn btn-sm" data-tpz-sim="open" data-id="${esc(e.id)}">Abrir</button></article>`).join(''):'<p>Você ainda não criou nenhum simulado.</p>'}</section>`;}
function questionView(){const e=currentExam(),a=currentAttempt();if(!e||!a)return title()+history()+form();
 if(a.finishedAt)return resultView(e,a);
 const i=Math.min(a.position,e.questionIds.length-1),q=state.questions.find(q=>q.id===e.questionIds[i]);if(!q)return title()+`<p>Questão removida. Retorne à lista.</p><button data-tpz-sim="back">Voltar</button>`;
 return title()+`<section class="v56-panel tpz-sim-panel"><div class="tpz-sim-status"><span>Questão <strong>${i+1}</strong> de ${e.questionIds.length}</span><span>${Object.keys(a.answers||{}).length} respondidas</span></div>
 <h3>${esc(e.title)}</h3><div class="tpz-sim-statement">${esc(q.question)}</div>
 <fieldset class="tpz-sim-options"><legend>Selecione uma alternativa</legend>${letters.map(k=>`<label><input type="radio" name="tpzSimAnswer" value="${k}" ${a.answers?.[q.id]===k?'checked':''}><strong>${k})</strong> ${esc(q.options[k])}</label>`).join('')}</fieldset>
 <div class="tpz-sim-actions"><button type="button" class="btn" data-tpz-sim="prev" ${i===0?'disabled':''}>Anterior</button>
 <button type="button" class="btn" data-tpz-sim="next" ${i===e.questionIds.length-1?'disabled':''}>Próxima</button>
 <button type="button" class="btn btn-primary" data-tpz-sim="finish">Finalizar e corrigir</button></div>
 <p class="review-help">O progresso é salvo na sua conta; confira o indicador de sincronização. Em caso de conflito, não saia da página sem exportar seus dados.</p></section>`;}
function resultView(e,a){let correct=0,wrong=0,blank=0;
 const rows=e.questionIds.map((qid,i)=>{const q=state.questions.find(x=>x.id===qid);if(!q)return '';
  const ans=a.answers?.[qid]||null,ok=ans===q.correct;
  if(!ans)blank++;else if(ok)correct++;else wrong++;
  return `<article class="tpz-sim-history"><div><strong>${i+1}. ${esc(q.question)}</strong><small>Sua resposta: ${esc(ans||'em branco')} · Gabarito: ${esc(q.correct)} ${ok?'✓':'✗'}</small><p>${esc(q.comment||q.answer||'Sem comentário registrado.')}</p></div></article>`;
 }).join('');
 return title()+`<section class="v56-panel tpz-sim-panel"><h3>Resultado — ${esc(e.title)}</h3><div class="tpz-sim-numbers"><div><strong>${correct}</strong><span>Certas</span></div><div><strong>${wrong}</strong><span>Erradas</span></div><div><strong>${blank}</strong><span>Em branco</span></div><div><strong>${e.questionIds.length?Math.round(correct*100/e.questionIds.length):0}%</strong><span>Acerto</span></div></div><h4>Gabarito comentado</h4>${rows}<div class="tpz-sim-actions"><button type="button" class="btn" data-tpz-sim="back">Voltar aos simulados</button><button type="button" class="btn btn-primary" data-tpz-sim="retry">Refazer</button></div></section>`;}
function view(st){state=st;return title()+(activeId?questionView().replace(title(),''):form()+history());}
function rerender(){if(g.ROUTE==='simulado'||typeof ROUTE!=='undefined'&&ROUTE==='simulado')g.render();}
function addQuestion(){const v=id=>document.getElementById(id)?.value.trim()||'';
 const statement=v('tpzQStatement'),options=Object.fromEntries(letters.map(k=>[k,v('tpzQ'+k)]));
 if(statement.length<10||letters.some(k=>!options[k])){g.toast('Informe um enunciado de 10 caracteres e as cinco alternativas.');return;}
 const correct=v('tpzQCorrect'),comment=v('tpzQComment'),stamp=new Date().toISOString(),topicId=v('tpzQTopic')||null;
 state.questions.push({id:id(),question:statement,answer:'Gabarito: '+correct+'\n'+comment,questionHtml:'<p>'+esc(statement)+'</p>',answerHtml:'<p>'+esc('Gabarito: '+correct+' '+comment)+'</p>',topicId,difficulty:'medio',tags:[],status:'ativa',notebookDone:false,type:'objetiva',options,correct,comment,baseText:'',history:[],createdAt:stamp});
 g.saveState();g.toast('Questão objetiva criada. Confira o salvamento.');rerender();
}
function preview(){const t=document.getElementById('tpzSimTopic')?.value||'',count=Number(document.getElementById('tpzSimCount')?.value||10);draft=buildSimulado(state,{topicId:t,count,seed:12345});
 const slot=document.getElementById('tpzSimPreview');if(slot)slot.textContent=`Prévia: ${draft.questionIds.length} questão(ões) disponíveis${draft.missing?`, faltam ${draft.missing} para a quantidade solicitada.`:'.'}`;
}
function create(){const count=Number(document.getElementById('tpzSimCount')?.value||10),topicId=document.getElementById('tpzSimTopic')?.value||'',seed=Math.floor(Math.random()*1000000)+1;
 const built=buildSimulado(state,{topicId,count,seed});if(!built.questionIds.length){g.toast('Cadastre questões objetivas para iniciar.');return;}
 const now=new Date().toISOString();const e={id:id(),title:document.getElementById('tpzSimTitle')?.value?.trim().slice(0,120)||'Meu simulado',createdAt:now,seed,config:{durationMin:Number(document.getElementById('tpzSimDuration')?.value)||0},questionIds:built.questionIds,attempts:[{id:id(),startedAt:now,finishedAt:null,position:0,answers:{}}]};
 state.simulados.push(e);activeId=e.id;g.saveState();rerender();
}
function changeAnswer(target){if(!ready||!activeId||target.name!=='tpzSimAnswer')return;const e=currentExam(),a=currentAttempt(),qid=e?.questionIds?.[a?.position];if(!qid||a.finishedAt)return;a.answers[qid]=target.value;g.saveState();}
function act(e){const b=e.target.closest('[data-tpz-sim]');if(!b||!ready)return;
 const op=b.dataset.tpzSim;if(op==='addQuestion')addQuestion();else if(op==='preview')preview();else if(op==='create')create();
 else if(op==='open'){activeId=b.dataset.id;rerender();}else if(op==='back'){activeId=null;rerender();}
 else {const exam=currentExam(),a=currentAttempt();if(!exam||!a)return;
  if(op==='next'){a.position=Math.min(exam.questionIds.length-1,a.position+1);g.saveState();rerender();}
  if(op==='prev'){a.position=Math.max(0,a.position-1);g.saveState();rerender();}
  if(op==='finish'&&confirm('Finalizar o simulado e exibir o gabarito?')){a.finishedAt=new Date().toISOString();for(const qid of exam.questionIds){const q=state.questions.find(x=>x.id===qid);if(q){const ans=a.answers[qid];q.history=q.history||[];q.history.push({date:a.finishedAt,simulado:exam.id,result:ans?(ans===q.correct?'certo':'errado'):'branco',timeSec:0});}}g.saveState();rerender();}
  if(op==='retry'){exam.attempts.push({id:id(),startedAt:new Date().toISOString(),finishedAt:null,position:0,answers:{}});g.saveState();rerender();}
 }
}
let events=false;
function afterRender(st,isReady,route){state=st;ready=!!isReady;
 if(!events){document.addEventListener('click',act);document.addEventListener('change',e=>changeAnswer(e.target));events=true;}
 if(route!=='simulado')activeId=null;
}
g.TOPOZ_SIM=Object.freeze({view,afterRender,buildSimulado});if(typeof module==='object'&&module.exports)module.exports={buildSimulado};
})(typeof window!=='undefined'?window:globalThis);
