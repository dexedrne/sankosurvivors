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

notify pgrst, 'reload schema';
commit;
