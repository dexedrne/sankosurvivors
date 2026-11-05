-- SankoQuest Survivors leaderboard + bug reports.
-- Tables are locked (RLS on, no policies, no grants); the game's API function calls the
-- three SECURITY DEFINER functions below with the publishable key. They validate input
-- and rate-limit by client IP.

create table if not exists public.sqs_scores (
  id bigint generated always as identity primary key,
  map text not null,
  name text not null,
  t int not null,
  kills int not null,
  level int not null,
  adv text not null,
  won boolean not null default false,
  hard boolean not null default false,
  score bigint not null,
  ticket text unique,           -- each run ticket counts once
  at timestamptz not null default now()
);
create index if not exists sqs_scores_map_score on public.sqs_scores (map, score desc);

create table if not exists public.sqs_reports (
  id bigint generated always as identity primary key,
  text text not null,
  map text, adv text, v text, ua text,
  settings jsonb, errors jsonb,
  at timestamptz not null default now()
);

create table if not exists public.sqs_rate (
  ip text not null,
  kind text not null,
  at timestamptz not null default now(),
  primary key (ip, kind)
);

alter table public.sqs_scores enable row level security;
alter table public.sqs_reports enable row level security;
alter table public.sqs_rate enable row level security;
revoke all on public.sqs_scores, public.sqs_reports, public.sqs_rate from anon, authenticated;

-- keys: only their sha256 lives here. The game server holds the server key (scores and reports can only be saved
-- through it); the Radbro agent on the owner's laptop holds the reports key (to read bug reports).
create table if not exists public.sqs_admin (k text primary key, v text not null);
alter table public.sqs_admin enable row level security;
revoke all on public.sqs_admin from anon, authenticated;
insert into public.sqs_admin (k, v) values ('server_key_sha256', '<sha256 of SQS_SERVER_KEY>'), ('reports_key_sha256', '<sha256 of the Radbro reports key>')
  on conflict (k) do nothing;

create or replace function public.sqs_key_ok(p_name text, p_key text)
returns boolean language sql stable security definer set search_path = pg_catalog, public, pg_temp as $$
  select coalesce(p_key is not null and encode(sha256(convert_to(p_key, 'UTF8')), 'hex') in
    (select a.v from public.sqs_admin a where a.k = p_name or a.k = p_name || ':next'), false)
$$;

-- one action per kind per ip per window; returns false when too soon
create or replace function public.sqs_rate_ok(p_ip text, p_kind text, p_secs int)
returns boolean language plpgsql security definer set search_path = pg_catalog, public, pg_temp as $$
begin
  -- Check the locked conflicting row, including a concurrent first insert.
  insert into public.sqs_rate (ip, kind, at) values (p_ip, p_kind, now())
    on conflict (ip, kind) do update set at = excluded.at
    where (sqs_rate.at > excluded.at - make_interval(secs => p_secs)) is not true;
  return found;
end $$;

create or replace function public.sqs_top(p_map text)
returns table (name text, t int, kills int, level int, adv text, won boolean, hard boolean, at bigint)
language sql stable security definer set search_path = public as $$
  select name, t, kills, level, adv, won, hard, (extract(epoch from at) * 1000)::bigint
  from sqs_scores where map = p_map order by score desc, at asc limit 25
$$;

create or replace function public.sqs_submit_score(
  p_ip text, p_map text, p_name text, p_t int, p_kills int, p_level int,
  p_adv text, p_won boolean, p_hard boolean, p_ticket text, p_server_key text)
returns json language plpgsql security definer set search_path = public as $$
declare s bigint; r int;
begin
  if not sqs_key_ok('server_key_sha256', p_server_key) then return json_build_object('error', 'forbidden'); end if;
  if p_map not in ('greentown','apache','duel','graves','swamp','goblins','paya','tutorial','world') then
    return json_build_object('error', 'bad map'); end if;
  p_name := left(btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]<>]', '', 'g')), 16);
  if p_name = '' or p_t is null or p_t <= 0 or p_t >= 4000 or p_kills < 0 or p_kills > p_t * 30
     or p_level < 1 or p_level >= 200 then
    return json_build_object('error', 'bad score'); end if;
  if p_adv is null or p_adv !~ '^[a-z]{2,16}$' then p_adv := 'adventurer'; end if;
  if not sqs_rate_ok(coalesce(p_ip, 'unknown'), 'score', 20) then
    return json_build_object('error', 'slow down'); end if;
  if p_ticket is null or exists (select 1 from sqs_scores where ticket = p_ticket) then
    return json_build_object('error', 'bad ticket'); end if;
  s := (case when p_won then 10000000 else 0 end) + p_t::bigint * 1000 + least(999, p_kills);
  insert into sqs_scores (map, name, t, kills, level, adv, won, hard, score, ticket)
    values (p_map, p_name, p_t, p_kills, p_level, p_adv, coalesce(p_won, false), coalesce(p_hard, false), s, p_ticket);
  select count(*) + 1 into r from sqs_scores where map = p_map and score > s;
  -- keep the 200 best per map
  delete from sqs_scores where map = p_map and id in (
    select id from sqs_scores where map = p_map order by score desc, at asc offset 200);
  return json_build_object('ok', true, 'rank', r);
end $$;

create or replace function public.sqs_submit_report(p_ip text, p_report jsonb, p_server_key text)
returns json language plpgsql security definer set search_path = public as $$
declare txt text;
begin
  if not sqs_key_ok('server_key_sha256', p_server_key) then return json_build_object('error', 'forbidden'); end if;
  txt := left(btrim(coalesce(p_report->>'text', '')), 2000);
  if length(txt) < 3 then return json_build_object('error', 'empty report'); end if;
  if not sqs_rate_ok(coalesce(p_ip, 'unknown'), 'report', 60) then
    return json_build_object('error', 'slow down'); end if;
  insert into sqs_reports (text, map, adv, v, ua, settings, errors) values (
    txt, left(p_report->>'map', 20), left(p_report->>'adv', 20), left(p_report->>'v', 10),
    left(p_report->>'ua', 200),
    case when jsonb_typeof(p_report->'settings') = 'object' then p_report->'settings' end,
    case when jsonb_typeof(p_report->'errors') = 'array' then p_report->'errors' end);
  delete from sqs_reports where id in (select id from sqs_reports order by at desc offset 2000);
  return json_build_object('ok', true);
end $$;

-- bug reports for the Radbro agent (needs the reports key)
create or replace function public.sqs_reports_since(p_key text, p_after bigint)
returns table (id bigint, text text, map text, adv text, v text, ua text, errors jsonb, at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not sqs_key_ok('reports_key_sha256', p_key) then return; end if;
  return query select r.id, r.text, r.map, r.adv, r.v, r.ua, r.errors, r.at from sqs_reports r where r.id > coalesce(p_after, 0) order by r.id limit 50;
end $$;

revoke all on function public.sqs_key_ok(text, text) from public, anon, authenticated;
revoke all on function public.sqs_rate_ok(text, text, int) from public, anon, authenticated;
revoke all on function public.sqs_top(text) from public;
revoke all on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text) from public;
revoke all on function public.sqs_submit_report(text, jsonb, text) from public;
revoke all on function public.sqs_reports_since(text, bigint) from public;
grant execute on function public.sqs_top(text) to anon;
grant execute on function public.sqs_submit_score(text, text, text, int, int, int, text, boolean, boolean, text, text) to anon;
grant execute on function public.sqs_submit_report(text, jsonb, text) to anon;
grant execute on function public.sqs_reports_since(text, bigint) to anon;
