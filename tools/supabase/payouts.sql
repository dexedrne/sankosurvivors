-- Ranked payout ledger. Paste this whole script after schema.sql and ranked.sql.
-- Reapplying preserves keys, plans, nonce assignments and transfer history.
insert into public.sqs_admin(k,v) values ('payout_key_sha256','UNCONFIGURED') on conflict (k) do nothing;

create table if not exists public.sqs_ranked_payout_weeks (
  week int primary key check(week >= 0),
  paid numeric not null, house numeric not null, pool numeric not null,
  incoming numeric not null, rollover numeric not null,
  top jsonb not null, created_at timestamptz not null default now(),
  pay_at timestamptz not null
);
create table if not exists public.sqs_ranked_payouts (
  id bigserial primary key,
  week int not null,
  kind text not null check(kind in ('prize1','prize2','prize3','prize4','prize5','house','refund','rollover-note')),
  wallet text not null check(wallet ~ '^0x[0-9a-f]{40}$' and wallet <> '0x0000000000000000000000000000000000000000'),
  amount numeric not null check(amount >= 0 and amount = trunc(amount) and amount < power(2::numeric,256)),
  source_entry_id bigint unique references public.sqs_ranked_entries(id),
  status text not null default 'planned' check(status in ('planned','held','sending','sent','confirmed','failed')),
  nonce numeric unique check(nonce >= 0 and nonce = trunc(nonce)),
  tx_hash text unique check(tx_hash ~ '^0x[0-9a-f]{64}$'),
  raw_tx text check(raw_tx ~ '^0x02[0-9a-f]+$'),
  scan_block numeric,
  error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  sent_at timestamptz, confirmed_at timestamptz,
  check((kind = 'refund') = (source_entry_id is not null))
);
-- Refunds must allow several entries from the same wallet, including late arrivals.
create unique index if not exists sqs_payout_unique_transfer on public.sqs_ranked_payouts(week,kind,wallet) where kind <> 'refund';
create table if not exists public.sqs_ranked_holds (
  week int not null, wallet text not null check(wallet ~ '^0x[0-9a-f]{40}$'),
  reason text not null, at timestamptz not null default now(), primary key(week,wallet)
);
create table if not exists public.sqs_ranked_payout_notices (name text primary key, at timestamptz not null default now());
create table if not exists public.sqs_ranked_payout_runner (id int primary key check(id=1), owner text not null, until_at timestamptz not null);

alter table public.sqs_ranked_payouts enable row level security;
alter table public.sqs_ranked_payout_weeks enable row level security;
alter table public.sqs_ranked_holds enable row level security;
alter table public.sqs_ranked_payout_notices enable row level security;
alter table public.sqs_ranked_payout_runner enable row level security;
revoke all on public.sqs_ranked_payouts, public.sqs_ranked_payout_weeks, public.sqs_ranked_holds,
  public.sqs_ranked_payout_notices, public.sqs_ranked_payout_runner from public, anon, authenticated;
revoke all on sequence public.sqs_ranked_payouts_id_seq from public, anon, authenticated;

create or replace function public.sqs_payout_read(p_key text, p_week int default null)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  return jsonb_build_object(
    'weeks',coalesce((select jsonb_agg(to_jsonb(w) || jsonb_build_object('paid',paid::text,'house',house::text,'pool',pool::text,'incoming',incoming::text,'rollover',rollover::text) order by week) from sqs_ranked_payout_weeks w where p_week is null or week=p_week),'[]'),
    'rows',coalesce((select jsonb_agg(to_jsonb(p) || jsonb_build_object('id',id::text,'amount',amount::text,'nonce',nonce::text,'scan_block',scan_block::text,'source_entry_id',source_entry_id::text) order by week,id) from sqs_ranked_payouts p where p_week is null or week=p_week),'[]'),
    'holds',coalesce((select jsonb_agg(h) from sqs_ranked_holds h where p_week is null or week=p_week),'[]'));
end $$;

