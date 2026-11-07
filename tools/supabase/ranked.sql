-- SankoQuest Survivors: ranked weekly DMT runs. Paste into the Supabase SQL editor (Solscape project).
-- Uses the existing sqs_admin key hashes (server_key_sha256, reports_key_sha256). Table locked; only these functions.
-- Safe to paste again: it keeps every entry and upgrades an older install in place (the Hard race's mode column, the
-- week 1 kills-per-minute ranking). Paste payouts.sql again right after it.

create table if not exists public.sqs_ranked_entries (
  id bigserial primary key,
  week int not null,
  wallet text not null,
  tx text not null unique,          -- the Arbitrum payment; each counts once
  paid numeric not null,            -- DMT base units (18 decimals)
  ip_hash text not null,            -- keyed hash of the IP, per week (one wallet per player each week)
  seed bigint not null,
  refund_reason text,               -- set when a paid entry was refused: the owner sends the DMT back by hand
  created_at timestamptz not null default now(),
  started_at timestamptz,
  adv text,
  claimed_at timestamptz,
  finished_at timestamptz,
  name text, t int, kills int, level int, won boolean,
  verdict text,                     -- 'ok' or 'rejected: ...'
  log_sha text,
  log text                          -- gzip+base64 of the input log (kept for the week's top runs, for review)
);
-- the race an entry is in: 'normal' (0.5 DMT week0, then1 DMT) or 'hard' (2 DMT from week1). Older rows are all Normal.
alter table public.sqs_ranked_entries add column if not exists mode text not null default 'normal' check (mode in ('normal', 'hard'));
create index if not exists sqs_ranked_week on public.sqs_ranked_entries (week, wallet);
create index if not exists sqs_ranked_ip on public.sqs_ranked_entries (week, ip_hash);
create index if not exists sqs_ranked_week_mode on public.sqs_ranked_entries (week, mode, wallet);
alter table public.sqs_ranked_entries enable row level security;
revoke all on public.sqs_ranked_entries from anon, authenticated;

-- the functions below gained a race argument (p_mode, default 'normal'): drop the old signatures so each name has one
drop function if exists public.sqs_ranked_can_enter(text, text, int, text, int);
drop function if exists public.sqs_ranked_enter(text, text, text, int, text, numeric, bigint, int);
drop function if exists public.sqs_ranked_owe(text, text, text, int, numeric, text);
drop function if exists public.sqs_ranked_board(int);
drop function if exists public.sqs_ranked_settle(text, int);

-- The week's ranking, highest first (same as scoreKey() in src/ranked.js). Week 0: time, kills (endless runs never win). From week 1:
-- lasted 3:00 or more, kills per minute (in millionths, floor(kills * 60000000 / seconds)), kills.
-- Ties then go to the earlier finish, then the earlier entry.
create or replace function public.sqs_ranked_score(p_week int, p_won boolean, p_t int, p_kills int)
returns bigint[] language sql immutable set search_path = pg_catalog as $$
  select case when p_week >= 1 then array[
      case when coalesce(p_t, 0) >= 180 then 1 else 0 end::bigint,
      case when coalesce(p_t, 0) > 0 then (greatest(coalesce(p_kills, 0), 0)::bigint * 60000000) / p_t else 0 end,
      coalesce(p_kills, 0)::bigint]
    else array[0::bigint, coalesce(p_t, 0)::bigint, coalesce(p_kills, 0)::bigint] end
$$;
-- can this run win a prize in its week? (Week 1 on: only runs of 3:00 or more.)
create or replace function public.sqs_ranked_placeable(p_week int, p_t int)
returns boolean language sql immutable set search_path = pg_catalog as $$
  select p_week < 1 or coalesce(p_t, 0) >= 180
$$;
create or replace function public.sqs_ranked_fee(p_paid numeric)
returns text language sql immutable set search_path = pg_catalog as $$
  select div(p_paid, 1000000000000000000)::text || case when mod(p_paid, 1000000000000000000) = 0 then ''
    else '.' || rtrim(lpad(mod(p_paid, 1000000000000000000)::text, 18, '0'), '0') end
$$;

-- can this wallet (from this connection) still enter this week? Checked before the player pays.
-- One wallet per connection covers both races; the entry cap counts each race on its own.
create or replace function public.sqs_ranked_can_enter(p_server_key text, p_wallet text, p_week int, p_ip_hash text, p_max int, p_mode text default 'normal')
returns json language plpgsql stable security definer set search_path = public as $$
declare used int;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if p_mode is null or p_mode not in ('normal', 'hard') or (p_mode = 'hard' and p_week < 1) then return json_build_object('error', 'no such race this week'); end if;
  if exists (select 1 from sqs_ranked_entries where week = p_week and ip_hash = p_ip_hash and wallet <> lower(p_wallet) and refund_reason is null) then
    return json_build_object('error', 'one wallet per player each week: this connection already entered with another wallet'); end if;
  select count(*) into used from sqs_ranked_entries where week = p_week and mode = p_mode and wallet = lower(p_wallet) and refund_reason is null;
  if used >= p_max then return json_build_object('error', format('you have used all %s %sranked entries this week', p_max, case when p_mode = 'hard' then 'Hard ' else '' end)); end if;
  return json_build_object('ok', true, 'left', p_max - used);
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
  insert into sqs_ranked_entries (week, wallet, tx, paid, ip_hash, seed, refund_reason, mode)
    values (p_week, p_wallet, p_tx, p_paid, p_ip_hash, p_seed, why, p_mode) returning id into new_id;
  if why is not null then return json_build_object('error', why || '. Your ' || sqs_ranked_fee(p_paid) || ' DMT will be sent back.', 'refund', true); end if;
  return json_build_object('ok', true, 'id', new_id, 'mode', p_mode, 'left', p_max - used - 1);
end $$;

-- a valid payment that cannot become an entry (it landed just before the weekly reset): written down as owed
create or replace function public.sqs_ranked_owe(p_server_key text, p_tx text, p_wallet text, p_week int, p_paid numeric, p_reason text, p_mode text default 'normal')
returns json language plpgsql security definer set search_path = public as $$
declare prev record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if lower(p_tx) !~ '^0x[0-9a-f]{64}$' or lower(p_wallet) !~ '^0x[0-9a-f]{40}$' or p_mode is null or p_mode not in ('normal', 'hard') then return json_build_object('error', 'bad entry'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_tx_' || lower(p_tx)));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || p_week));
  select * into prev from sqs_ranked_entries where tx = lower(p_tx);
  if found then
    if prev.wallet <> lower(p_wallet) or prev.refund_reason is null then
      return json_build_object('error', 'that payment was already used for an entry'); end if;
    return json_build_object('ok', true);
  end if;
  insert into sqs_ranked_entries (week, wallet, tx, paid, ip_hash, seed, refund_reason, mode)
    values (p_week, lower(p_wallet), lower(p_tx), p_paid, '', 0, left(p_reason, 120), p_mode);
  return json_build_object('ok', true);
end $$;

-- reveals the seed once and starts the clock
create or replace function public.sqs_ranked_start(p_server_key text, p_id bigint, p_wallet text, p_adv text)
returns json language plpgsql security definer set search_path = public as $$
declare e record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if p_adv !~ '^[a-z]{2,16}$' then return json_build_object('error', 'bad adventurer'); end if;
  update sqs_ranked_entries set started_at = now(), adv = p_adv
    where id = p_id and wallet = lower(p_wallet) and started_at is null and refund_reason is null
    returning seed, adv, started_at, mode into e;
  if not found then
    -- the same start again (its answer got lost): the same run, seed, adventurer and clock, as long as it was not sent
    select seed, adv, started_at, mode into e from sqs_ranked_entries
      where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null and refund_reason is null;
    if not found then return json_build_object('error', 'that entry was already used'); end if;
    return json_build_object('ok', true, 'seed', e.seed, 'adv', e.adv, 'mode', e.mode, 'started', (extract(epoch from e.started_at) * 1000)::bigint, 'again', true);
  end if;
  return json_build_object('ok', true, 'seed', e.seed, 'adv', e.adv, 'mode', e.mode, 'started', (extract(epoch from e.started_at) * 1000)::bigint);
end $$;

-- a run is replayed and counted once: the server claims it before checking it
create or replace function public.sqs_ranked_claim(p_server_key text, p_id bigint, p_wallet text)
returns json language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  update sqs_ranked_entries set claimed_at = now()
    where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null;
  get diagnostics n = row_count;
  if n = 0 then return json_build_object('error', 'that run was already sent'); end if;
  return json_build_object('ok', true);
end $$;

create or replace function public.sqs_ranked_finish(p_server_key text, p_id bigint, p_name text, p_t int, p_kills int, p_level int, p_won boolean, p_verdict text, p_log_sha text, p_log text)
returns json language plpgsql security definer set search_path = public as $$
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
  -- Only each wallet's best run can win. Retain the top ten per week and race for review.
  update sqs_ranked_entries set log = null where log is not null and (week < w - 1 or (week <= w and id not in (
    select id from (
      select id, row_number() over (partition by week, mode order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) as place from (
        select distinct on (week, mode, wallet) id, week, mode, wallet, won, t, kills, finished_at from sqs_ranked_entries
        where week between w - 1 and w and verdict = 'ok'
        order by week, mode, wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best) ranked
    where place <= 10)));
  return json_build_object('ok', true, 'rank', r);
end $$;

-- a started run that a game update cut off: no score, and the entry fee is owed back (the API checks the version changed)
create or replace function public.sqs_ranked_void(p_server_key text, p_id bigint, p_wallet text, p_reason text)
returns json language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  update sqs_ranked_entries set claimed_at = now(), finished_at = now(), verdict = 'void', refund_reason = left(p_reason, 120)
    where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null;
  get diagnostics n = row_count;
  if n = 0 then return json_build_object('error', 'that run was already sent'); end if;
  return json_build_object('ok', true);
end $$;

-- public: a race's paid entries that week and its standings (each wallet's best run, in the week's order)
create or replace function public.sqs_ranked_board(p_week int, p_mode text default 'normal')
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'mode', p_mode,
    'entries', (select count(*) from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'paid', (select coalesce(sum(paid), 0)::text from sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'rows', coalesce((select json_agg(x) from (
      select name, wallet, t, kills, level, won, adv, runs, (extract(epoch from finished_at) * 1000)::bigint as at from (
        select distinct on (wallet) *, count(*) over (partition by wallet) as runs from sqs_ranked_entries where week = p_week and mode = p_mode and verdict = 'ok' and refund_reason is null
        order by wallet, sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best
      order by sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc limit 25) x), '[]'::json))
$$;

-- for the weekly payout report (Radbro #652, reports key): totals, winners, refunds due, shared connections
create or replace function public.sqs_ranked_settle(p_key text, p_week int, p_mode text default 'normal')
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  return json_build_object(
    'week', p_week, 'mode', p_mode, 'rules', case when p_week >= 1 then 'kpm' else 'classic' end,
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

-- the stored input log of one run, for the replay viewer / review (reports key)
create or replace function public.sqs_ranked_log(p_key text, p_id bigint)
returns json language plpgsql stable security definer set search_path = public as $$
declare e record;
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  select id, week, mode, wallet, seed, adv, name, t, kills, level, won, log_sha, log into e from sqs_ranked_entries where id = p_id;
  return row_to_json(e);
end $$;

revoke all on function public.sqs_ranked_score(int, boolean, int, int) from public, anon, authenticated;
revoke all on function public.sqs_ranked_placeable(int, int) from public, anon, authenticated;
drop function if exists public.sqs_ranked_fee(text);
revoke all on function public.sqs_ranked_fee(numeric) from public, anon, authenticated;
revoke all on function public.sqs_ranked_can_enter(text, text, int, text, int, text) from public;
revoke all on function public.sqs_ranked_enter(text, text, text, int, text, numeric, bigint, int, text) from public;
revoke all on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) from public;
revoke all on function public.sqs_ranked_start(text, bigint, text, text) from public;
revoke all on function public.sqs_ranked_claim(text, bigint, text) from public;
revoke all on function public.sqs_ranked_finish(text, bigint, text, int, int, int, boolean, text, text, text) from public;
revoke all on function public.sqs_ranked_void(text, bigint, text, text) from public;
revoke all on function public.sqs_ranked_board(int, text) from public;
revoke all on function public.sqs_ranked_settle(text, int, text) from public;
revoke all on function public.sqs_ranked_log(text, bigint) from public;
grant execute on function public.sqs_ranked_can_enter(text, text, int, text, int, text) to anon;
grant execute on function public.sqs_ranked_enter(text, text, text, int, text, numeric, bigint, int, text) to anon;
grant execute on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) to anon;
grant execute on function public.sqs_ranked_start(text, bigint, text, text) to anon;
grant execute on function public.sqs_ranked_claim(text, bigint, text) to anon;
grant execute on function public.sqs_ranked_finish(text, bigint, text, int, int, int, boolean, text, text, text) to anon;
grant execute on function public.sqs_ranked_void(text, bigint, text, text) to anon;
grant execute on function public.sqs_ranked_board(int, text) to anon;
grant execute on function public.sqs_ranked_settle(text, int, text) to anon;
grant execute on function public.sqs_ranked_log(text, bigint) to anon;
-- PostgREST: see the new signatures now
notify pgrst, 'reload schema';
