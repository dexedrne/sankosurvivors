-- Ranked rollover clock. Owner-paste after update15; additive and safe to reapply.
-- No transfers. Existing plans and legacy started runs retain their original terms.
begin;
alter table public.sqs_ranked_entries add column if not exists clock_version int;
alter table public.sqs_ranked_entries add column if not exists clock_deadline bigint;
alter table public.sqs_ranked_entries add column if not exists clock_seq int not null default 0;
alter table public.sqs_ranked_entries add column if not exists clock_frame int not null default 0;
alter table public.sqs_ranked_entries add column if not exists clock_action text;
alter table public.sqs_ranked_entries add column if not exists clock_paused_at bigint;
alter table public.sqs_ranked_entries add column if not exists clock_credit_ms bigint not null default 0;
alter table public.sqs_ranked_entries add column if not exists submit_credit_ms bigint;

-- Week1+ combines whole seconds and kills; week0 keeps its exact three-value key.
create or replace function public.sqs_ranked_score(p_week int, p_won boolean, p_t int, p_kills int)
returns bigint[] language sql immutable set search_path = pg_catalog as $$
  select case when p_week >= 1 then array[
      case when coalesce(p_t, 0) >= 180 then 1 else 0 end::bigint,
      greatest(coalesce(p_t, 0), 0)::bigint + greatest(coalesce(p_kills, 0), 0)::bigint,
      case when coalesce(p_t, 0) > 0 then (greatest(coalesce(p_kills, 0), 0)::bigint * 60000000) / p_t else 0 end,
      coalesce(p_kills, 0)::bigint]
    else array[0::bigint, coalesce(p_t, 0)::bigint, coalesce(p_kills, 0)::bigint] end
$$;

create or replace function public.sqs_ranked_clock_start(p_server_key text,p_id bigint,p_wallet text,p_adv text,p_deadline bigint)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e record; w int; deadline bigint; out jsonb;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  select week into w from sqs_ranked_entries where id=p_id;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or e.claimed_at is not null then return jsonb_build_object('error','that entry was already used'); end if;
  if e.refund_reason is not null then return jsonb_build_object('error',e.refund_reason || '. Your ' || sqs_ranked_fee(e.paid) || ' DMT will be sent back.','refund',true,'closed',true); end if;
  deadline := (extract(epoch from ('2026-11-02T00:00:00Z'::timestamptz+(e.week+1)*interval '7 days'))*1000)::bigint;
  if e.started_at is null and (extract(epoch from clock_timestamp())*1000)::bigint >= deadline-1800000 then
    if exists(select 1 from sqs_ranked_payout_weeks where week=e.week and mode=e.mode) then return jsonb_build_object('error','that week is already settled: tell the dev'); end if;
    update sqs_ranked_entries set refund_reason='ranked admission closed before this entry started' where id=p_id returning * into e;
    return jsonb_build_object('error',e.refund_reason || '. Your ' || sqs_ranked_fee(e.paid) || ' DMT will be sent back.','refund',true,'closed',true);
  end if;
  if (e.started_at is null or e.clock_version=1) and p_deadline is distinct from deadline then return jsonb_build_object('error','acknowledge the ranked deadline before starting'); end if;
  out := sqs_ranked_start(p_server_key,p_id,p_wallet,p_adv)::jsonb;
  if out ? 'error' then return out; end if;
  if e.started_at is null then
    update sqs_ranked_entries set clock_version=1,clock_deadline=deadline,clock_seq=0,clock_frame=0,clock_action=null,
      clock_paused_at=null,clock_credit_ms=0,submit_credit_ms=null,started_at=date_trunc('milliseconds',clock_timestamp()) where id=p_id returning started_at into e.started_at;
    out := out || jsonb_build_object('started',(extract(epoch from e.started_at)*1000)::bigint);
    e.clock_version:=1; e.clock_deadline:=deadline; e.clock_seq:=0; e.clock_frame:=0; e.clock_paused_at:=null; e.clock_credit_ms:=0;
  end if;
  return out || jsonb_build_object('clockVersion',coalesce(e.clock_version,0),'deadline',e.clock_deadline,
    'clock',case when e.clock_version=1 then jsonb_build_object('ok',true,'seq',e.clock_seq,'frame',e.clock_frame,'creditMs',e.clock_credit_ms,
      'pausedAt',e.clock_paused_at,'serverNow',(extract(epoch from clock_timestamp())*1000)::bigint) else null end);
