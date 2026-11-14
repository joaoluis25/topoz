-- TOPOZ Estudos V5.6 — infraestrutura de IA segura; somente STAGING antes de produção.
-- A Edge Function usa a service_role exclusivamente no ambiente do servidor.
-- Usuários autenticados e anônimos NÃO possuem acesso às tabelas/funções de IA.
begin;
create table if not exists public.study_ai_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 use_date date not null,
 used integer not null default 0 check(used between 0 and 20),
 primary key(user_id,use_date)
);
create table if not exists public.study_ai_requests (
 user_id uuid not null references auth.users(id) on delete cascade,
 cache_key text not null check(length(cache_key)=64),
 state text not null check(state in ('processing','ready','failed')),
 result text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,cache_key)
);
create index if not exists study_ai_requests_updated_idx on public.study_ai_requests(updated_at);
alter table public.study_ai_usage enable row level security;
alter table public.study_ai_requests enable row level security;
revoke all on public.study_ai_usage,public.study_ai_requests from anon,authenticated;
grant select,insert,update,delete on public.study_ai_usage,public.study_ai_requests to service_role;

-- Retorno: {status:'ready'|'cached'|'busy'|'quota', result?, remaining?}.
-- Lock transacional por usuário+chave torna idempotente a disputa pela mesma entrada.
create or replace function public.claim_study_ai_v56(p_user uuid,p_key text)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare v_record public.study_ai_requests%rowtype;v_used integer;v_today date;
begin
 if current_user<>'service_role' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_user is null or p_key !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_ARGUMENT' using errcode='22023';end if;
 v_today := (now() at time zone 'UTC')::date;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text||p_key,0));
 select * into v_record from public.study_ai_requests
 where user_id=p_user and cache_key=p_key for update;
 if found and v_record.state='ready' and v_record.updated_at>now()-interval '7 days' then
   return jsonb_build_object('status','cached','result',v_record.result);
 end if;
 if found and v_record.state='processing' and v_record.updated_at>now()-interval '60 seconds' then
   return jsonb_build_object('status','busy');
 end if;
 insert into public.study_ai_usage(user_id,use_date,used) values(p_user,v_today,1)
 on conflict(user_id,use_date) do update
 set used=public.study_ai_usage.used+1 where public.study_ai_usage.used<20
 returning used into v_used;
 if v_used is null then return jsonb_build_object('status','quota');end if;
 insert into public.study_ai_requests(user_id,cache_key,state,result,updated_at)
 values(p_user,p_key,'processing',null,now())
 on conflict(user_id,cache_key) do update set state='processing',result=null,updated_at=now();
 return jsonb_build_object('status','ready','remaining',20-v_used);
end;$$;
revoke all on function public.claim_study_ai_v56(uuid,text) from public,anon,authenticated;
grant execute on function public.claim_study_ai_v56(uuid,text) to service_role;

create or replace function public.finish_study_ai_v56(p_user uuid,p_key text,p_result text,p_success boolean)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
 if current_user<>'service_role' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_user is null or p_key !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_ARGUMENT' using errcode='22023';end if;
 update public.study_ai_requests
 set state=case when p_success then 'ready' else 'failed' end,
     result=case when p_success then left(p_result,16000) else null end,
     updated_at=now()
 where user_id=p_user and cache_key=p_key and state='processing';
end;$$;
revoke all on function public.finish_study_ai_v56(uuid,text,text,boolean) from public,anon,authenticated;
grant execute on function public.finish_study_ai_v56(uuid,text,text,boolean) to service_role;
commit;

-- Agende, no painel do staging, retenção: DELETE FROM public.study_ai_requests WHERE updated_at < now()-interval '7 days';
-- Apenas executar com autorização no ambiente correto. Logs sem prompt/resposta/PII.
