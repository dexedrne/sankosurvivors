-- SankoQuest Survivors, update 9: one best casual run per name, and restore the restart role boundary.
-- Paste into the Solscape Supabase SQL editor after update8.sql. Safe to paste again; no migration-time data deletion.
-- Casual names are unverified. Match case/outer spaces; keep each map and endless mode separate.

create or replace function public.sqs_casual_best(p_map text, p_endless boolean)
returns setof public.sqs_scores language sql stable set search_path = public as $$
  select distinct on (lower(btrim(name))) * from sqs_scores
  where map = p_map and endless = coalesce(p_endless, false)
  order by lower(btrim(name)), score desc, at asc, id asc
$$;
-- This helper includes private ticket columns. Only the owner-backed public functions may call it.
revoke all on function public.sqs_casual_best(text, boolean) from public, anon, authenticated;

create or replace function public.sqs_top(p_map text, p_endless boolean default false)
returns table (id bigint, name text, t int, kills int, level int, adv text, won boolean, hard boolean, holder boolean, at bigint)
language sql stable security definer set search_path = public as $$
  select id, name, t, kills, level, adv, won, hard, holder, (extract(epoch from at) * 1000)::bigint
  from sqs_casual_best(p_map, p_endless) order by score desc, at asc, id asc limit 25
$$;
revoke all on function public.sqs_top(text, boolean) from public, anon, authenticated;
grant execute on function public.sqs_top(text, boolean) to anon;

create or replace function public.sqs_submit_score(
  p_ip text, p_map text, p_name text, p_t int, p_kills int, p_level int,
  p_adv text, p_won boolean, p_hard boolean, p_ticket text, p_server_key text, p_holder boolean, p_endless boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare s bigint; r int; e boolean := coalesce(p_endless, false);
begin
  if sqs_key_ok('server_key_sha256', p_server_key) is not true then return json_build_object('error', 'forbidden'); end if;
  if p_map not in ('greentown','apache','duel','graves','swamp','goblins','paya','oasis','tutorial','world') then
    return json_build_object('error', 'bad map'); end if;
  p_name := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g')), 16);
  if p_name = '' or p_t is null or p_t <= 0 or p_t >= (case when e then 20000 else 4000 end) or p_kills < 0 or p_kills > p_t * 30
     or p_level < 1 or p_level >= 400 or (e and coalesce(p_won, false)) then
    return json_build_object('error', 'bad score'); end if;
  if p_adv is null or p_adv !~ '^[a-z]{2,16}$' then p_adv := 'adventurer'; end if;
  if not sqs_rate_ok(coalesce(p_ip, 'unknown'), 'score', 20) then
    return json_build_object('error', 'slow down'); end if;
  perform pg_advisory_xact_lock(hashtext('sqs_casual_' || p_map || '_' || e));
  if p_ticket is null or exists (select 1 from sqs_scores where ticket = p_ticket) then
    return json_build_object('error', 'bad ticket'); end if;
  s := (case when p_won and not e then 100000000000 else 0 end) + p_t::bigint * 1000000 + least(999999, p_kills);
  insert into sqs_scores (map, name, t, kills, level, adv, won, hard, score, ticket, holder, endless)
    values (p_map, p_name, p_t, p_kills, p_level, p_adv, coalesce(p_won, false) and not e, coalesce(p_hard, false), s, p_ticket, coalesce(p_holder, false), e);
  select place into r from (
    select name, row_number() over (order by score desc, at asc, id asc) as place
    from sqs_casual_best(p_map, e)) board where lower(btrim(name)) = lower(p_name);
  -- Keep 200 high scores plus each top-200 name's best, so repeated runs cannot evict other names (at most 400 rows).
  delete from sqs_scores where map = p_map and endless = e and id not in (
    (select id from sqs_scores where map = p_map and endless = e order by score desc, at asc, id asc limit 200)
    union
    (select id from sqs_casual_best(p_map, e) order by score desc, at asc, id asc limit 200));
  return json_build_object('ok', true, 'rank', r);
end $$;
revoke all on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean, boolean) to anon;

-- update8 recreated this signature under Supabase defaults, which also granted authenticated execute.
revoke all on function public.sqs_ranked_restart(text, bigint, text, bigint, text, bigint) from public, authenticated;

notify pgrst, 'reload schema';