end $$;

create or replace function public.sqs_ranked_clock(p_server_key text,p_id bigint,p_wallet text,p_started bigint,p_action text,p_seq int,p_frame int)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e record; ms bigint;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_action is null or p_action not in ('state','pause','resume') or p_seq is null or p_seq<0 or p_seq>500000
    or p_frame is null or p_frame<0 or p_frame>219600 then return jsonb_build_object('error','bad clock transition'); end if;
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or e.clock_version is distinct from 1 or e.refund_reason is not null or e.started_at is null
    or p_started is null or (extract(epoch from e.started_at)*1000)::bigint <> p_started then return jsonb_build_object('error','no run'); end if;
  ms := (extract(epoch from clock_timestamp())*1000)::bigint;
  if p_action <> 'state' then
    if p_seq=e.clock_seq and p_action=e.clock_action and p_frame=e.clock_frame then null;
    elsif p_seq<>e.clock_seq+1 or e.claimed_at is not null or ms>=e.clock_deadline
      or p_frame>floor((ms-p_started)*30/1000.0) then return jsonb_build_object('error','bad clock transition');
    elsif p_action='pause' then
      if e.clock_paused_at is not null or p_frame<e.clock_frame or (e.clock_action is not null and p_frame=e.clock_frame) then return jsonb_build_object('error','bad clock transition'); end if;
      update sqs_ranked_entries set clock_seq=p_seq,clock_frame=p_frame,clock_action=p_action,clock_paused_at=ms where id=p_id returning * into e;
    else
      if e.clock_paused_at is null or p_frame<>e.clock_frame then return jsonb_build_object('error','bad clock transition'); end if;
      update sqs_ranked_entries set clock_seq=p_seq,clock_action=p_action,clock_paused_at=null,
        clock_credit_ms=clock_credit_ms+least(30000,greatest(0,ms-clock_paused_at)) where id=p_id returning * into e;
    end if;
  end if;
  return jsonb_build_object('ok',true,'seq',e.clock_seq,'frame',e.clock_frame,'creditMs',e.clock_credit_ms,'pausedAt',e.clock_paused_at,'serverNow',ms);
end $$;

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
    submit_attempt=p_attempt,submit_until=now()+interval '15 minutes' where id=p_id returning * into e;
  return jsonb_build_object('ok',true,'received',(extract(epoch from e.claimed_at)*1000)::bigint,'creditMs',e.submit_credit_ms);
end $$;

-- Preserve the old RPC signature for an already-running legacy worker, with the same settlement lock.
create or replace function public.sqs_ranked_claim(p_server_key text,p_id bigint,p_wallet text)
returns json language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e record; w int;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return json_build_object('error','forbidden'); end if;
  select week into w from sqs_ranked_entries where id=p_id;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or e.started_at is null or e.claimed_at is not null or e.refund_reason is not null or e.clock_version is not null
    or exists(select 1 from sqs_ranked_payout_weeks where week=w and mode=e.mode)
    or clock_timestamp()>='2026-11-02T00:00:00Z'::timestamptz+(w+1)*interval '7 days'+interval '180 minutes'
    then return json_build_object('error','that run was already sent'); end if;
  update sqs_ranked_entries set claimed_at=clock_timestamp() where id=p_id;
  return json_build_object('ok',true);
end $$;

-- Keep the deployment queue and interrupted-run recovery aware of verified pause credit.
create or replace function public.sqs_ranked_active(p_key text)
returns json language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
declare ms bigint;
begin
  if sqs_key_ok('reports_key_sha256',p_key) is not true then return json_build_object('error','forbidden'); end if;
  ms := (extract(epoch from clock_timestamp())*1000)::bigint;
  return json_build_object('active',(select count(*) from sqs_ranked_entries where started_at is not null and claimed_at is null and refund_reason is null
    and case when clock_version=1 then ms<clock_deadline
      and (extract(epoch from started_at)*1000)::bigint > ms-9660000-clock_credit_ms
        -case when clock_paused_at is null then 0 else least(30000,greatest(0,ms-clock_paused_at)) end
      else started_at > now()-interval '9660 seconds' end));
end $$;

