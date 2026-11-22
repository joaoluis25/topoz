-- TOPOZ v57 / STAGING SOMENTE. NUNCA executar automaticamente em produção.
-- Pré-requisitos: migrações v56/001 e 002 e testes RLS A/B/anon.
-- Revisar backups, dados, permissões e restauração antes de executar.
BEGIN;
CREATE TABLE IF NOT EXISTS public.user_consents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_allowed boolean NOT NULL DEFAULT false,
  ai_version text NOT NULL DEFAULT 'ai-v1',
  consented_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON public.user_consents FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.user_consents TO authenticated;
-- As novas políticas são restritivas; AUDITAR qualquer política antiga em staging.
DROP POLICY IF EXISTS tpz_own_consents_select ON public.user_consents;
CREATE POLICY tpz_own_consents_select ON public.user_consents FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
DROP POLICY IF EXISTS tpz_own_consents_insert ON public.user_consents;
CREATE POLICY tpz_own_consents_insert ON public.user_consents FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id);
DROP POLICY IF EXISTS tpz_own_consents_update ON public.user_consents;
CREATE POLICY tpz_own_consents_update ON public.user_consents FOR UPDATE TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
CREATE TABLE IF NOT EXISTS public.ai_plans (
 plan text PRIMARY KEY CHECK (plan IN ('free','essential','pro','max')),
 daily_limit integer NOT NULL CHECK (daily_limit BETWEEN 0 AND 1000),
 monthly_token_limit bigint NOT NULL CHECK (monthly_token_limit >= 0)
);
REVOKE ALL ON public.ai_plans FROM PUBLIC,anon,authenticated;
INSERT INTO public.ai_plans(plan,daily_limit,monthly_token_limit) VALUES
 ('free',5,30000),('essential',15,120000),('pro',40,400000),('max',80,1000000)
ON CONFLICT (plan) DO NOTHING;
CREATE TABLE IF NOT EXISTS public.entitlements (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 plan text NOT NULL DEFAULT 'free' REFERENCES public.ai_plans(plan),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','canceled','trialing')),
 current_period_end timestamptz,
 source text NOT NULL DEFAULT 'internal',
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.entitlements FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.entitlements TO authenticated;
DROP POLICY IF EXISTS tpz_entitlements_read ON public.entitlements;
CREATE POLICY tpz_entitlements_read ON public.entitlements FOR SELECT TO authenticated USING ((select auth.uid())=user_id);
-- Plano somente atribuído no servidor; não há checkout ativo.
ALTER TABLE public.study_ai_usage DROP CONSTRAINT IF EXISTS study_ai_usage_used_check;
ALTER TABLE public.study_ai_usage ADD CONSTRAINT study_ai_usage_used_check CHECK (used BETWEEN 0 AND 100000);
ALTER TABLE public.study_ai_requests ADD COLUMN IF NOT EXISTS prompt_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE public.study_ai_requests ADD COLUMN IF NOT EXISTS completion_tokens integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.claim_study_ai_v57(p_user uuid,p_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE v_prior public.study_ai_requests%rowtype; v_used integer; v_limit integer; v_today date;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'FORBIDDEN' USING errcode='42501'; END IF;
 IF p_user IS NULL OR p_key !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_ARGUMENT'; END IF;
 v_today := (now() at time zone 'UTC')::date;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text||p_key,0));
 SELECT p.daily_limit INTO v_limit FROM public.ai_plans p
 LEFT JOIN public.entitlements e ON e.plan=p.plan AND e.user_id=p_user AND e.status IN ('active','trialing')
 WHERE p.plan=COALESCE(e.plan,'free') ORDER BY CASE WHEN e.user_id IS NOT NULL THEN 0 ELSE 1 END LIMIT 1;
 IF v_limit IS NULL THEN v_limit:=5; END IF;
 SELECT * INTO v_prior FROM public.study_ai_requests WHERE user_id=p_user AND cache_key=p_key FOR UPDATE;
 IF FOUND AND v_prior.state='ready' AND v_prior.updated_at>now()-interval '7 days' THEN
  RETURN pg_catalog.jsonb_build_object('status','cached','result',v_prior.result,'remaining',NULL); END IF;
 IF FOUND AND v_prior.state='processing' AND v_prior.updated_at>now()-interval '60 seconds' THEN
  RETURN pg_catalog.jsonb_build_object('status','busy');END IF;
 INSERT INTO public.study_ai_usage(user_id,use_date,used) VALUES(p_user,v_today,1)
 ON CONFLICT(user_id,use_date) DO UPDATE SET used=public.study_ai_usage.used+1 WHERE public.study_ai_usage.used<v_limit
 RETURNING used INTO v_used;
 IF v_used IS NULL THEN RETURN pg_catalog.jsonb_build_object('status','quota');END IF;
 INSERT INTO public.study_ai_requests(user_id,cache_key,state,result,updated_at)
 VALUES(p_user,p_key,'processing',NULL,now())
 ON CONFLICT(user_id,cache_key) DO UPDATE SET state='processing',result=NULL,updated_at=now();
 RETURN pg_catalog.jsonb_build_object('status','ready','remaining',v_limit-v_used);
END; $$;
REVOKE ALL ON FUNCTION public.claim_study_ai_v57(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_study_ai_v57(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.finish_study_ai_v57(p_user uuid,p_key text,p_result text,p_success boolean,p_prompt_tokens integer,p_completion_tokens integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $$
DECLARE v_updated integer; v_today date;
BEGIN
 IF current_user <> 'service_role' THEN RAISE EXCEPTION 'FORBIDDEN' USING errcode='42501'; END IF;
 IF p_user IS NULL OR p_key !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'INVALID_ARGUMENT'; END IF;
 v_today := (now() at time zone 'UTC')::date;
 UPDATE public.study_ai_requests SET state=CASE WHEN p_success THEN 'ready' ELSE 'failed' END,
   result=CASE WHEN p_success THEN LEFT(p_result,16000) ELSE NULL END,
   prompt_tokens=CASE WHEN p_success THEN GREATEST(0,LEAST(p_prompt_tokens,1000000)) ELSE 0 END,
   completion_tokens=CASE WHEN p_success THEN GREATEST(0,LEAST(p_completion_tokens,1000000)) ELSE 0 END,
   updated_at=now()
 WHERE user_id=p_user AND cache_key=p_key AND state='processing';
 GET DIAGNOSTICS v_updated=ROW_COUNT;
 IF v_updated>0 AND NOT p_success THEN
  UPDATE public.study_ai_usage SET used=GREATEST(0,used-1)
  WHERE user_id=p_user AND use_date=v_today;
 END IF;
END;$$;
REVOKE ALL ON FUNCTION public.finish_study_ai_v57(uuid,text,text,boolean,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_study_ai_v57(uuid,text,text,boolean,integer,integer) TO service_role;
COMMIT;
