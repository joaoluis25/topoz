/* TOPOS Voice — optional browser dictation for the existing Estudos note editor.
   No TOPOS backend receives audio. Browser speech engines may process audio externally.
   User must review the text before choosing to insert it. */
(function(global){'use strict';
let engine=null,active=false;
const get=id=>document.getElementById(id);
const status=s=>{const n=get('tpVoiceStatus');if(n)n.textContent=s};
function stop(){if(engine){try{engine.stop()}catch{}}active=false;const b=get('tpVoiceToggle');if(b)b.textContent='🎙 Ditado por voz'}
function toggle(){if(active){stop();return}
  const Recognition=global.SpeechRecognition||global.webkitSpeechRecognition;
  if(!Recognition){status('Ditado por voz não está disponível neste navegador. Você pode continuar digitando normalmente.');return}
  const draft=get('tpVoiceDraft');if(!draft)return;
  try{
    engine=new Recognition();engine.lang='pt-BR';engine.interimResults=true;engine.continuous=true;
    let finalText='';engine.onresult=e=>{let partial='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)finalText+=r[0].transcript.trim()+' ';else partial+=r[0].transcript}draft.value=finalText+partial;draft.hidden=false;const insert=get('tpVoiceInsert');if(insert)insert.hidden=false;status('Transcrição recebida. Revise o texto antes de inserir.')};
    engine.onerror=e=>{status(e.error==='not-allowed'?'Microfone não autorizado pelo navegador.':'Não foi possível transcrever: '+e.error);stop()};
    engine.onend=()=>{active=false;const b=get('tpVoiceToggle');if(b)b.textContent='🎙 Ditado por voz'};
    engine.start();active=true;get('tpVoiceToggle').textContent='■ Parar ditado';status('Ouvindo... Seu navegador pode usar um serviço externo de reconhecimento de fala.');
  }catch(e){status('Não foi possível iniciar o reconhecimento de voz.');stop()}
}
function insert(){const draft=get('tpVoiceDraft'),body=get('mNoteBody');if(!draft||!body)return;const text=draft.value.trim();if(!text){status('Não há texto transcrito para inserir.');return}
  for(const paragraph of text.split(/\n+/)){const p=document.createElement('p');p.textContent=paragraph;body.appendChild(p)}
  body.dispatchEvent(new Event('input',{bubbles:true}));draft.value='';draft.hidden=true;get('tpVoiceInsert').hidden=true;status('Texto inserido na anotação. Revise e clique em Salvar anotação.');stop();body.focus();
}
global.TOPOS_VOICE={toggle,insert,stop};
})(window);