create or replace function public.sqs_ranked_restart(p_server_key text,p_id bigint,p_wallet text,p_seed bigint,p_reason text,p_started bigint default null)
returns json language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare e record; w int; ms bigint; deadline bigint;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return json_build_object('error','forbidden'); end if;
  if p_seed is null or p_seed<1 or p_seed>2147483646 then return json_build_object('error','bad seed'); end if;
  select week into w from sqs_ranked_entries where id=p_id;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
  select * into e from sqs_ranked_entries where id=p_id and wallet=lower(p_wallet) for update;
  if not found or e.started_at is null or e.claimed_at is not null or e.refund_reason is not null
    or (p_started is not null and (extract(epoch from e.started_at)*1000)::bigint<>p_started)
    or (e.clock_version=1 and p_started is null) then return json_build_object('error','that run was already sent'); end if;
  ms := (extract(epoch from clock_timestamp())*1000)::bigint;
  deadline := (extract(epoch from ('2026-11-02T00:00:00Z'::timestamptz+(e.week+1)*interval '7 days'))*1000)::bigint;
  if exists(select 1 from sqs_ranked_payout_weeks where week=e.week and mode=e.mode) or ms>=deadline then return json_build_object('error','that week is over: the run can no longer be restarted'); end if;
  if e.restarts>=3 then return json_build_object('error','this entry was restarted 3 times already: tell the dev'); end if;
  if e.clock_version=1 and (ms>=e.clock_deadline or (extract(epoch from e.started_at)*1000)::bigint <= ms-9660000-e.clock_credit_ms
    -case when e.clock_paused_at is null then 0 else least(30000,greatest(0,ms-e.clock_paused_at)) end)
    then return json_build_object('error','that run can no longer be restarted: it started too long ago'); end if;
  if ms>=deadline-1800000 then
    update sqs_ranked_entries set refund_reason='game updated after ranked admission closed' where id=p_id;
    return json_build_object('error','Game updated after ranked admission closed. Your ' || sqs_ranked_fee(e.paid) || ' DMT will be sent back.','refund',true,'closed',true);
  end if;
  update sqs_ranked_entries set started_at=null,seed=p_seed,restarts=restarts+1,clock_version=null,clock_deadline=null,
    clock_seq=0,clock_frame=0,clock_action=null,clock_paused_at=null,clock_credit_ms=0,submit_credit_ms=null where id=p_id;
  return json_build_object('ok',true,'week',e.week,'mode',e.mode);
end $$;

