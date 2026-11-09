-- SankoSurvivors: expired unclaimed legacy runs must not delay settlement.
-- Owner paste after update16.sql. Safe to paste again; no entry or payout rows are changed here.
-- The API rejects new legacy claims after archived run length + 40 minutes from the original start.
-- 180 minutes conservatively exceeds every archived maximum (121 + 40 = 161 minutes).
-- Already-claimed unfinished replays remain protected regardless of their worker lease.

begin;

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
      or (clock_version is null and now()<end_at+interval '180 minutes'
        and now()<started_at+interval '180 minutes'))) then return jsonb_build_object('error','submission grace'); end if;
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

revoke all on function public.sqs_payout_plan(text,int,jsonb,text) from public,anon,authenticated;
grant execute on function public.sqs_payout_plan(text,int,jsonb,text) to anon;

notify pgrst,'reload schema';
commit;
