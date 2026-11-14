/* TOPOZ Estudos V5.6: validadores puros e sem dependências.
 * NÃO use este módulo como substituto da validação do servidor. */
(function(global){
 'use strict';
 function byteLength(input){return new TextEncoder().encode(String(input??'')).length;}
 function breakTopicCycles(topics){
   const byId=new Map(topics.map(t=>[t.id,t]));
   let fixes=0;
   for(const topic of topics){
     const chain=new Set();let current=topic;
     while(current&&current.parentId){
       if(chain.has(current.id)){
         current.parentId=null;fixes++;break;
       }
       chain.add(current.id);
       const next=byId.get(current.parentId);
       if(!next){current.parentId=null;fixes++;break;}
       if(next===current){current.parentId=null;fixes++;break;}
       current=next;
     }
   }
   return fixes;
 }
 function validateStudySnapshot(snapshot,max=5*1024*1024){
   if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return {ok:false,reason:'Estrutura inválida'};
   if(snapshot.schemaVersion!==4)return {ok:false,reason:'Schema incompatível'};
   let payload;
   try{payload=JSON.stringify(snapshot);}catch{return {ok:false,reason:'Estado não serializável'};}
   if(byteLength(payload)>max)return {ok:false,reason:'Limite de 5 MB excedido'};
   return {ok:true,bytes:byteLength(payload)};
 }
 const api=Object.freeze({byteLength,breakTopicCycles,validateStudySnapshot});
 global.TOPOS_GUARD=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