create or replace function public.sqs_payout_plan(p_key text, p_week int, p_plan jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare paid_total numeric; house_total numeric; pool_total numeric; incoming_total numeric := 0; rolled numeric; dust numeric;
  weights int[] := array[40,25,15,12,8]; -- src/ranked.js RANKED.payouts
  winners jsonb; prizes jsonb := '[]'; winner jsonb; share numeric; idx int := 0; expected jsonb; end_at timestamptz;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_payout_plan'));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || p_week));
  if p_week is null or p_week < 0 then return jsonb_build_object('error','bad week'); end if;
  if exists(select 1 from sqs_ranked_payout_weeks where week=p_week) then return jsonb_build_object('ok',true,'again',true); end if;
  end_at := '2026-11-02T00:00:00Z'::timestamptz + (p_week+1)*interval '7 days';
  if now() < end_at + interval '56 minutes' then return jsonb_build_object('error','submission grace'); end if;
  if p_week > 0 then
    select rollover into incoming_total from sqs_ranked_payout_weeks where week=p_week-1;
    if not found then return jsonb_build_object('error','previous week missing'); end if;
  end if;
  select coalesce(sum(paid),0) into paid_total from sqs_ranked_entries where week=p_week and refund_reason is null;
  if paid_total < 0 or paid_total <> trunc(paid_total) then return jsonb_build_object('error','invalid paid total'); end if;
  house_total := trunc(paid_total/10); pool_total := paid_total-house_total+incoming_total; rolled := pool_total;
  select coalesce(jsonb_agg(x),'[]') into winners from (
    select id::text,name,wallet,t,kills,level,won,adv,log_sha from (
      select distinct on(wallet) * from sqs_ranked_entries where week=p_week and verdict='ok' and refund_reason is null
        and wallet <> '0x9d506ba29843a232409d85e289edece8d6a7b452' -- the developer's wallet plays for no prize
      order by wallet,won desc,t desc,kills desc,finished_at asc,id asc) best
    order by won desc,t desc,kills desc,finished_at asc,id::bigint asc limit 5) x;
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
  insert into sqs_ranked_payout_weeks(week,paid,house,pool,incoming,rollover,top,pay_at)
    values(p_week,paid_total,house_total,pool_total,incoming_total,rolled,winners,end_at+interval '24 hours');
  idx := 0;
  for winner in select value from jsonb_array_elements(prizes) loop
    idx := idx+1;
    if (winner->>'amount')::numeric > 0 then
      insert into sqs_ranked_payouts(week,kind,wallet,amount,status) values(p_week,'prize'||idx,winner->>'wallet',(winner->>'amount')::numeric,
        case when exists(select 1 from sqs_ranked_holds where week=p_week and wallet=winner->>'wallet') then 'held' else 'planned' end);
    end if;
  end loop;
  if house_total>0 then insert into sqs_ranked_payouts(week,kind,wallet,amount) values(p_week,'house','0x9d506ba29843a232409d85e289edece8d6a7b452',house_total); end if;
  insert into sqs_ranked_payouts(week,kind,wallet,amount,status) values(p_week,'rollover-note','0xa1e6e6ee71300c238935b7d59c8983b06e991be0',rolled,'confirmed');
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.sqs_payout_refunds(p_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  insert into sqs_ranked_payouts(week,kind,wallet,amount,source_entry_id)
    select week,'refund',wallet,paid,id from sqs_ranked_entries where refund_reason is not null
    on conflict(source_entry_id) do nothing;
  get diagnostics n=row_count;
  return jsonb_build_object('ok',true,'added',n);
end $$;

create or replace function public.sqs_payout_hold(p_key text, p_week int, p_wallet text, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  p_wallet := lower(p_wallet);
  if p_week is null or p_week<0 or p_wallet is null or p_wallet !~ '^0x[0-9a-f]{40}$' then return jsonb_build_object('error','bad hold'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_payout_nonce'));
  select count(*) into n from sqs_ranked_payouts where week=p_week and wallet=p_wallet and kind like 'prize%' and status in ('sending','sent','confirmed','failed');
  if n>0 then return jsonb_build_object('ok',true,'unchanged',n,'message','already sending or sent; hold does nothing'); end if;
  if p_reason is null then
    delete from sqs_ranked_holds where week=p_week and wallet=p_wallet;
    update sqs_ranked_payouts set status='planned',updated_at=now() where week=p_week and wallet=p_wallet and kind like 'prize%' and status='held';
  else
    if btrim(p_reason)='' then return jsonb_build_object('error','empty reason'); end if;
    insert into sqs_ranked_holds(week,wallet,reason) values(p_week,p_wallet,left(p_reason,500)) on conflict(week,wallet) do update set reason=excluded.reason,at=now();
    update sqs_ranked_payouts set status='held',updated_at=now() where week=p_week and wallet=p_wallet and kind like 'prize%' and status='planned';
  end if;
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
  if r.kind<>'refund' and not exists(select 1 from sqs_ranked_payout_weeks where week=r.week and pay_at<=now()) then return jsonb_build_object('error','not due'); end if;
  if r.kind like 'prize%' and exists(select 1 from sqs_ranked_holds where week=r.week and wallet=r.wallet) then return jsonb_build_object('error','held'); end if;
  select greatest(p_pending,coalesce(max(nonce)+1,0)) into chosen from sqs_ranked_payouts;
  update sqs_ranked_payouts set status='sending',nonce=chosen,scan_block=p_block,updated_at=now() where id=p_id;
  return jsonb_build_object('ok',true,'row',to_jsonb(r)||jsonb_build_object('status','sending','nonce',chosen::text,'scan_block',p_block::text,'id',r.id::text,'amount',r.amount::text));
end $$;

create or replace function public.sqs_payout_mark(p_key text,p_id bigint,p_status text,p_hash text default null,p_raw text default null,p_error text default null)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare r sqs_ranked_payouts;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  select * into r from sqs_ranked_payouts where id=p_id for update;
  if not found then return jsonb_build_object('error','missing payout'); end if;
  if p_hash is not null and p_hash !~ '^0x[0-9a-f]{64}$' then return jsonb_build_object('error','bad hash'); end if;
  if r.tx_hash is not null and p_hash is distinct from r.tx_hash then return jsonb_build_object('error','immutable hash'); end if;
  if p_raw is not null and (p_raw !~ '^0x02[0-9a-f]+$' or length(p_raw)>20000) then return jsonb_build_object('error','bad transaction'); end if;
  if r.raw_tx is not null and p_raw is not null and p_raw<>r.raw_tx then return jsonb_build_object('error','immutable transaction'); end if;
  if (p_status='sending' and r.status='sending' and p_hash is not null and p_raw is not null)
    or (p_status='sent' and r.status in ('sending','sent') and p_hash is not null)
    or (p_status='confirmed' and r.status='sent' and p_hash=r.tx_hash)
    or (p_status='failed' and r.status in ('sending','sent') and p_error is not null) then
    update sqs_ranked_payouts set status=p_status,tx_hash=coalesce(tx_hash,p_hash),raw_tx=coalesce(raw_tx,p_raw),error=left(p_error,500),updated_at=now(),
      sent_at=case when p_status='sent' then coalesce(sent_at,now()) else sent_at end,
      confirmed_at=case when p_status='confirmed' then now() else confirmed_at end where id=p_id;
    return jsonb_build_object('ok',true);
  end if;
  return jsonb_build_object('error','invalid transition');
end $$;

create or replace function public.sqs_payout_lease(p_key text,p_owner text,p_release boolean default false)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_owner is null or length(p_owner)>100 then return jsonb_build_object('error','bad owner'); end if;
  if p_release then
    delete from sqs_ranked_payout_runner where id=1 and owner=p_owner;
    return jsonb_build_object('ok',true);
  end if;
  insert into sqs_ranked_payout_runner(id,owner,until_at) values(1,p_owner,now()+interval '5 minutes')
    on conflict(id) do update set owner=excluded.owner,until_at=excluded.until_at
    where sqs_ranked_payout_runner.owner=p_owner or sqs_ranked_payout_runner.until_at<now();
  get diagnostics n=row_count;
  return jsonb_build_object('ok',n=1);
end $$;

-- At-most-once delivery: never retry an ambiguous Telegram timeout automatically.
create or replace function public.sqs_payout_notice(p_key text,p_name text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  if p_name is null or length(p_name)>200 then return jsonb_build_object('error','bad notice'); end if;
  insert into sqs_ranked_payout_notices(name) values(p_name) on conflict do nothing;
  get diagnostics n=row_count;
  return jsonb_build_object('ok',n=1);
end $$;

revoke all on function public.sqs_payout_read(text,int), public.sqs_payout_plan(text,int,jsonb), public.sqs_payout_refunds(text),
  public.sqs_payout_hold(text,int,text,text), public.sqs_payout_claim(text,bigint,numeric,numeric),
  public.sqs_payout_mark(text,bigint,text,text,text,text), public.sqs_payout_lease(text,text,boolean), public.sqs_payout_notice(text,text) from public, anon, authenticated;
grant execute on function public.sqs_payout_read(text,int), public.sqs_payout_plan(text,int,jsonb), public.sqs_payout_refunds(text),
  public.sqs_payout_hold(text,int,text,text), public.sqs_payout_claim(text,bigint,numeric,numeric),
  public.sqs_payout_mark(text,bigint,text,text,text,text), public.sqs_payout_lease(text,text,boolean), public.sqs_payout_notice(text,text) to anon;
