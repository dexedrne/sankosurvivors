-- Update19: OWNER PASTE WHOLE FILE AFTER18; keep19 LAST when restoring functions.
-- Optional1/10DMT Standard entries share one race/pool. No token transfer or payout job is invoked.
-- Week1+:80%placing (still>=180s),10%eligible contributed DMT,10%active seconds (both>=30s).
-- Existing boards/entry RPCs remain compatible; old planner refuses new week1+ plans.
-- New clients/workers use versioned RPCs. Existing finalized week1+ policy1 plans block this migration.
-- Only schema/function definitions change; no existing player/payment/key rows are edited.
begin;
alter table public.sqs_ranked_payout_weeks add column if not exists reward_version int not null default 1;
do $$ begin
  if exists(select 1 from public.sqs_ranked_payout_weeks where week>=1 and reward_version<>2) then
    raise exception 'An affected week is already settled; preserve its snapshot and review activation separately';
  end if;
end $$;


create or replace function public.sqs_reward_activity_v2(p_week int,p_mode text)
returns jsonb language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select coalesce(jsonb_agg(x order by wallet),'[]'::jsonb) from (
 select wallet,count(*)::text runs,sum(t)::text seconds,sum(paid)::text paid from public.sqs_ranked_entries
 where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null and finished_at is not null and t>=30 and paid>0
 and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452' group by wallet) x
$$;

create or replace function public.sqs_ranked_can_enter_v2(p_server_key text,p_wallet text,p_week int,p_ip_hash text,p_max int,p_mode text default 'normal')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare result jsonb;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  result:=public.sqs_ranked_can_enter(p_server_key,p_wallet,p_week,p_ip_hash,p_max,p_mode)::jsonb;
  if result?'error' then return result; end if;
  return result || jsonb_build_object('reward_version',2);
end $$;
revoke all on function public.sqs_ranked_can_enter_v2(text,text,int,text,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_can_enter_v2(text,text,int,text,int,text) to anon;

create or replace function public.sqs_ranked_enter_v2(p_server_key text,p_tx text,p_wallet text,p_week int,p_ip_hash text,p_paid numeric,p_seed bigint,p_max int,p_mode text default 'normal')
returns json language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return json_build_object('error','forbidden'); end if;
  if p_week is null or p_week<0 or p_mode is null or p_mode not in ('normal','hard') or p_paid is null
    or not ((p_mode='normal' and ((p_week=0 and p_paid=500000000000000000) or (p_week>=1 and p_paid in (1000000000000000000,10000000000000000000))))
      or (p_mode='hard' and p_week>=1 and p_paid=2000000000000000000)) then return json_build_object('error','bad entry amount'); end if;
  return public.sqs_ranked_enter(p_server_key,p_tx,p_wallet,p_week,p_ip_hash,p_paid,p_seed,p_max,p_mode);
end $$;

create or replace function public.sqs_payout_plan_v2(p_key text, p_week int, p_plan jsonb, p_mode text default 'normal')
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare paid_total numeric; house_total numeric; pool_total numeric; incoming_total numeric := 0; rolled numeric; dust numeric;
  weights int[] := array[40,25,15,12,8]; -- src/ranked.js RANKED.payouts
  winners jsonb; prizes jsonb := '[]'; winner jsonb; share numeric; idx int := 0; expected jsonb; end_at timestamptz;
  activity jsonb; participation jsonb := '[]'; placing_total numeric; run_total numeric; second_total numeric;
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
      or (clock_version is null and now()<end_at+interval '180 minutes'
        and now()<started_at+interval '180 minutes'))) then return jsonb_build_object('error','submission grace'); end if;
  if p_week > first_week then
    select rollover into incoming_total from sqs_ranked_payout_weeks where week=p_week-1 and mode=p_mode;
    if not found then return jsonb_build_object('error','previous week missing'); end if;
  end if;
  select coalesce(sum(paid),0) into paid_total from sqs_ranked_entries where week=p_week and mode=p_mode and refund_reason is null;
  if paid_total < 0 or paid_total <> trunc(paid_total) then return jsonb_build_object('error','invalid paid total'); end if;
  house_total := trunc(paid_total/10); pool_total := paid_total-house_total+incoming_total; rolled := pool_total;
  placing_total := case when p_week>=1 then trunc(pool_total*80/100) else pool_total end;
  run_total := case when p_week>=1 then trunc(pool_total/10) else 0 end;
  second_total := pool_total-placing_total-run_total;
  activity := case when p_week>=1 then sqs_reward_activity_v2(p_week,p_mode) else null end;
  select coalesce(jsonb_agg(x),'[]') into winners from (
    select id::text,name,wallet,t,kills,level,won,adv,log_sha from (
      select distinct on(wallet) * from sqs_ranked_entries where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null
        and wallet <> '0x9d506ba29843a232409d85e289edece8d6a7b452' -- the developer's wallet plays for no prize (both races)
      order by wallet,sqs_ranked_score(week,won,t,kills) desc,finished_at asc,id asc) best
    where sqs_ranked_placeable(p_week,t) -- week 1 on: a run under 3:00 never wins
    order by sqs_ranked_score(p_week,won,t,kills) desc,finished_at asc,id::bigint asc limit 5) x;
  select placing_total-sum(trunc(placing_total*weight/100)) into dust from unnest(weights) as weight;
  for winner in select value from jsonb_array_elements(winners) loop
    idx := idx+1;
    share := trunc(placing_total*weights[idx]/100);
    if idx=jsonb_array_length(winners) then share := share+dust; end if;
    rolled := rolled-share;
    prizes := prizes || jsonb_build_array(jsonb_build_object('wallet',winner->>'wallet','amount',share::text));
  end loop;
  if p_week>=1 then
    with metrics as (
      select wallet,paid::numeric paid,seconds::numeric seconds from jsonb_to_recordset(activity) as a(wallet text,paid text,seconds text)
    ), buckets as (
      select wallet,'paid' bucket,run_total budget,paid metric,sum(paid) over() total from metrics
      union all select wallet,'seconds',second_total,seconds,sum(seconds) over() from metrics
    ), floors as (
      select *,trunc(budget*metric/total) base,mod(budget*metric,total) remainder from buckets
    ), allocations as (
      select *,row_number() over(partition by bucket order by remainder desc,wallet asc) tie,
        budget-sum(base) over(partition by bucket) dust from floors
    ), combined as (
      select wallet,sum(base+case when tie<=allocations.dust then 1 else 0 end) amount from allocations group by wallet
    ) select coalesce(jsonb_agg(jsonb_build_object('wallet',wallet,'amount',amount::text) order by wallet),'[]'::jsonb) into participation from combined;
    select rolled-coalesce(sum((value->>'amount')::numeric),0) into rolled from jsonb_array_elements(participation);
  end if;
  expected := jsonb_build_object('house',house_total::text,'pool',pool_total::text,'rollover',rolled::text,'prizes',prizes);
  if p_week>=1 then expected := expected || jsonb_build_object('participation',participation); end if;
  if p_plan is distinct from expected then return jsonb_build_object('error','plan differs from settlement'); end if;
  insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at,activity,reward_version)
    values(p_week,p_mode,paid_total,house_total,pool_total,incoming_total,rolled,winners,now(),activity,case when p_week>=1 then 2 else 0 end);
  idx := 0;
  for winner in select value from jsonb_array_elements(prizes) loop
    idx := idx+1;
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'prize'||idx,winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet') then 'held' else 'planned' end);
    end if;
  end loop;
  for winner in select value from jsonb_array_elements(participation) loop
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'participation',winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet')
          or exists(select 1 from sqs_ranked_entries e where e.week=p_week and e.mode=p_mode and e.wallet=winner->>'wallet'
            and e.verdict='ok' and e.refund_reason is null and e.finished_at is not null and e.t>=30 and e.paid>0 and e.log is null)
          then 'held' else 'planned' end);
    end if;
  end loop;
  if house_total>0 then insert into sqs_ranked_payouts(week,mode,kind,wallet,amount) values(p_week,p_mode,'house','0x9d506ba29843a232409d85e289edece8d6a7b452',house_total); end if;
  insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'rollover-note','0xa1e6e6ee71300c238935b7d59c8983b06e991be0',rolled,'confirmed');
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_payout_plan(p_key text, p_week int, p_plan jsonb, p_mode text default 'normal')
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare paid_total numeric; house_total numeric; pool_total numeric; incoming_total numeric := 0; rolled numeric; dust numeric;
  weights int[] := array[40,25,15,12,8]; -- src/ranked.js RANKED.payouts
  winners jsonb; prizes jsonb := '[]'; winner jsonb; share numeric; idx int := 0; expected jsonb; end_at timestamptz;
  activity jsonb; participation jsonb := '[]'; placing_total numeric; run_total numeric; second_total numeric;
  first_week int := case when p_mode = 'hard' then 1 else 0 end; -- src/ranked.js RANKED.kpmWeek opens the Hard race
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_week>=1 then return jsonb_build_object('error','reward policy requires updated payout worker'); end if;
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
      or (clock_version is null and now()<end_at+interval '180 minutes'
        and now()<started_at+interval '180 minutes'))) then return jsonb_build_object('error','submission grace'); end if;
  if p_week > first_week then
    select rollover into incoming_total from sqs_ranked_payout_weeks where week=p_week-1 and mode=p_mode;
    if not found then return jsonb_build_object('error','previous week missing'); end if;
  end if;
  select coalesce(sum(paid),0) into paid_total from sqs_ranked_entries where week=p_week and mode=p_mode and refund_reason is null;
  if paid_total < 0 or paid_total <> trunc(paid_total) then return jsonb_build_object('error','invalid paid total'); end if;
  house_total := trunc(paid_total/10); pool_total := paid_total-house_total+incoming_total; rolled := pool_total;
  placing_total := case when p_week>=1 then trunc(pool_total*80/100) else pool_total end;
  run_total := case when p_week>=1 then trunc(pool_total/10) else 0 end;
  second_total := pool_total-placing_total-run_total;
  activity := case when p_week>=1 then sqs_reward_activity(p_week,p_mode) else null end;
  select coalesce(jsonb_agg(x),'[]') into winners from (
    select id::text,name,wallet,t,kills,level,won,adv,log_sha from (
      select distinct on(wallet) * from sqs_ranked_entries where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null
        and wallet <> '0x9d506ba29843a232409d85e289edece8d6a7b452' -- the developer's wallet plays for no prize (both races)
      order by wallet,sqs_ranked_score(week,won,t,kills) desc,finished_at asc,id asc) best
    where sqs_ranked_placeable(p_week,t) -- week 1 on: a run under 3:00 never wins
    order by sqs_ranked_score(p_week,won,t,kills) desc,finished_at asc,id::bigint asc limit 5) x;
  select placing_total-sum(trunc(placing_total*weight/100)) into dust from unnest(weights) as weight;
  for winner in select value from jsonb_array_elements(winners) loop
    idx := idx+1;
    share := trunc(placing_total*weights[idx]/100);
    if idx=jsonb_array_length(winners) then share := share+dust; end if;
    rolled := rolled-share;
    prizes := prizes || jsonb_build_array(jsonb_build_object('wallet',winner->>'wallet','amount',share::text));
  end loop;
  if p_week>=1 then
    with metrics as (
      select wallet,runs::numeric runs,seconds::numeric seconds from jsonb_to_recordset(activity) as a(wallet text,runs text,seconds text)
    ), buckets as (
      select wallet,'runs' bucket,run_total budget,runs metric,sum(runs) over() total from metrics
      union all select wallet,'seconds',second_total,seconds,sum(seconds) over() from metrics
    ), floors as (
      select *,trunc(budget*metric/total) base,mod(budget*metric,total) remainder from buckets
    ), allocations as (
      select *,row_number() over(partition by bucket order by remainder desc,wallet asc) tie,
        budget-sum(base) over(partition by bucket) dust from floors
    ), combined as (
      select wallet,sum(base+case when tie<=allocations.dust then 1 else 0 end) amount from allocations group by wallet
    ) select coalesce(jsonb_agg(jsonb_build_object('wallet',wallet,'amount',amount::text) order by wallet),'[]'::jsonb) into participation from combined;
    select rolled-coalesce(sum((value->>'amount')::numeric),0) into rolled from jsonb_array_elements(participation);
  end if;
  expected := jsonb_build_object('house',house_total::text,'pool',pool_total::text,'rollover',rolled::text,'prizes',prizes);
  if p_week>=1 then expected := expected || jsonb_build_object('participation',participation); end if;
  if p_plan is distinct from expected then return jsonb_build_object('error','plan differs from settlement'); end if;
  insert into sqs_ranked_payout_weeks(week,mode,paid,house,pool,incoming,rollover,top,pay_at,activity)
    values(p_week,p_mode,paid_total,house_total,pool_total,incoming_total,rolled,winners,now(),activity);
  idx := 0;
  for winner in select value from jsonb_array_elements(prizes) loop
    idx := idx+1;
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'prize'||idx,winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet') then 'held' else 'planned' end);
    end if;
  end loop;
  for winner in select value from jsonb_array_elements(participation) loop
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'participation',winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet') then 'held' else 'planned' end);
    end if;
  end loop;
  if house_total>0 then insert into sqs_ranked_payouts(week,mode,kind,wallet,amount) values(p_week,p_mode,'house','0x9d506ba29843a232409d85e289edece8d6a7b452',house_total); end if;
  insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,status) values(p_week,p_mode,'rollover-note','0xa1e6e6ee71300c238935b7d59c8983b06e991be0',rolled,'confirmed');
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_ranked_finish(p_server_key text, p_id bigint, p_name text, p_t int, p_kills int, p_level int, p_won boolean, p_verdict text, p_log_sha text, p_log text)
returns json language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare w int; r int; me record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  p_name := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g')), 16);
  select week into w from sqs_ranked_entries where id = p_id;
  -- Serialize ranking and pruning, including submissions straddling a weekly reset.
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || (w - 1)));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || w));
  update sqs_ranked_entries set finished_at = now(), name = coalesce(nullif(p_name, ''), 'Adventurer'), t = p_t, kills = p_kills, level = p_level,
    won = coalesce(p_won, false), verdict = left(p_verdict, 120), log_sha = p_log_sha, log = case when p_verdict = 'ok' then p_log end
    where id = p_id and claimed_at is not null and finished_at is null returning week, wallet, mode into me;
  if me is null then return json_build_object('error', 'that run was already sent'); end if;
  w := me.week;
  -- the wallet's place on its race's board
  select place into r from (
    select wallet, row_number() over (order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) as place from (
      select distinct on (wallet) id, week, wallet, won, t, kills, finished_at from sqs_ranked_entries
      where week = w and mode = me.mode and verdict = 'ok'
      order by wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best) board
    where wallet = me.wallet;
  -- Participation pays all qualifying week1+ runs, so retain those logs for review even outside the best/top10.
  update sqs_ranked_entries set log = null where log is not null
    and not coalesce(week>=1 and verdict='ok' and t>=30 and refund_reason is null and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452',false)
    and (week < w - 1 or (week <= w and id not in (
    select id from (
      select id, row_number() over (partition by week, mode order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) as place from (
        select distinct on (week, mode, wallet) id, week, mode, wallet, won, t, kills, finished_at from sqs_ranked_entries
        where week between w - 1 and w and verdict = 'ok'
        order by week, mode, wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best) ranked
    where place <= 10)));
  return json_build_object('ok', true, 'rank', r);
end $$;

create or replace function public.sqs_ranked_board_v2(p_week int, p_mode text default 'normal')
returns json language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select json_build_object(
    'reward_version',case when p_week>=1 then 2 else 0 end,'mode', p_mode, 'activity',case when p_week>=1 then public.sqs_reward_activity_v2(p_week,p_mode) else '[]'::jsonb end,
    'entries', (select count(*) from public.sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'paid', (select coalesce(sum(paid), 0)::text from public.sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'incoming', case when p_week = case when p_mode = 'hard' then 1 else 0 end then '0'
      else (select rollover::text from public.sqs_ranked_payout_weeks where week = p_week - 1 and mode = p_mode) end,
    'incoming_ready', p_week = case when p_mode = 'hard' then 1 else 0 end
      or exists(select 1 from public.sqs_ranked_payout_weeks where week = p_week - 1 and mode = p_mode),
    'rows', coalesce((select json_agg(x) from (
      select name, wallet, t, kills, level, won, adv, runs, (extract(epoch from finished_at) * 1000)::bigint as at from (
        select distinct on (wallet) *, count(*) over (partition by wallet) as runs from public.sqs_ranked_entries where week = p_week and mode = p_mode and verdict = 'ok' and refund_reason is null
        order by wallet, public.sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best
      order by public.sqs_ranked_score(p_week, won, t, kills) desc, finished_at asc, id asc limit 25) x), '[]'::json))
$$;

create or replace function public.sqs_ranked_settle_v2(p_key text, p_week int, p_mode text default 'normal')
returns json language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  return json_build_object(
    'activity_runs',case when p_week>=1 then (select coalesce(json_agg(x order by x.id),'[]'::json) from (select id::text,name,wallet,t,kills from sqs_ranked_entries where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null and finished_at is not null and t>=30 and paid>0 and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452') x) else '[]'::json end,
    'activity',case when p_week>=1 then sqs_reward_activity_v2(p_week,p_mode) else '[]'::jsonb end,
    'reward_version',case when p_week>=1 then 2 else 0 end,'week', p_week, 'mode', p_mode, 'rules', case when p_week >= 1 then 'combined' else 'classic' end,
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

-- Read-only review/reserve callers keep their RPC; new payout plans still require the versioned planner.
create or replace function public.sqs_ranked_settle(p_key text,p_week int,p_mode text default 'normal')
returns json language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select public.sqs_ranked_settle_v2(p_key,p_week,p_mode)
$$;

revoke all on function public.sqs_reward_activity_v2(int,text) from public,anon,authenticated;

revoke all on function public.sqs_ranked_enter_v2(text,text,text,int,text,numeric,bigint,int,text) from public,anon,authenticated;

grant execute on function public.sqs_ranked_enter_v2(text,text,text,int,text,numeric,bigint,int,text) to anon;

revoke all on function public.sqs_payout_plan_v2(text,int,jsonb,text) from public,anon,authenticated;

grant execute on function public.sqs_payout_plan_v2(text,int,jsonb,text) to anon;

revoke all on function public.sqs_ranked_board_v2(int,text) from public,anon,authenticated;

grant execute on function public.sqs_ranked_board_v2(int,text) to anon;

revoke all on function public.sqs_ranked_settle_v2(text,int,text) from public,anon,authenticated;

grant execute on function public.sqs_ranked_settle_v2(text,int,text) to anon;

notify pgrst,'reload schema';
commit;