create or replace function public.sqs_payout_plan(p_key text, p_week int, p_plan jsonb, p_mode text default 'normal')
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare paid_total numeric; house_total numeric; pool_total numeric; incoming_total numeric := 0; rolled numeric; dust numeric;
  weights int[] := array[40,25,15,12,8]; -- src/ranked.js RANKED.payouts
  winners jsonb; prizes jsonb := '[]'; winner jsonb; share numeric; idx int := 0; expected jsonb; end_at timestamptz;
  first_week int := case when p_mode = 'hard' then 1 else 0 end; -- src/ranked.js RANKED.kpmWeek opens the Hard race
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_payout_plan'));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || p_week));
  if p_week is null or p_week < 0 then return jsonb_build_object('error','bad week'); end if;
  if p_mode is null or p_mode not in ('normal','hard') or p_week < first_week then return jsonb_build_object('error','no such race that week'); end if;
  if exists(select 1 from sqs_ranked_payout_weeks where week=p_week and mode=p_mode) then return jsonb_build_object('ok',true,'again',true); end if;
  end_at := '2026-11-02T00:00:00Z'::timestamptz + (p_week+1)*interval '7 days';
  if now()<end_at then return jsonb_build_object('error','submission grace'); end if;
  -- Unstarted prepaid entries can no longer be played, including players who never retry start.
  update sqs_ranked_entries set refund_reason='ranked admission closed before this entry started'
    where week=p_week and mode=p_mode and started_at is null and claimed_at is null and finished_at is null and refund_reason is null;
  -- A claimed log remains recoverable even after its worker lease expires.
  if exists(select 1 from sqs_ranked_entries where week=p_week and mode=p_mode and refund_reason is null
    and claimed_at is not null and finished_at is null) then return jsonb_build_object('error','replay in progress'); end if;
  if exists(select 1 from sqs_ranked_entries where week=p_week and mode=p_mode and refund_reason is null and started_at is not null
    and finished_at is null and ((clock_version=1 and now()<=end_at+interval '5 minutes')
      or (clock_version is null and now()<end_at+interval '180 minutes'))) then return jsonb_build_object('error','submission grace'); end if;
  if p_week > first_week then
    select rollover into incoming_total from sqs_ranked_payout_weeks where week=p_week-1 and mode=p_mode;
    if not found then return jsonb_build_object('error','previous week missing'); end if;
  end if;
  select coalesce(sum(paid),0) into paid_total from sqs_ranked_entries where week=p_week and mode=p_mode and refund_reason is null;
  if paid_total < 0 or paid_total <> trunc(paid_total) then return jsonb_build_object('error','invalid paid total'); end if;
  house_total := trunc(paid_total/10); pool_total := paid_total-house_total+incoming_total; rolled := pool_total;
  select coalesce(jsonb_agg(x),'[]') into winners from (
    select id::text,name,wallet,t,kills,level,won,adv,log_sha from (
      select distinct on(wallet) * from sqs_ranked_entries where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null
        and wallet <> '0x9d506ba29843a232409d85e289edece8d6a7b452' -- the developer's wallet plays for no prize (both races)
      order by wallet,sqs_ranked_score(week,won,t,kills) desc,finished_at asc,id asc) best
    where sqs_ranked_placeable(p_week,t) -- week 1 on: a run under 3:00 never wins
    order by sqs_ranked_score(p_week,won,t,kills) desc,finished_at asc,id::bigint asc limit 5) x;
  select pool_total-sum(trunc(pool_total*weight/100)) into dust from unnest(weights) as weight;
  for winner in select value from jsonb_array_elements(winners) loop
    idx := idx+1;
    share := trunc(pool_total*weights[idx]/100);
    if idx=jsonb_array_length(winners) then share := share+dust; end if;
    rolled := rolled-share;
    prizes := prizes || jsonb_build_array(jsonb_build_object('wallet',winner->>'wallet','amount',share::text));
  end loop;
  expected := jsonb_build_object('house',house_total::text,'pool',pool_total::text,'rollover',rolled::text,'prizes',prizes);
  if p_plan is distinct from expected then return jsonb_build_object('error','plan differs from settlement'); end if;
  insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at)
    values(p_week,p_mode,paid_total,house_total,pool_total,incoming_total,rolled,winners,now());
  idx := 0;
  for winner in select value from jsonb_array_elements(prizes) loop
    idx := idx+1;
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'prize'||idx,winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet') then 'held' else 'planned' end);
    end if;
  end loop;
  if house_total>0 then insert into sqs_ranked_payouts(week,mode,kind,wallet,amount) values(p_week,p_mode,'house','0x9d506ba29843a232409d85e289edece8d6a7b452',house_total); end if;
  insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'rollover-note','0xa1e6e6ee71300c238935b7d59c8983b06e991be0',rolled,'confirmed');
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_ranked_enter(p_server_key text, p_tx text, p_wallet text, p_week int, p_ip_hash text, p_paid numeric, p_seed bigint, p_max int, p_mode text default 'normal')
returns json language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare used int; why text; new_id bigint; prev record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  p_tx := lower(p_tx); p_wallet := lower(p_wallet);
  if p_tx !~ '^0x[0-9a-f]{64}$' or p_wallet !~ '^0x[0-9a-f]{40}$' or p_paid is null or p_paid <= 0
    or p_mode is null or p_mode not in ('normal', 'hard') or (p_mode = 'hard' and p_week < 1) then return json_build_object('error', 'bad entry'); end if;
  -- A payment is unique across weeks; lock it before the week eligibility lock.
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_tx_' || p_tx));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || p_week));
  -- the same payment again (the game retries until it hears back): the same answer as the first time
  select * into prev from sqs_ranked_entries where tx = p_tx;
  if found then
    if prev.wallet <> p_wallet then return json_build_object('error', 'that payment was already used for an entry'); end if;
    if prev.refund_reason is not null then return json_build_object('error', prev.refund_reason || '. Your ' || sqs_ranked_fee(prev.paid) || ' DMT will be sent back.', 'refund', true); end if;
    return json_build_object('ok', true, 'id', prev.id, 'week', prev.week, 'mode', prev.mode, 'again', true,
      'left', p_max - (select count(*) from sqs_ranked_entries where week = prev.week and mode = prev.mode and wallet = p_wallet and refund_reason is null));
  end if;
  if exists (select 1 from sqs_ranked_entries where week = p_week and ip_hash = p_ip_hash and wallet <> p_wallet and refund_reason is null) then
    why := 'one wallet per player each week'; end if;
  select count(*) into used from sqs_ranked_entries where week = p_week and mode = p_mode and wallet = p_wallet and refund_reason is null;
  if why is null and used >= p_max then why := format('all %s %sentries used this week', p_max, case when p_mode = 'hard' then 'Hard ' else '' end); end if;
  if clock_timestamp() >= '2026-11-02T00:00:00Z'::timestamptz+(p_week+1)*interval '7 days'-interval '30 minutes' then why := 'ranked admission is closed'; end if;
  if exists(select 1 from sqs_ranked_payout_weeks where week=p_week and mode=p_mode) then why := 'that week is already settled'; end if;
  insert into sqs_ranked_entries (week, wallet, tx, paid, ip_hash, seed, refund_reason, mode)
    values (p_week, p_wallet, p_tx, p_paid, p_ip_hash, p_seed, why, p_mode) returning id into new_id;
  if why is not null then return json_build_object('error', why || '. Your ' || sqs_ranked_fee(p_paid) || ' DMT will be sent back.', 'refund', true); end if;
  return json_build_object('ok', true, 'id', new_id, 'mode', p_mode, 'left', p_max - used - 1);
