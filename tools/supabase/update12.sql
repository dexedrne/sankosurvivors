-- SankoSurvivors update 12: atomic rate limits, including concurrent first requests.
-- Owner: paste this WHOLE file in the Solscape SQL editor after update10.
-- Independent of update11; re-paste update12 if schema.sql is replaced by an older copy.
-- Re-runnable. Preserves all existing rows, saves, entries, keys and money records.
begin;
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
commit;
