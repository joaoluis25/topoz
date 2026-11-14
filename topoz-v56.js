/* TOPOZ Estudos V5.6 — Fila de revisão e planejamento determinístico com aprovação.
 * Reutiliza notas, flashcards e eventos do schemaVersion 4; não cria IA fictícia.
 */
(function(global){
 'use strict';
 let proposal=null;
 let currentState=null,currentReady=false,currentRoute=null;
 const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 const parseISO=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00'):null;
 const due=(date,today)=>!!date && date<=today;
 function makeQueue(state,today=localISO(new Date())){
   const topics=new Map((state.topics||[]).map(t=>[t.id,t.name]));
   const cards=(state.flashcards||[]).filter(f=>due(f.nextReview,today)).map(f=>({type:'flashcard',id:f.id,title:f.front||'Cartão sem título',topic:topics.get(f.topicId)||'Sem matéria',date:f.nextReview}));
   const notes=(state.notes||[]).filter(n=>n.reviewOn&&due(n.nextReview,today)).map(n=>({type:'note',id:n.id,title:n.title||'Anotação sem título',topic:topics.get(n.topicId)||'Sem matéria',date:n.nextReview}));
   return [...cards,...notes].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.title.localeCompare(b.title,'pt-BR')).slice(0,5000);
 }
 function planStudy(state,minutes=45,days=7,start=new Date()){
   minutes=Math.max(15,Math.min(180,Math.floor(Number(minutes)||45)));
   days=Math.max(1,Math.min(14,Math.floor(Number(days)||7)));
   const all=(state.topics||[]).filter(t=>t.name).slice(0,500);
   if(!all.length)return [];
   const queue=makeQueue(state,localISO(start));
   const weights=new Map(all.map(t=>[t.id,1]));
   for(const q of queue){
     const t=all.find(t=>t.name===q.topic);if(t)weights.set(t.id,(weights.get(t.id)||0)+3);
   }
   for(const goal of state.goals||[]){
     if(goal.status!=='concluida' && weights.has(goal.topicId))weights.set(goal.topicId,(weights.get(goal.topicId)||0)+2);
   }
   const ranked=all.sort((a,b)=>(weights.get(b.id)||0)-(weights.get(a.id)||0)||a.name.localeCompare(b.name,'pt-BR'));
   const result=[];
   for(let day=0;day<days;day++){
     const d=new Date(start);d.setHours(12,0,0,0);d.setDate(d.getDate()+day);
     // Rodízio entre matérias, priorizando o volume de revisões pendentes.
     const subject=ranked[day%ranked.length];
     result.push({date:localISO(d),topicId:subject.id,topicName:subject.name,minutes,focus:day%3===0?'Revisão e questões':day%3===1?'Estudo ativo':'Flashcards e consolidação'});
   }
   return result;
 }
 function viewFila(state){
   const q=makeQueue(state);
   return `<div class="v56-head"><span>PRIORIDADES DE HOJE</span><h2>Fila integrada de revisão</h2><p>Reúne flashcards e anotações agendados para hoje ou em atraso. As revisões continuam usando os métodos existentes do aplicativo.</p></div>
     <div class="v56-metrics"><div><strong>${q.length}</strong><span>Pendências no total</span></div><div><strong>${q.filter(x=>x.type==='flashcard').length}</strong><span>Flashcards</span></div><div><strong>${q.filter(x=>x.type==='note').length}</strong><span>Anotações</span></div></div>
     <div class="v56-list" role="list">${q.length?q.slice(0,100).map(x=>`<article class="v56-row" role="listitem"><div><span class="v56-pill">${x.type==='flashcard'?'Cartão':'Anotação'}</span><strong>${html(x.title)}</strong><small>${html(x.topic)} • Agendado: ${html(x.date)}</small></div><button class="btn btn-sm" type="button" data-v56-go="${x.type==='flashcard'?'flashcards':'revisoes'}">${x.type==='flashcard'?'Abrir cartões':'Revisar anotação'}</button></article>`).join(''):'<div class="v56-empty">Nenhuma revisão vencida. Continue seus estudos normalmente.</div>'}</div>
     ${q.length>100?'<p class="v56-hint">Exibindo as primeiras 100 revisões. Abra as áreas de Flashcards e Revisões para acessar a coleção completa.</p>':''}`;
 }
 function viewPlano(state){
   const topics=(state.topics||[]).length;
   return `<div class="v56-head"><span>PLANEJAMENTO ASSISTIDO • SEM USO DE IA</span><h2>Semana de estudos</h2><p>Gere uma sugestão com regras determinísticas a partir das matérias, revisões e metas. Nada é criado no calendário sem aprovação.</p></div>
     <section class="v56-panel"><div class="v56-controls"><label for="v56Minutes">Tempo por dia (minutos)<input type="number" id="v56Minutes" min="15" max="180" value="45"></label><label for="v56Days">Dias a planejar<select id="v56Days"><option value="7">7 dias</option><option value="14">14 dias</option></select></label><button class="btn btn-primary" type="button" data-v56-action="preview" ${topics?'':'disabled'}>Gerar proposta</button></div><p class="v56-hint">${topics?`Matérias disponíveis: ${topics}.`:'Cadastre uma matéria em Matérias e materiais antes de gerar seu plano.'} A distribuição prioriza matérias com mais revisões pendentes, depois alterna conteúdos. Ajustes manuais são feitos no calendário após aprovação.</p><div id="v56Preview" aria-live="polite"></div></section>`;
 }
 function paintProposal(){
   const slot=document.getElementById('v56Preview');if(!slot)return;
   if(!proposal||!proposal.length){slot.innerHTML='';return;}
   slot.innerHTML=`<div class="v56-plan-list" role="list">${proposal.map((p,i)=>`<div class="v56-plan-item" role="listitem"><b>${html(p.date)}</b><span>${html(p.topicName)}</span><span>${html(p.focus)}</span><em>${p.minutes} min</em></div>`).join('')}</div><div class="v56-controls"><button class="btn btn-primary" type="button" data-v56-action="approve">✓ Aprovar e adicionar ao calendário</button><button class="btn" type="button" data-v56-action="cancel">Descartar proposta</button></div><p class="v56-hint">Os eventos criados são editáveis. O histórico de aceite não é uma assinatura nem ação de IA.</p>`;
 }
 function onClick(event){
   const el=event.target.closest('[data-v56-go],[data-v56-action]');if(!el)return;
   if(el.dataset.v56Go){global.navigate(el.dataset.v56Go);return;}
   if(el.dataset.v56Action==='preview'){
     proposal=planStudy(currentState,document.getElementById('v56Minutes')?.value,document.getElementById('v56Days')?.value);
     paintProposal();
   }else if(el.dataset.v56Action==='cancel'){
     proposal=null;paintProposal();
   }else if(el.dataset.v56Action==='approve'){
     if(!proposal||!currentReady)return;
     if(!global.confirm('Adicionar os dias propostos ao calendário?'))return;
     let created=0;
     for(const day of proposal){
       const match=(currentState.events||[]).some(e=>e.type==='plano-estudos'&&e.date===day.date&&e.topicId===day.topicId);
       if(match)continue;
       currentState.events.push({id:(global.crypto?.randomUUID?.()||('plan-'+Date.now()+'-'+Math.random().toString(36).slice(2))),date:day.date,topicId:day.topicId,type:'plano-estudos',title:day.focus+' · '+day.topicName+' · '+day.minutes+' min'});created++;
     }
     proposal=null;global.saveState();global.navigate('calendario');global.toast(`${created} sessão(ões) de estudo incluída(s). Confira a sincronização.`);
   }
 }
 let bound=false;
 function afterRender(state,ready,route){
   currentState=state;currentReady=!!ready;currentRoute=route;
   if(!bound){document.addEventListener('click',onClick);bound=true;}
   // Ao navegar, a prévia é sempre recriada explicitamente, nunca persistida sem aceite.
   if(currentRoute==='planejador'&&proposal)paintProposal();
 }
 global.TOPOZ_V56=Object.freeze({makeQueue,planStudy,viewFila,viewPlano,afterRender,resetPreview(){proposal=null;}});
 if(typeof module!=='undefined'&&module.exports)module.exports={makeQueue,planStudy};
})(typeof window!=='undefined'?window:globalThis);