end $$;

create or replace function public.sqs_ranked_settle(p_key text, p_week int, p_mode text default 'normal')
returns json language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  return json_build_object(
    'week', p_week, 'mode', p_mode, 'rules', case when p_week >= 1 then 'combined' else 'classic' end,
    'entries', (select count(*) from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'paid', (select coalesce(sum(paid), 0)::text from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'top', coalesce((select json_agg(x) from (
      select id, name, wallet, t, kills, level, won, adv, log_sha from (
        select distinct on (wallet) * from sqs_ranked_entries where week = p_week and mode = p_mode and verdict = 'ok' and refund_reason is null
        order by wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best
      order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc limit 10) x), '[]'::json),
    'refunds', coalesce((select json_agg(json_build_object('wallet', wallet, 'tx', tx, 'paid', paid::text, 'why', refund_reason)) from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is not null), '[]'::json),
    'rejected', (select count(*) from sqs_ranked_entries where week = p_week and mode = p_mode and verdict like 'rejected%'),
    'wallets', (select count(distinct wallet) from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null));
end $$;


revoke all on function public.sqs_ranked_score(int,boolean,int,int) from public,anon,authenticated;
revoke all on function public.sqs_ranked_settle(text,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_settle(text,int,text) to anon;

revoke all on function public.sqs_ranked_clock_start(text,bigint,text,text,bigint) from public,anon,authenticated;
grant execute on function public.sqs_ranked_clock_start(text,bigint,text,text,bigint) to anon;

revoke all on function public.sqs_ranked_clock(text,bigint,text,bigint,text,int,int) from public,anon,authenticated;
grant execute on function public.sqs_ranked_clock(text,bigint,text,bigint,text,int,int) to anon;

revoke all on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.sqs_ranked_claim_v2(text,bigint,text,bigint,text,uuid,boolean) to anon;

revoke all on function public.sqs_payout_plan(text,int,jsonb,text) from public,anon,authenticated;
grant execute on function public.sqs_payout_plan(text,int,jsonb,text) to anon;

revoke all on function public.sqs_ranked_enter(text,text,text,int,text,numeric,bigint,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_enter(text,text,text,int,text,numeric,bigint,int,text) to anon;

revoke all on function public.sqs_ranked_claim(text,bigint,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_claim(text,bigint,text) to anon;

revoke all on function public.sqs_ranked_active(text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_active(text) to anon;
revoke all on function public.sqs_ranked_restart(text,bigint,text,bigint,text,bigint) from public,anon,authenticated;
grant execute on function public.sqs_ranked_restart(text,bigint,text,bigint,text,bigint) to anon;

revoke all on public.sqs_ranked_entries from public,anon,authenticated;
notify pgrst,'reload schema';
commit;
