-- SankoQuest Survivors, update 8 (3 Nov 2026): security pass 3. Paste the whole file into the Supabase SQL editor for the
-- Solscape project and press Run. Safe to run again. Needs update6.sql and update7.sql first (both are live). Paste this
-- before deploying the API that calls sqs_ranked_restart with p_started; the API that is live now keeps working after it.
--
-- A. A ranked restart (a run cut off by a game update) only restarts the entry's current run: an old token can no longer
--    re-roll a newer run of the same entry. Nothing refunds a run any more, so the API cannot call sqs_ranked_void.
-- B. A payment over 100 DMT is recorded and its refund is held for the owner, instead of being dropped (it used to be
--    refused, so it was never written down). sqs_ranked_owe says review: true for it.
-- C. Cloud saves: a smaller size check, and a ceiling on the table's disk size (not a row count) for new wallets.
--
-- To release a held refund after checking the payment on Arbiscan (the payout runner checks it on chain again before
-- sending):  update sqs_ranked_payouts set status = 'planned' where id = <row> and kind = 'refund' and status = 'held';

-- A ------------------------------------------------------------------------------------------------------------------
drop function if exists public.sqs_ranked_restart(text, bigint, text, bigint, text); -- update7's, without p_started
create or replace function public.sqs_ranked_restart(p_server_key text, p_id bigint, p_wallet text, p_seed bigint, p_reason text, p_started bigint default null)
returns json language plpgsql security definer set search_path = public as $$
declare n int; e record;
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if p_seed is null or p_seed < 1 or p_seed > 2147483646 then return json_build_object('error', 'bad seed'); end if;
  select week, mode, restarts into e from sqs_ranked_entries where id = p_id and wallet = lower(p_wallet);
  if not found then return json_build_object('error', 'that run was already sent'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || e.week)); -- the lock the weekly plan takes
  if exists (select 1 from sqs_ranked_payout_weeks w where w.week = e.week and w.mode = e.mode)
     or now() >= '2026-11-02T00:00:00Z'::timestamptz + (e.week + 1) * interval '7 days' then
    return json_build_object('error', 'that week is over: the run can no longer be restarted'); end if;
  if e.restarts >= 3 then return json_build_object('error', 'this entry was restarted 3 times already: tell the dev'); end if;
  -- p_started is the run token's start (the `started` sqs_ranked_start returned): only that run of the entry restarts
  update sqs_ranked_entries set started_at = null, seed = p_seed, restarts = restarts + 1
    where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null and refund_reason is null
      and (p_started is null or (extract(epoch from started_at) * 1000)::bigint = p_started);
  get diagnostics n = row_count;
  if n = 0 then return json_build_object('error', 'that run was already sent'); end if;
  return json_build_object('ok', true, 'week', e.week, 'mode', e.mode);
end $$;
revoke all on function public.sqs_ranked_restart(text, bigint, text, bigint, text, bigint) from public, authenticated;
grant execute on function public.sqs_ranked_restart(text, bigint, text, bigint, text, bigint) to anon;
-- no code path refunds a run any more (update 7 restarts it instead)
revoke execute on function public.sqs_ranked_void(text, bigint, text, text) from public, anon, authenticated;

-- B ------------------------------------------------------------------------------------------------------------------
create or replace function public.sqs_ranked_owe(p_server_key text, p_tx text, p_wallet text, p_week int, p_paid numeric, p_reason text, p_mode text default 'normal')
returns json language plpgsql security definer set search_path = public as $$
declare prev record; cur int := floor(extract(epoch from now() - '2026-11-02T00:00:00Z'::timestamptz) / 604800);
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if lower(p_tx) !~ '^0x[0-9a-f]{64}$' or lower(p_wallet) !~ '^0x[0-9a-f]{40}$' or p_mode is null or p_mode not in ('normal', 'hard') then return json_build_object('error', 'bad entry'); end if;
  -- a real payment: a whole number of base units, more than nothing, this week or the last. Over 100 DMT it is recorded
  -- for review: sqs_payout_refunds holds its refund until the owner releases it.
  if p_paid is null or p_paid <= 0 or p_paid <> trunc(p_paid) or p_paid >= power(2::numeric, 256) or p_week is null or p_week < 0 or p_week > cur or p_week < cur - 1 then
    return json_build_object('error', 'bad entry'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_tx_' || lower(p_tx)));
  perform pg_advisory_xact_lock(hashtext('sqs_ranked_' || p_week));
  select * into prev from sqs_ranked_entries where tx = lower(p_tx);
  if found then
    if prev.wallet <> lower(p_wallet) or prev.refund_reason is null then
      return json_build_object('error', 'that payment was already used for an entry'); end if;
    return json_build_object('ok', true, 'review', p_paid > 100000000000000000000);
  end if;
  insert into sqs_ranked_entries (week, wallet, tx, paid, ip_hash, seed, refund_reason, mode)
    values (p_week, lower(p_wallet), lower(p_tx), p_paid, '', 0, left(p_reason, 120), p_mode);
  return json_build_object('ok', true, 'review', p_paid > 100000000000000000000);
end $$;
revoke all on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) from public;
grant execute on function public.sqs_ranked_owe(text, text, text, int, numeric, text, text) to anon;

