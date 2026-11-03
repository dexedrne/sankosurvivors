-- SankoQuest Survivors, update 3 (2 Nov 2026): the Hidden Oasis map and endless leaderboards.
-- Paste the whole file into the Supabase SQL editor and run it. Safe to run again.

-- casual runs remember whether they were endless; endless runs get their own boards (ranked by time survived, then kills)
alter table public.sqs_scores add column if not exists endless boolean not null default false;
create index if not exists sqs_scores_board on public.sqs_scores (map, endless, score desc);

drop function if exists public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean);
drop function if exists public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean, boolean);
create or replace function public.sqs_submit_score(
  p_ip text, p_map text, p_name text, p_t int, p_kills int, p_level int,
  p_adv text, p_won boolean, p_hard boolean, p_ticket text, p_server_key text, p_holder boolean, p_endless boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare s bigint; r int; e boolean := coalesce(p_endless, false);
begin
  if not sqs_key_ok('server_key_sha256', p_server_key) then return json_build_object('error', 'forbidden'); end if;
  if p_map not in ('greentown','apache','duel','graves','swamp','goblins','paya','oasis','tutorial','world') then
    return json_build_object('error', 'bad map'); end if;
  p_name := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g')), 16);
  if p_name = '' or p_t is null or p_t <= 0 or p_t >= (case when e then 20000 else 4000 end) or p_kills < 0 or p_kills > p_t * 30
     or p_level < 1 or p_level >= 400 or (e and coalesce(p_won, false)) then
    return json_build_object('error', 'bad score'); end if;
  if p_adv is null or p_adv !~ '^[a-z]{2,16}$' then p_adv := 'adventurer'; end if;
  if not sqs_rate_ok(coalesce(p_ip, 'unknown'), 'score', 20) then
    return json_build_object('error', 'slow down'); end if;
  if p_ticket is null or exists (select 1 from sqs_scores where ticket = p_ticket) then
    return json_build_object('error', 'bad ticket'); end if;
  s := (case when p_won and not e then 10000000 else 0 end) + p_t::bigint * 1000 + least(999, p_kills);
  insert into sqs_scores (map, name, t, kills, level, adv, won, hard, score, ticket, holder, endless)
    values (p_map, p_name, p_t, p_kills, p_level, p_adv, coalesce(p_won, false) and not e, coalesce(p_hard, false), s, p_ticket, coalesce(p_holder, false), e);
  select count(*) + 1 into r from sqs_scores where map = p_map and endless = e and score > s;
  delete from sqs_scores where map = p_map and endless = e and id in (
    select id from sqs_scores where map = p_map and endless = e order by score desc, at asc offset 200);
  return json_build_object('ok', true, 'rank', r);
end $$;

drop function if exists public.sqs_top(text);
drop function if exists public.sqs_top(text, boolean);
create or replace function public.sqs_top(p_map text, p_endless boolean default false)
returns table (id bigint, name text, t int, kills int, level int, adv text, won boolean, hard boolean, holder boolean, at bigint)
language sql stable security definer set search_path = public as $$
  select id, name, t, kills, level, adv, won, hard, holder, (extract(epoch from at) * 1000)::bigint
  from sqs_scores where map = p_map and endless = coalesce(p_endless, false) order by score desc, at asc limit 25
$$;

revoke all on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean, boolean) from public;
revoke all on function public.sqs_top(text, boolean) from public;
