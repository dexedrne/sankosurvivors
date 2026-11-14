-- Update21: OWNER PASTE WHOLE FILE AFTER19/20. Keep21 last when restoring admission wrappers.
-- Optional 25 DMT Normal entries share the existing 1/10 DMT board, pool and 80/10/10 rewards.
-- Only two keyed admission wrappers change. No rows, reward snapshots, funds or wallet jobs change.
begin;
create or replace function public.sqs_ranked_can_enter_v2(p_server_key text,p_wallet text,p_week int,p_ip_hash text,p_max int,p_mode text default 'normal')
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare result jsonb;
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return jsonb_build_object('error','forbidden'); end if;
  result:=public.sqs_ranked_can_enter(p_server_key,p_wallet,p_week,p_ip_hash,p_max,p_mode)::jsonb;
  if result?'error' then return result; end if;
  return result || jsonb_build_object('reward_version',2,'entry_version',3);
end $$;
revoke all on function public.sqs_ranked_can_enter_v2(text,text,int,text,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_can_enter_v2(text,text,int,text,int,text) to anon;

create or replace function public.sqs_ranked_enter_v2(p_server_key text,p_tx text,p_wallet text,p_week int,p_ip_hash text,p_paid numeric,p_seed bigint,p_max int,p_mode text default 'normal')
returns json language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
begin
  if sqs_key_ok('server_key_sha256',p_server_key) is not true then return json_build_object('error','forbidden'); end if;
  if p_week is null or p_week<0 or p_mode is null or p_mode not in ('normal','hard') or p_paid is null
    or not ((p_mode='normal' and ((p_week=0 and p_paid=500000000000000000) or (p_week>=1 and p_paid in (1000000000000000000,10000000000000000000,25000000000000000000))))
      or (p_mode='hard' and p_week>=1 and p_paid=2000000000000000000)) then return json_build_object('error','bad entry amount'); end if;
  return public.sqs_ranked_enter(p_server_key,p_tx,p_wallet,p_week,p_ip_hash,p_paid,p_seed,p_max,p_mode);
end $$;

revoke all on function public.sqs_ranked_enter_v2(text,text,text,int,text,numeric,bigint,int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_enter_v2(text,text,text,int,text,numeric,bigint,int,text) to anon;
commit;