create or replace function public.sqs_payout_refunds(p_key text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
declare n int;
begin
  if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  -- a refund of more than 100 DMT waits for the owner (status 'held'); the rest are paid by the next payout run
  insert into sqs_ranked_payouts(week,mode,kind,wallet,amount,source_entry_id,status)
    select week,mode,'refund',wallet,paid,id,case when paid > 100000000000000000000 then 'held' else 'planned' end from sqs_ranked_entries where refund_reason is not null
    on conflict(source_entry_id) do nothing;
  get diagnostics n=row_count;
  return jsonb_build_object('ok',true,'added',n);
end $$;
revoke all on function public.sqs_payout_refunds(text) from public, anon, authenticated;
grant execute on function public.sqs_payout_refunds(text) to anon;

-- C ------------------------------------------------------------------------------------------------------------------
create or replace function public.sqs_save_put(p_server_key text, p_wallet text, p_data jsonb, p_rev int, p_ip text default null)
returns json language plpgsql security definer set search_path = public as $$
declare s sqs_saves; w text := lower(coalesce(p_wallet, ''));
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if w !~ '^0x[0-9a-f]{40}$' or p_data is null or jsonb_typeof(p_data) <> 'object' or p_rev is null or p_rev < 0 then
    return json_build_object('error', 'bad save'); end if;
  -- the game server sends at most 24000 characters of values (tools/vercel-api/cloud.js); the largest honest save is ~8 KB
  if octet_length(p_data::text) > 24000 then return json_build_object('error', 'that save is too big'); end if;
  if not sqs_rate_ok(w, 'save', 2) then return json_build_object('error', 'slow down'); end if;
  select * into s from sqs_saves where wallet = w for update;
  if not found then
    if p_rev <> 0 then return json_build_object('conflict', true, 'rev', 0); end if;
    -- a new wallet: one every 10 minutes from one IP (the game server passes a hash of it), and a ceiling on the table's
    -- size on disk (1 GB, far below the database's read-only line); wallets that already have a save keep saving
    if p_ip is not null and not sqs_rate_ok('new:' || left(p_ip, 64), 'save', 600) then return json_build_object('error', 'slow down'); end if;
    if pg_total_relation_size('public.sqs_saves') > 1000000000 or (select count(*) from sqs_saves) >= 100000 then return json_build_object('error', 'cloud saves are full'); end if;
    insert into sqs_saves (wallet, data, rev) values (w, p_data, 1) on conflict (wallet) do nothing;
    if found then return json_build_object('ok', true, 'rev', 1); end if;
    select * into s from sqs_saves where wallet = w; -- another device saved first, this very moment
  end if;
  if s.rev <> p_rev then
    return json_build_object('conflict', true, 'rev', s.rev, 'data', s.data, 'at', (extract(epoch from s.updated_at) * 1000)::bigint); end if;
  -- past the ceiling an existing save may keep saving, but not grow (many tiny saves grown later would get round the ceiling)
  if octet_length(p_data::text) > octet_length(s.data::text) and pg_total_relation_size('public.sqs_saves') > 1000000000 then
    return json_build_object('error', 'cloud saves are full'); end if;
  update sqs_saves set data = p_data, rev = s.rev + 1, updated_at = now() where wallet = w;
  return json_build_object('ok', true, 'rev', s.rev + 1);
end $$;
revoke all on function public.sqs_save_put(text, text, jsonb, int, text) from public;
grant execute on function public.sqs_save_put(text, text, jsonb, int, text) to anon;

notify pgrst, 'reload schema';
