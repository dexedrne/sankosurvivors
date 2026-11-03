-- SankoQuest Survivors, update 4 (3 Nov 2026): cloud saves on a wallet (tools/vercel-api/cloud.js).
-- Paste the whole file into the Supabase SQL editor and run it. Safe to run again.

-- one save per wallet: a snapshot of the game's progress keys, with a revision that goes up by one on every save
create table if not exists public.sqs_saves (
  wallet text primary key check (wallet ~ '^0x[0-9a-f]{40}$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  rev int not null check (rev >= 1),
  updated_at timestamptz not null default now());
alter table public.sqs_saves enable row level security;
revoke all on public.sqs_saves from public, anon, authenticated;

create or replace function public.sqs_save_get(p_server_key text, p_wallet text)
returns json language plpgsql stable security definer set search_path = public as $$
declare s sqs_saves;
begin
  if not sqs_key_ok('server_key_sha256', p_server_key) then return json_build_object('error', 'forbidden'); end if;
  select * into s from sqs_saves where wallet = lower(coalesce(p_wallet, ''));
  if not found then return json_build_object('rev', 0); end if;
  return json_build_object('rev', s.rev, 'data', s.data, 'at', (extract(epoch from s.updated_at) * 1000)::bigint);
end $$;

-- saves only on top of the revision the device last saw; otherwise hands back the newer save (a conflict)
create or replace function public.sqs_save_put(p_server_key text, p_wallet text, p_data jsonb, p_rev int)
returns json language plpgsql security definer set search_path = public as $$
declare s sqs_saves; w text := lower(coalesce(p_wallet, ''));
begin
  if not sqs_key_ok('server_key_sha256', p_server_key) then return json_build_object('error', 'forbidden'); end if;
  if w !~ '^0x[0-9a-f]{40}$' or p_data is null or jsonb_typeof(p_data) <> 'object' or p_rev is null or p_rev < 0 then
    return json_build_object('error', 'bad save'); end if;
  if octet_length(p_data::text) > 120000 then return json_build_object('error', 'that save is too big'); end if;
  if not sqs_rate_ok(w, 'save', 2) then return json_build_object('error', 'slow down'); end if;
  select * into s from sqs_saves where wallet = w for update;
  if not found then
    if p_rev <> 0 then return json_build_object('conflict', true, 'rev', 0); end if;
    insert into sqs_saves (wallet, data, rev) values (w, p_data, 1) on conflict (wallet) do nothing;
    if found then return json_build_object('ok', true, 'rev', 1); end if;
    select * into s from sqs_saves where wallet = w; -- another device saved first, this very moment
  end if;
  if s.rev <> p_rev then
    return json_build_object('conflict', true, 'rev', s.rev, 'data', s.data, 'at', (extract(epoch from s.updated_at) * 1000)::bigint); end if;
  update sqs_saves set data = p_data, rev = s.rev + 1, updated_at = now() where wallet = w;
  return json_build_object('ok', true, 'rev', s.rev + 1);
end $$;

revoke all on function public.sqs_save_get(text, text) from public;
revoke all on function public.sqs_save_put(text, text, jsonb, int) from public;
grant execute on function public.sqs_save_get(text, text) to anon;
grant execute on function public.sqs_save_put(text, text, jsonb, int) to anon;
notify pgrst, 'reload schema';
