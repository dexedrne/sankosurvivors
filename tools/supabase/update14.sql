-- Update14 supersedes pending13: one atomic owner paste after update10.
-- Includes13 unchanged plus exact stored-payment refund amounts at any entry price.
-- Functions only: no keys, entries, saves or money records changed.
-- SankoSurvivors update 13: fail-closed key guard and pending updates 11/12.
-- Owner: paste this WHOLE file into the Solscape SQL editor after update10.
-- Includes the unchanged rate-limit and rollover-metadata repairs from updates12/11.
-- Re-runnable and atomic. Does not read/change keys, rows, saves, entries or money records.
-- No website deployment, wallet signature or payment is needed.
begin;
create or replace function public.sqs_key_ok(p_name text, p_key text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(p_key is not null and encode(sha256(convert_to(p_key, 'UTF8')), 'hex') in
    (select a.v from public.sqs_admin a where a.k = p_name or a.k = p_name || ':next'), false)
$$;
revoke all on function public.sqs_key_ok(text,text) from public,anon,authenticated;

create or replace function public.sqs_rate_ok(p_ip text, p_kind text, p_secs int)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  -- Check the locked conflicting row, including a concurrent first insert.
  insert into public.sqs_rate (ip, kind, at) values (p_ip, p_kind, now())
    on conflict (ip, kind) do update set at = excluded.at
    where (sqs_rate.at > excluded.at - make_interval(secs => p_secs)) is not true;
  return found;
end $$;
revoke all on function public.sqs_rate_ok(text,text,int) from public,anon,authenticated;

create or replace function public.sqs_ranked_board(p_week int, p_mode text default 'normal')
returns json language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select json_build_object(
    'mode', p_mode,
    'entries', (select count(*) from public.sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'paid', (select coalesce(sum(paid), 0)::text from public.sqs_ranked_entries where week = p_week and mode = p_mode and refund_reason is null),
    'incoming', case when p_week = case when p_mode = 'hard' then 1 else 0 end then '0'
      else (select rollover::text from public.sqs_ranked_payout_weeks where week = p_week - 1 and mode = p_mode) end,
    'incoming_ready', p_week = case when p_mode = 'hard' then 1 else 0 end
      or exists(select 1 from public.sqs_ranked_payout_weeks where week = p_week - 1 and mode = p_mode),
    'rows', coalesce((select json_agg(x) from (
      select name, wallet, t, kills, level, won, adv, (extract(epoch from finished_at) * 1000)::bigint as at from (
        select distinct on (wallet) * from public.sqs_ranked_entries where week = p_week and mode = p_mode and verdict = 'ok' and refund_reason is null
        order by wallet, public.sqs_ranked_score(week, won, t, kills) desc, finished_at asc, id asc) best
      order by public.sqs_ranked_score(p_week, won, t, kills) desc, finished_at asc, id asc limit 25) x), '[]'::json))
$$;
-- This existing public board intentionally exposes only board rows and aggregate pool metadata.
revoke all on function public.sqs_ranked_board(int,text) from public, authenticated;
grant execute on function public.sqs_ranked_board(int,text) to anon;

create or replace function public.sqs_ranked_fee(p_paid numeric)
returns text language sql immutable set search_path = pg_catalog as $$
  select div(p_paid, 1000000000000000000)::text || case when mod(p_paid, 1000000000000000000) = 0 then ''
    else '.' || rtrim(lpad(mod(p_paid, 1000000000000000000)::text, 18, '0'), '0') end
$$;

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

drop function if exists public.sqs_ranked_fee(text);
revoke all on function public.sqs_ranked_fee(numeric) from public, anon, authenticated;
revoke all on function public.sqs_ranked_enter(text,text,text,int,text,numeric,bigint,int,text) from public, authenticated;
grant execute on function public.sqs_ranked_enter(text,text,text,int,text,numeric,bigint,int,text) to anon;
notify pgrst, 'reload schema';
commit;
