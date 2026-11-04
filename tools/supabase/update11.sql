-- SankoSurvivors update 11: public same-race rollover metadata, read-only.
-- Owner: paste this WHOLE file in the Solscape SQL editor after update10.
-- Re-runnable. Preserves entries, scores, keys, plans and transfer history. No payments or payouts.
begin;
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
commit;
