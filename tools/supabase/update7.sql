-- SankoQuest Survivors, update 7 (3 Nov 2026): a ranked run cut short by a game update starts again instead of being refunded.
-- Paste the whole file into the Supabase SQL editor for the Solscape project and press Run. Safe to run again.
--
-- A refund for "the game changed during your run" could be gamed: keep playing the old tab, and only claim the refund when the
-- run went badly (security pass). Now the same entry is simply set up to start again, with a new seed, on the new version: an
-- honest player loses nothing, and there is no money to win back. At most 3 restarts an entry, only in its own week.

alter table public.sqs_ranked_entries add column if not exists restarts int not null default 0;

create or replace function public.sqs_ranked_restart(p_server_key text, p_id bigint, p_wallet text, p_seed bigint, p_reason text)
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
  update sqs_ranked_entries set started_at = null, seed = p_seed, restarts = restarts + 1
    where id = p_id and wallet = lower(p_wallet) and started_at is not null and claimed_at is null and refund_reason is null;
  get diagnostics n = row_count;
  if n = 0 then return json_build_object('error', 'that run was already sent'); end if;
  return json_build_object('ok', true, 'week', e.week, 'mode', e.mode);
end $$;
revoke all on function public.sqs_ranked_restart(text, bigint, text, bigint, text) from public;
grant execute on function public.sqs_ranked_restart(text, bigint, text, bigint, text) to anon;

-- how many ranked runs are being played right now (started, not sent, within the time a run could still be sent: its
-- 2:00:00 limit + 1 minute + 40 minutes of pauses and reloads). tools/deploy.sh queues a build that changes the ranked game
-- until this is 0 (owner 3 Nov: "updates should be queued for when nobody is on a ranked run"). Reports key.
create or replace function public.sqs_ranked_active(p_key text)
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if sqs_key_ok('reports_key_sha256', p_key) is not true then return json_build_object('error', 'forbidden'); end if;
  return json_build_object('active', (select count(*) from sqs_ranked_entries
    where started_at is not null and claimed_at is null and refund_reason is null and started_at > now() - interval '9660 seconds'));
end $$;
revoke all on function public.sqs_ranked_active(text) from public;
grant execute on function public.sqs_ranked_active(text) to anon;

notify pgrst, 'reload schema';
