-- Update22: OWNER PASTE WHOLE FILE AFTER21. Private retained build statistics.
-- Does not change boards, reward policy, old replay archives, balances or wallet jobs.
begin;
create or replace function public.sqs_run_stats_valid(d jsonb)
returns boolean language plpgsql immutable set search_path=pg_catalog,public,pg_temp as $$
declare s jsonb; maps jsonb[]; caps int[]; mins int[]; i int; kv record; field text;
begin
 if jsonb_typeof(d) is distinct from 'object' or length(d::text)>16384 then return false; end if;
 if not(d?&array['kind','map','adv','hard','endless','t','kills','level','won','build','sim','week','stats']) or (select count(*) from jsonb_object_keys(d))<>13 then return false; end if;
 if d->>'kind' not in('casual','coop','boss','raid','wizard','castle','fun','ranked') or d->>'map' not in('greentown','apache','duel','graves','swamp','goblins','paya','oasis','tutorial','world') or d->>'adv' !~ '^[a-z][a-z-]{1,15}$' or d->>'build' !~ '^[A-Za-z0-9+._-]{1,80}$' or d->>'sim' !~ '^[0-9a-f]{12}$' then return false; end if;
 foreach field in array array['kind','map','adv','build','sim'] loop if jsonb_typeof(d->field) is distinct from 'string' then return false; end if; end loop;
 foreach field in array array['hard','endless','won'] loop if jsonb_typeof(d->field) is distinct from 'boolean' then return false; end if; end loop;
 foreach field in array array['t','kills','level'] loop if jsonb_typeof(d->field) is distinct from 'number' or d->>field !~ '^[0-9]+$' then return false; end if; end loop;
 if (d->>'t')::numeric not between 1 and 14400 or (d->>'kills')::numeric>1000000 or (d->>'level')::numeric not between 1 and 10000 or (d->>'endless')::boolean and (d->>'won')::boolean then return false; end if;
 if jsonb_typeof(d->'week') is distinct from 'null' and (jsonb_typeof(d->'week') is distinct from 'number' or d->>'week' !~ '^[0-9]+$' or (d->>'week')::numeric>10000) then return false; end if;
 s:=d->'stats';
 if jsonb_typeof(s) is distinct from 'object' or not(s?&array['v','complete','starter','weapons','passives','evo','quality','gear','metals','offered','chosen']) or (select count(*) from jsonb_object_keys(s))<>11 or s->'v' is distinct from '1'::jsonb or jsonb_typeof(s->'complete') is distinct from 'boolean' or length(s::text)>12000 then return false; end if;
 if jsonb_typeof(s->'quality') is distinct from 'object' or not((s->'quality')?&array['weapons','passives']) or (select count(*) from jsonb_object_keys(s->'quality'))<>2 then return false; end if;
 maps:=array[s->'weapons',s->'passives',s->'quality'->'weapons',s->'quality'->'passives',s->'metals'];caps:=array[6,5,10000,10000,15];mins:=array[1,1,0,0,0];
 if (s->>'complete')::boolean then
  if jsonb_typeof(s->'starter') is distinct from 'object' or not((s->'starter')?&array['weapons','passives']) or (select count(*) from jsonb_object_keys(s->'starter'))<>2 then return false; end if;
  foreach field in array array['offered','chosen'] loop
   if jsonb_typeof(s->field) is distinct from 'object' or not((s->field)?&array['weapon','passive']) or (select count(*) from jsonb_object_keys(s->field))<>2 then return false; end if;
  end loop;
  maps:=maps||array[s->'starter'->'weapons',s->'starter'->'passives',s->'offered'->'weapon',s->'offered'->'passive',s->'chosen'->'weapon',s->'chosen'->'passive'];caps:=caps||array[6,5,20000,20000,20000,20000];mins:=mins||array[1,1,1,1,1,1];
 elsif s->'starter' is distinct from 'null'::jsonb or s->'offered' is distinct from 'null'::jsonb or s->'chosen' is distinct from 'null'::jsonb then return false; end if;
 for i in 1..array_length(maps,1) loop
  if jsonb_typeof(maps[i]) is distinct from 'object' or (select count(*) from jsonb_object_keys(maps[i]))>40 then return false; end if;
  for kv in select * from jsonb_each(maps[i]) loop
   if kv.key !~ '^[a-z][a-z0-9-]{0,31}$' or jsonb_typeof(kv.value) is distinct from 'number' or kv.value::text !~ '^[0-9]+$' then return false; end if;
   if kv.value::text::numeric<mins[i] or kv.value::text::numeric>caps[i] then return false; end if;
  end loop;
 end loop;
 if jsonb_typeof(s->'evo') is distinct from 'object' or jsonb_typeof(s->'gear') is distinct from 'object' or (select count(*) from jsonb_object_keys(s->'gear'))>9 then return false; end if;
 for kv in select * from jsonb_each(s->'evo') loop if not((s->'weapons')?kv.key) or kv.value is distinct from 'true'::jsonb then return false; end if; end loop;
 for kv in select * from jsonb_each(s->'gear') loop if kv.key not in('head','chest','hands','legs','feet','offhand','back','neck','ring') or jsonb_typeof(kv.value) is distinct from 'string' or length(kv.value#>>'{}') not between 1 and 80 then return false; end if; end loop;
 return true;
exception when invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
revoke all on function public.sqs_run_stats_valid(jsonb) from public,anon,authenticated;

create table if not exists public.sqs_run_stats(
 run_key text primary key check(run_key~'^(c:[0-9a-f]{64}|r:[0-9]{1,18})$'),
 source text not null check(source in('client','ranked')),
 entry_id bigint unique references public.sqs_ranked_entries(id),
 data jsonb not null check(public.sqs_run_stats_valid(data)),
 at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((source='ranked')=(entry_id is not null)),
 check((source='ranked')=(data->>'kind'='ranked'))
);
alter table public.sqs_run_stats enable row level security;
revoke all on public.sqs_run_stats from public,anon,authenticated;

create or replace function public.sqs_record_run_stats(p_server_key text,p_run_key text,p_source text,p_data jsonb,p_ip text default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare previous public.sqs_run_stats; e public.sqs_ranked_entries; entry bigint;
begin
 if public.sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
 if public.sqs_run_stats_valid(p_data) is not true then return jsonb_build_object('error','bad run statistics'); end if;
 if p_source='ranked' then
  if p_run_key is null or p_run_key!~'^r:[0-9]{1,18}$' then return jsonb_build_object('error','unverified ranked statistics'); end if;
  entry:=substring(p_run_key from 3)::bigint;select * into e from public.sqs_ranked_entries where id=entry;
  if not found or e.verdict is distinct from 'ok' or e.finished_at is null or p_data->>'kind'<>'ranked' or (p_data->>'week')::int is distinct from e.week or p_data->>'adv' is distinct from e.adv or (p_data->>'hard')::boolean is distinct from (e.mode='hard') or (p_data->>'t')::int is distinct from e.t or (p_data->>'kills')::int is distinct from e.kills or (p_data->>'level')::int is distinct from e.level or (p_data->>'won')::boolean is distinct from e.won then return jsonb_build_object('error','unverified ranked statistics'); end if;
 elsif p_source='client' then
  if p_run_key is null or p_run_key!~'^c:[0-9a-f]{64}$' or p_ip is null or p_ip!~'^[0-9a-f]{64}$' or p_data->>'kind'='ranked' or p_data->'week' is distinct from 'null'::jsonb then return jsonb_build_object('error','bad run statistics'); end if;
 else return jsonb_build_object('error','bad run statistics'); end if;
 perform pg_advisory_xact_lock(hashtext('sqs_run_stats_'||p_run_key));
 select * into previous from public.sqs_run_stats where run_key=p_run_key for update;
 if found then
  if p_source='client' and previous.source='client' and previous.data->>'kind'='casual' and p_data->>'kind'='casual' and previous.data->'endless'='false'::jsonb and previous.data->'won'='true'::jsonb and p_data->'endless'='true'::jsonb and (p_data->>'t')::int>=(previous.data->>'t')::int and p_data->'map'=previous.data->'map' and p_data->'adv'=previous.data->'adv' and p_data->'hard'=previous.data->'hard' and p_data->'build'=previous.data->'build' and p_data->'sim'=previous.data->'sim' then
   update public.sqs_run_stats set data=p_data,updated_at=now() where run_key=p_run_key;
  end if;
  return jsonb_build_object('ok',true,'again',true);
 end if;
 if p_source='client' and public.sqs_rate_ok(p_ip,'run-stats',1) is not true then return jsonb_build_object('error','slow down'); end if;
 insert into public.sqs_run_stats(run_key,source,entry_id,data)values(p_run_key,p_source,entry,p_data);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.sqs_record_run_stats(text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.sqs_record_run_stats(text,text,text,jsonb,text) to anon;

create or replace function public.sqs_ranked_finish_v3(p_server_key text,p_id bigint,p_wallet text,p_started bigint,p_log_sha text,p_attempt uuid,p_name text,p_t int,p_kills int,p_level int,p_won boolean,p_verdict text,p_log text,p_stats jsonb default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare result jsonb;
begin
 result:=public.sqs_ranked_finish_v2(p_server_key,p_id,p_wallet,p_started,p_log_sha,p_attempt,p_name,p_t,p_kills,p_level,p_won,p_verdict,p_log);
 if result->'ok'='true'::jsonb and result->>'verdict'='ok' and p_stats is not null then
  -- Telemetry has a savepoint: a stats failure must never undo a valid paid result.
  begin perform public.sqs_record_run_stats(p_server_key,'r:'||p_id,'ranked',p_stats,null);
  exception when others then null; end;
 end if;
 return result;
end $$;
revoke all on function public.sqs_ranked_finish_v3(text,bigint,text,bigint,text,uuid,text,int,int,int,boolean,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.sqs_ranked_finish_v3(text,bigint,text,bigint,text,uuid,text,int,int,int,boolean,text,text,jsonb) to anon;
commit;
