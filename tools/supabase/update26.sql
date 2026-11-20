-- Apply before the replay function's 30-minute runtime limit goes live.
-- Keep the claim locked for five minutes beyond the runtime limit.
begin;
create or replace function public.sqs_ranked_claim_v2(p_server_key text, p_id bigint, p_wallet text, p_started bigint, p_log_sha text, p_attempt uuid, p_allow_claim boolean)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e record; w int; ms bigint;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_started is null or p_log_sha is null or p_log_sha !~ '^[0-9a-f]{64}$' or p_attempt is null then return jsonb_build_object('error','that run was already sent'); end if;
  select week into w from sqs_ranked_entries where id=p_id;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
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
  ms := (extract(epoch from clock_timestamp())*1000)::bigint;
  if e.submit_sha is null and (p_allow_claim is not true or (e.clock_version=1 and ms>e.clock_deadline+300000)
    or (e.clock_version is null and clock_timestamp() >= '2026-11-02T00:00:00Z'::timestamptz+(e.week+1)*interval '7 days'+interval '180 minutes')) then return jsonb_build_object('error','that run was sent too late'); end if;
  if e.submit_until > now() then return jsonb_build_object('busy',true); end if;
  update sqs_ranked_entries set claimed_at=coalesce(claimed_at,to_timestamp(ms/1000.0)),submit_sha=p_log_sha,
    submit_credit_ms=coalesce(submit_credit_ms,clock_credit_ms+case when clock_paused_at is null then 0 else least(30000,greatest(0,least(ms,clock_deadline)-clock_paused_at)) end),
    submit_attempt=p_attempt,submit_until=now()+interval '35 minutes' where id=p_id returning * into e;
  return jsonb_build_object('ok',true,'received',(extract(epoch from e.claimed_at)*1000)::bigint,'creditMs',e.submit_credit_ms);
end $$;
revoke all on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) to anon;
commit;
