-- SankoQuest Survivors, update 5 (3 Nov 2026): casual leaderboards count every kill.
-- Paste the whole file into the Supabase SQL editor for the Solscape project and press Run. Safe to run again.
--
-- A run's score counted at most 999 kills, from when runs ended with a few hundred. Runs now reach thousands, so every full
-- 15:00 run on a map scored the same and the board fell back to the oldest first, while the end screen said "#1" (a player:
-- "It's say I'm number one / But in LB I'm number 4"). Now: a win first, then time survived, then every kill. The end screen's
-- place counts runs tied with yours as ahead of you, as the board lists them.
-- (The editor warns about an UPDATE without WHERE: that is the rescoring of the existing runs, which changes only the score column.)

-- every run already on the boards, rescored the new way
update public.sqs_scores set score = (case when won and not endless then 100000000000 else 0 end) + t::bigint * 1000000 + least(999999, kills);

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
  -- a win, then seconds survived (under 20,000), then kills (at most 30 a second, so under 600,000)
  s := (case when p_won and not e then 100000000000 else 0 end) + p_t::bigint * 1000000 + least(999999, p_kills);
  insert into sqs_scores (map, name, t, kills, level, adv, won, hard, score, ticket, holder, endless)
    values (p_map, p_name, p_t, p_kills, p_level, p_adv, coalesce(p_won, false) and not e, coalesce(p_hard, false), s, p_ticket, coalesce(p_holder, false), e);
  -- the place the board shows it at: it lists by score, older runs first when tied (this count includes the new run itself)
  select count(*) into r from sqs_scores where map = p_map and endless = e and score >= s;
  delete from sqs_scores where map = p_map and endless = e and id in (
    select id from sqs_scores where map = p_map and endless = e order by score desc, at asc offset 200);
  return json_build_object('ok', true, 'rank', r);
end $$;

revoke all on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text, boolean, boolean) from public;
