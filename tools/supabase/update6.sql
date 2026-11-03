-- SankoQuest Survivors, update 6 (3 Nov 2026): security pass. Paste the whole file into the Supabase SQL editor for the
-- Solscape project and press Run. Safe to run again. Nothing here changes what honest players see.
--
-- 1. A key check that fails closed: with a key's row missing, every guarded function used to open to anyone.
-- 2. A refund owed (a payment that could not become an entry) must be a real amount for a week that has started.
-- 3. A run can no longer be voided (refunded) once its week is over or settled: its fee is already in that week's prizes.
-- 4. Cloud saves: smaller, and a limit on how many new wallets one IP can save, so the shared database cannot be filled.

-- 1 ------------------------------------------------------------------------------------------------------------------
create or replace function public.sqs_key_ok(p_name text, p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(p_key is not null and encode(sha256(convert_to(p_key, 'UTF8')), 'hex') = (select a.v from sqs_admin a where a.k = p_name), false)
$$;
revoke all on function public.sqs_key_ok(text, text) from public, anon, authenticated;

-- 2 ------------------------------------------------------------------------------------------------------------------
create or replace function public.sqs_ranked_owe(p_server_key text, p_tx text, p_wallet text, p_week int, p_paid numeric, p_reason text, p_mode text default 'normal')
returns json language plpgsql security definer set search_path = public as $$
declare prev record; cur int := floor(extract(epoch from now() - '2026-11-02T00:00:00Z'::timestamptz) / 604800);
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if lower(p_tx) !~ '^0x[0-9a-f]{64}$' or lower(p_wallet) !~ '^0x[0-9a-f]{40}$' or p_mode is null or p_mode not in ('normal', 'hard') then return json_build_object('error', 'bad entry'); end if;
  -- a real payment: more than nothing, at most 100 DMT (more is held for the owner by the payout runner), this week or the last
  if p_paid is null or p_paid <= 0 or p_paid > 100000000000000000000 or p_week is null or p_week < 0 or p_week > cur or p_week < cur - 1 then
    return json_build_object('error', 'bad entry'); end if;
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
revoke all on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) from public;
grant execute on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) to anon;

-- 3 ------------------------------------------------------------------------------------------------------------------
create or replace function public.sqs_ranked_void(p_server_key text, p_id bigint, p_wallet text, p_reason text)
returns json language plpgsql security definer set search_path = public as $$
declare n int; e record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  select week, mode into e from sqs_ranked_entries where id = p_id;
  if not found then return json_build_object('error', 'that run was already sent'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || e.week)); -- the lock the weekly plan takes
  if exists (select 1 from sqs_ranked_payout_weeks w where w.week = e.week and w.mode = e.mode)
     or now() >= '2026-11-02T00:00:00Z'::timestamptz + (e.week + 1) * interval '7 days' + interval '180 minutes' then
    return json_build_object('error', 'that week is over: the run can no longer be refunded'); end if;
  update sqs_ranked_entries set claimed_at = now(), finished_at = now(), verdict = 'void', refund_reason = left(p_reason, 120)
    where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null;
  get diagnostics n = row_count;
  if n = 0 then return json_build_object('error', 'that run was already sent'); end if;
  return json_build_object('ok', true);
end $$;
revoke all on function public.sqs_ranked_void(text, bigint, text, text) from public;
grant execute on function public.sqs_ranked_void(text, bigint, text, text) to anon;

-- 4 ------------------------------------------------------------------------------------------------------------------
drop function if exists public.sqs_save_put(text, text, jsonb, int);
create or replace function public.sqs_save_put(p_server_key text, p_wallet text, p_data jsonb, p_rev int, p_ip text default null)
returns json language plpgsql security definer set search_path = public as $$
declare s sqs_saves; w text := lower(coalesce(p_wallet, ''));
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if w !~ '^0x[0-9a-f]{40}$' or p_data is null or jsonb_typeof(p_data) <> 'object' or p_rev is null or p_rev < 0 then
    return json_build_object('error', 'bad save'); end if;
  if octet_length(p_data::text) > 40000 then return json_build_object('error', 'that save is too big'); end if;
  if not sqs_rate_ok(w, 'save', 2) then return json_build_object('error', 'slow down'); end if;
  select * into s from sqs_saves where wallet = w for update;
  if not found then
    if p_rev <> 0 then return json_build_object('conflict', true, 'rev', 0); end if;
    -- a new wallet: one every 10 minutes from one IP (the game server passes a hash of it), and a ceiling for the table
    if p_ip is not null and not sqs_rate_ok('new:' || left(p_ip, 64), 'save', 600) then return json_build_object('error', 'slow down'); end if;
    if (select count(*) from sqs_saves) >= 200000 then return json_build_object('error', 'cloud saves are full'); end if;
    insert into sqs_saves (wallet, data, rev) values (w, p_data, 1) on conflict (wallet) do nothing;
    if found then return json_build_object('ok', true, 'rev', 1); end if;
    select * into s from sqs_saves where wallet = w; -- another device saved first, this very moment
  end if;
  if s.rev <> p_rev then
    return json_build_object('conflict', true, 'rev', s.rev, 'data', s.data, 'at', (extract(epoch from s.updated_at) * 1000)::bigint); end if;
  update sqs_saves set data = p_data, rev = s.rev + 1, updated_at = now() where wallet = w;
  return json_build_object('ok', true, 'rev', s.rev + 1);
end $$;
revoke all on function public.sqs_save_put(text, text, jsonb, int, text) from public;
grant execute on function public.sqs_save_put(text, text, jsonb, int, text) to anon;

-- 5 ------------------------------------------------------------------------------------------------------------------
-- each refund row carries the payment it repays, so the payout bot checks that payment on chain before sending anything
create or replace function public.sqs_payout_read(p_key text, p_week int default null)
returns jsonb language plpgsql stable security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  return jsonb_build_object(
    'weeks',coalesce((select jsonb_agg(to_jsonb(w) || jsonb_build_object('paid',paid::text,'house',house::text,'pool',pool::text,'incoming',incoming::text,'rollover',rollover::text) order by week,mode desc) from sqs_ranked_payout_weeks w where p_week is null or week=p_week),'[]'),
    'rows',coalesce((select jsonb_agg(to_jsonb(p) || jsonb_build_object('id',id::text,'amount',amount::text,'nonce',nonce::text,'scan_block',scan_block::text,'source_entry_id',source_entry_id::text,
      'source_tx',(select e.tx from sqs_ranked_entries e where e.id = p.source_entry_id)) order by week,id) from sqs_ranked_payouts p where p_week is null or week=p_week),'[]'),
    'holds',coalesce((select jsonb_agg(h) from sqs_ranked_holds h where p_week is null or week=p_week),'[]'));
end $$;

notify pgrst, 'reload schema';
