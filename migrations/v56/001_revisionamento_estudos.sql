-- TOPOZ Estudos V5.6 — executar SOMENTE após backup e testes no Supabase de STAGING.
-- Pré-condição: public.study_data(user_id uuid UNIQUE, data jsonb, updated_at timestamptz)
-- A aplicação conserva schemaVersion 4 dentro do JSON; esta migração acrescenta revisão por linha.
-- Esta migração NÃO remove nenhuma política antiga; audite-as separadamente.
begin;

alter table public.study_data add column if not exists revision integer not null default 0;
create unique index if not exists study_data_user_id_unique on public.study_data(user_id);
alter table public.study_data enable row level security;

create or replace function public.save_study_data_v56(p_data jsonb,p_expected_revision integer)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare v_user uuid; v_rev integer; v_updated integer;
begin
  v_user := (select auth.uid());
  if v_user is null then raise exception 'UNAUTHENTICATED' using errcode='28000'; end if;
  if p_expected_revision is null or p_expected_revision<0 then raise exception 'INVALID_REVISION' using errcode='22023'; end if;
  if p_data is null or jsonb_typeof(p_data) is distinct from 'object' or p_data->>'schemaVersion' is distinct from '4' then
    raise exception 'INVALID_SCHEMA' using errcode='22023';
  end if;
  if octet_length(convert_to(p_data::text,'UTF8'))>5242880 then
    raise exception 'STATE_SIZE_LIMIT' using errcode='22023';
  end if;
  select revision into v_rev from public.study_data where user_id=v_user for update;
  if not found then
    if p_expected_revision<>0 then raise exception 'REVISION_CONFLICT' using errcode='P0001'; end if;
    begin
      insert into public.study_data(user_id,data,updated_at,revision)
      values(v_user,p_data,now(),1);
      return 1;
    exception when unique_violation then
      raise exception 'REVISION_CONFLICT' using errcode='P0001';
    end;
  end if;
  if v_rev<>p_expected_revision then raise exception 'REVISION_CONFLICT' using errcode='P0001'; end if;
  update public.study_data
     set data=p_data,updated_at=now(),revision=revision+1
   where user_id=v_user and revision=p_expected_revision
   returning revision into v_updated;
  if v_updated is null then raise exception 'REVISION_CONFLICT' using errcode='P0001'; end if;
  return v_updated;
end;
$$;
revoke all on function public.save_study_data_v56(jsonb,integer) from public,anon;
grant execute on function public.save_study_data_v56(jsonb,integer) to authenticated;
commit;

-- AUDITORIA MANUAL OBRIGATÓRIA: examinar também policies antigas permissivas.
-- SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
-- FROM pg_policies WHERE schemaname='public' AND tablename='study_data';
-- RLS: testar SELECT, INSERT, UPDATE, DELETE e RPC com contas A, B e anon.
-- Contas sem permissão de SELECT/INSERT/UPDATE por RLS não conseguirão salvar via RPC.
