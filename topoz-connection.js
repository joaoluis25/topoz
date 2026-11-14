/* TOPOZ Estudos 5.6.1 — validação local da configuração pública.
   Não envia nem exibe a chave. Não substitui validações do Supabase/RLS. */
(function(){
  'use strict';
  function check(){
    const cfg=window.TOPOS_PUBLIC_CONFIG;
    const fail=(code,message)=>({ready:false,code,message,url:'',anonKey:''});
    if(!cfg||typeof cfg!=='object')return fail('missing_file','O arquivo topos-config.js não foi carregado. Verifique se ele está na mesma pasta do index.html.');
    if(typeof cfg.url!=='string'||!cfg.url.trim())return fail('missing_url','Defina url no arquivo topos-config.js com o endereço HTTPS do seu projeto Supabase.');
    if(typeof cfg.anonKey!=='string'||!cfg.anonKey.trim())return fail('missing_key','Defina anonKey no arquivo topos-config.js. O campo precisa ter exatamente esse nome.');
    const inputUrl=cfg.url.trim(),anonKey=cfg.anonKey.trim();
    let parsed;
    try{parsed=new URL(inputUrl);}catch(_){return fail('bad_url','A URL configurada não é um endereço válido. Copie a Project URL do Supabase.');}
    const localhost=['localhost','127.0.0.1','[::1]'].includes(parsed.hostname.toLowerCase());
    if(!(parsed.protocol==='https:'||(localhost&&parsed.protocol==='http:')))
      return fail('bad_protocol','A URL do Supabase deve usar HTTPS (exceto localhost para desenvolvimento).');
    if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/')
      return fail('bad_url_parts','Informe apenas a URL base do Supabase, sem caminhos como /rest/v1, parâmetros ou fragmentos. Uma barra final é aceita.');
    if(/^(seu|sua|example|exemplo)(-|\.|$)/i.test(parsed.hostname)||/SEU-STAGING|SEU-PROJETO/i.test(inputUrl))
      return fail('placeholder_url','A URL ainda contém um endereço de exemplo. Substitua-o pelo Project URL do seu Supabase.');
    if(/SUA_CHAVE|COLE_AQUI|EXEMPLO|PLACEHOLDER|CONFIGURACAO-AUSENTE/i.test(anonKey))
      return fail('placeholder_key','O campo anonKey ainda contém um valor de exemplo.');
    if(/^sb_secret_/i.test(anonKey)||/service_role/i.test(anonKey))
      return fail('secret_key','Não use chave secret ou service_role no navegador. Use a chave publishable ou anon pública.');
    if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(anonKey)){
      const parts=anonKey.split('.');
      if(parts.length!==3)return fail('key_format','A chave pública deve ser sb_publishable_… ou a chave JWT anon legada, nunca secret/service_role.');
      try{
        const raw=parts[1].replace(/-/g,'+').replace(/_/g,'/');
        const payload=JSON.parse(atob(raw.padEnd(Math.ceil(raw.length/4)*4,'=')));
        if(payload.role!=='anon')return fail('key_role','A chave JWT configurada não tem o papel anon. Não use service_role no navegador.');
      }catch(_){return fail('key_format','A chave JWT anon informada está malformada. Copie a chave pública novamente.');}
    }
    return {ready:true,code:'ok',message:'Configuração pública carregada e com formato válido.',url:parsed.origin,anonKey};
  }
  window.TOPOS_CONNECTION=Object.freeze({check});
})();
