-- Update18: OWNER PASTE after updates16/17. Week0 plans/transfers remain unchanged.
-- Week1+: uncapped accepted >=180s runs; active simulation seconds exclude pauses.
-- House remains 10% of paid; remaining pool (including rollover) is 80/10/10.
-- Floors: placing=pool*80/100, runs=pool/10, time=remaining base units.
-- Placing dust retains the old last-occupied-place rule; missing places roll over.
-- Activity uses largest remainders, ties by ascending wallet; empty buckets roll over.
-- This script only changes schema/functions, never existing player/payment/key rows.
begin;
alter table public.sqs_ranked_payout_weeks add column if not exists activity jsonb;
alter table public.sqs_ranked_payouts drop constraint if exists sqs_ranked_payouts_kind_check;
alter table public.sqs_ranked_payouts add constraint sqs_ranked_payouts_kind_check
 check(kind in ('prize1','prize2','prize3','prize4','prize5','participation','house','refund','rollover-note'));

create or replace function public.sqs_reward_activity(p_week int,p_mode text)
returns jsonb language sql stable security definer set search_path=pg_catalog,public,pg_temp as $$
 select coalesce(jsonb_agg(x order by wallet),'[]'::jsonb) from (
 select wallet,count(*)::text runs,sum(t)::text seconds from public.sqs_ranked_entries
 where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null and finished_at is not null and t>=180
 and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452' group by wallet) x
$$;
revoke all on function public.sqs_reward_activity(int,text) from public,anon,authenticated;

create or replace function public.sqs_payout_plan(p_key text, p_week int, p_plan jsonb, p_mode text default 'normal')
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
    and not coalesce(week>=1 and verdict='ok' and t>=180 and refund_reason is null and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452',false)
    and (week < w - 1 or (week <= w and id not in (
    select id from (
      select id, row_number() over (partition by week, mode order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) as place from (
        select distinct on (week, mode, wallet) id, week, mode, wallet, won, t, kills, finished_at from sqs_ranked_entries
        where week between w - 1 and w and verdict = 'ok'
        order by week, mode, wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best) ranked
    where place <= 10)));
  return json_build_object('ok', true, 'rank', r);
end $$;

create or replace function public.sqs_ranked_board(p_week int, p_mode text default 'normal')
returns json language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select json_build_object(
    'mode', p_mode, 'activity',case when p_week>=1 then public.sqs_reward_activity(p_week,p_mode) else '[]'::jsonb end,
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
create or replace function public.sqs_ranked_settle(p_key text, p_week int, p_mode text default 'normal')
returns json language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  return json_build_object(
    'activity_runs',case when p_week>=1 then (select coalesce(json_agg(x order by x.id),'[]'::json) from (select id::text,name,wallet,t,kills from sqs_ranked_entries where week=p_week and mode=p_mode and verdict='ok' and refund_reason is null and finished_at is not null and t>=180 and wallet<>'0x9d506ba29843a232409d85e289edece8d6a7b452') x) else '[]'::json end,
    'activity',case when p_week>=1 then sqs_reward_activity(p_week,p_mode) else '[]'::jsonb end,
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

create or replace function public.sqs_payout_hold(p_key text, p_week int, p_wallet text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  p_wallet := lower(p_wallet);
  if p_week is null or p_week<0 or p_wallet is null or p_wallet !~ '^0x[0-9a-f]{40}$' then return jsonb_build_object('error','bad hold'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_payout_nonce'));
  -- prizes already sending or sent cannot be held back; the hold still covers the wallet's other prizes that week (with
  -- two races, one race's prize can be on its way while the other's is still planned)
  select count(*) into n from sqs_ranked_payouts where week=p_week and wallet=p_wallet and (kind like 'prize%' or kind='participation') and status in ('sending','sent','confirmed','failed');
  if p_reason is null then
    delete from sqs_ranked_holds where week=p_week and wallet=p_wallet;
    update sqs_ranked_payouts set status='planned',updated_at=now() where week=p_week and wallet=p_wallet and (kind like 'prize%' or kind='participation') and status='held';
  else
    if btrim(p_reason)='' then return jsonb_build_object('error','empty reason'); end if;
    insert into sqs_ranked_holds(week,wallet,reason) values(p_week,p_wallet,left(p_reason,500)) on conflict(week,wallet) do update set reason=excluded.reason,at=now();
    update sqs_ranked_payouts set status='held',updated_at=now() where week=p_week and wallet=p_wallet and (kind like 'prize%' or kind='participation') and status='planned';
  end if;
  if n>0 then return jsonb_build_object('ok',true,'unchanged',n,'message','already sending or sent; hold does nothing for those'); end if;
  return jsonb_build_object('ok',true,'unchanged',0);
end $$;

create or replace function public.sqs_payout_claim(p_key text, p_id bigint, p_pending numeric, p_block numeric)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare r sqs_ranked_payouts; chosen numeric;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_pending is null or p_pending<0 or p_pending<>trunc(p_pending) or p_block is null or p_block<0 or p_block<>trunc(p_block) then return jsonb_build_object('error','bad nonce'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_payout_nonce'));
  select * into r from sqs_ranked_payouts where id=p_id for update;
  if not found or r.status<>'planned' or r.kind='rollover-note' or r.amount<=0 then return jsonb_build_object('error','not claimable'); end if;
  if r.kind<>'refund' and not exists(select 1 from sqs_ranked_payout_weeks where week=r.week and mode=r.mode and pay_at<=now()) then return jsonb_build_object('error','not due'); end if;
  if (r.kind like 'prize%' or r.kind='participation') and exists(select 1 from sqs_ranked_holds where week=r.week and wallet=r.wallet) then return jsonb_build_object('error','held'); end if;
  select greatest(p_pending,coalesce(max(nonce)+1,0)) into chosen from sqs_ranked_payouts;
  update sqs_ranked_payouts set status='sending',nonce=chosen,scan_block=p_block,updated_at=now() where id=p_id;
  return jsonb_build_object('ok',true,'row',to_jsonb(r)||jsonb_build_object('status','sending','nonce',chosen::text,'scan_block',p_block::text,'id',r.id::text,'amount',r.amount::text));
end $$;
revoke all on function public.sqs_payout_plan(text,int,jsonb,text) from public,anon,authenticated;
grant execute on function public.sqs_payout_plan(text,int,jsonb,text) to anon;
revoke all on function public.sqs_ranked_settle(text,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_settle(text,int,text) to anon;
revoke all on function public.sqs_ranked_board(int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_board(int,text) to anon;
revoke all on function public.sqs_payout_hold(text,int,text,text) from public,anon,authenticated;
grant execute on function public.sqs_payout_hold(text,int,text,text) to anon;
revoke all on function public.sqs_payout_claim(text,bigint,numeric,numeric) from public,anon,authenticated;
grant execute on function public.sqs_payout_claim(text,bigint,numeric,numeric) to anon;
revoke all on function public.sqs_ranked_finish(text,bigint,text,int,int,int,boolean,text,text,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_finish(text,bigint,text,int,int,int,boolean,text,text,text) to anon;
notify pgrst,'reload schema';
commit;
