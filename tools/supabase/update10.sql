-- SankoQuest Survivors update 10: bind ranked submissions to their exact start/log and recover interrupted replays.
-- Owner: paste this WHOLE file in the Solscape project's SQL editor before deploying the v2 submission API.
-- Requires updates 4–9. Safe to run again. Preserves scores/history and legacy functions for in-flight old requests.
-- No payments, refunds or payouts. Never clear claimed_at to recover a run: its first submitted log stays bound.
begin;

alter table public.sqs_ranked_entries add column if not exists submit_sha text;
alter table public.sqs_ranked_entries add column if not exists submit_attempt uuid;
alter table public.sqs_ranked_entries add column if not exists submit_until timestamptz;
alter table public.sqs_ranked_entries add column if not exists submit_result jsonb;

create or replace function public.sqs_ranked_receipt_gate(p_server_key text, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{32}$' then return jsonb_build_object('error','bad connection'); end if;
  -- The advisory lock also serializes the very first request, before a rate row exists.
  perform pg_advisory_xact_lock(hashtext('sqs_receipt_' || p_ip_hash));
  if not sqs_rate_ok(p_ip_hash,'ranked-receipt',2) then return jsonb_build_object('error','slow down'); end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_ranked_claim_v2(p_server_key text, p_id bigint, p_wallet text, p_started bigint, p_log_sha text, p_attempt uuid, p_allow_claim boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e record;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_started is null or p_log_sha is null or p_log_sha !~ '^[0-9a-f]{64}$' or p_attempt is null then return jsonb_build_object('error','that run was already sent'); end if;
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or e.started_at is null or e.refund_reason is not null
    or (extract(epoch from e.started_at)*1000)::bigint <> p_started
    or (e.submit_sha is not null and e.submit_sha <> p_log_sha) then return jsonb_build_object('error','that run was already sent'); end if;
  if e.finished_at is not null then
    if e.submit_result is not null and e.submit_sha=p_log_sha then return jsonb_build_object('result',e.submit_result); end if;
    return jsonb_build_object('error','that run was already sent');
  end if;
  -- Legacy claims have no immutable log hash: let the old worker finish, never guess a replacement log.
  if e.claimed_at is not null and e.submit_sha is null then return jsonb_build_object('error','an older submission is in progress: tell the dev if it does not finish'); end if;
  if exists(select 1 from sqs_ranked_payout_weeks where week=e.week and mode=e.mode) then return jsonb_build_object('error','that week is already settled: tell the dev'); end if;
  if e.submit_sha is null and p_allow_claim is not true then return jsonb_build_object('error','that run was sent too late'); end if;
  if e.submit_until > now() then return jsonb_build_object('busy',true); end if;
  update sqs_ranked_entries set claimed_at=coalesce(claimed_at,now()),submit_sha=p_log_sha,
    submit_attempt=p_attempt,submit_until=now()+interval '15 minutes' where id=p_id returning * into e;
  return jsonb_build_object('ok',true,'received',(extract(epoch from e.claimed_at)*1000)::bigint);
end $$;

create or replace function public.sqs_ranked_release_v2(p_server_key text, p_id bigint, p_wallet text, p_started bigint, p_log_sha text, p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  update sqs_ranked_entries set submit_until=now()
    where id=p_id and wallet=lower(p_wallet) and (extract(epoch from started_at)*1000)::bigint=p_started
      and submit_sha=p_log_sha and submit_attempt=p_attempt and finished_at is null;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_ranked_finish_v2(p_server_key text, p_id bigint, p_wallet text, p_started bigint, p_log_sha text, p_attempt uuid,
  p_name text, p_t int, p_kills int, p_level int, p_won boolean, p_verdict text, p_log text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare e record; w int; out jsonb;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  select week into w from sqs_ranked_entries where id=p_id;
  -- Same lock order as the existing finish/pruning path; serialize against prize planning too.
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || (w-1)));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or p_started is null or p_attempt is null or p_log_sha is null
    or (extract(epoch from e.started_at)*1000)::bigint is distinct from p_started
    or e.submit_sha is distinct from p_log_sha or e.submit_attempt is distinct from p_attempt then return jsonb_build_object('error','that run was already sent'); end if;
  if e.submit_result is not null then return e.submit_result; end if;
  if e.finished_at is not null or e.claimed_at is null then return jsonb_build_object('error','that run was already sent'); end if;
  if exists(select 1 from sqs_ranked_payout_weeks where week=e.week and mode=e.mode) then return jsonb_build_object('error','that week is already settled: tell the dev'); end if;
  out := sqs_ranked_finish(p_server_key,p_id,p_name,p_t,p_kills,p_level,p_won,p_verdict,p_log_sha,p_log)::jsonb;
  if out is null or out ? 'error' then return coalesce(out,jsonb_build_object('error','could not save the run')); end if;
  select * into e from sqs_ranked_entries where id=p_id;
  out := jsonb_build_object('ok',true,'t',e.t,'kills',e.kills,'level',e.level,'won',e.won,'mode',e.mode,'rank',out->'rank','verdict',e.verdict);
  -- Cached response and score are one transaction; losing the response cannot consume the result.
  update sqs_ranked_entries set submit_result=out,submit_until=null where id=p_id;
  return out;
end $$;

revoke all on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) from public,anon,authenticated;
revoke all on function public.sqs_ranked_receipt_gate(text,text) from public,anon,authenticated;
revoke all on function public.sqs_ranked_release_v2(text,bigint,text,bigint,text,uuid) from public,anon,authenticated;
revoke all on function public.sqs_ranked_finish_v2(text,bigint,text,bigint,text,uuid,text,int,int,int,boolean,text,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) to anon;
grant execute on function public.sqs_ranked_receipt_gate(text,text) to anon;
grant execute on function public.sqs_ranked_release_v2(text,bigint,text,bigint,text,uuid) to anon;
grant execute on function public.sqs_ranked_finish_v2(text,bigint,text,bigint,text,uuid,text,int,int,int,boolean,text,text) to anon;

-- Keep the live table private, including the four new columns and any inherited/default column grants.
revoke all on public.sqs_ranked_entries from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
