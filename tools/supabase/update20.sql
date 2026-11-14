-- OWNER PASTE WHOLE FILE AFTER19;20LAST. Fixed owner-funded20DMT for week1ApacheNormal first place.
-- This migration creates no payout rows, changes no snapshots and sends no tokens.
begin;
alter table public.sqs_ranked_payouts drop constraint if exists sqs_ranked_payouts_kind_check;
alter table public.sqs_ranked_payouts add constraint sqs_ranked_payouts_kind_check
 check(kind in ('prize1','prize2','prize3','prize4','prize5','participation','house','refund','rollover-note','prize-bonus'));
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.sqs_ranked_payouts'::regclass and conname='sqs_first_bonus_scope') then
  alter table public.sqs_ranked_payouts add constraint sqs_first_bonus_scope
   check(kind<>'prize-bonus' or (week=1 and mode='normal' and amount=20000000000000000000));
 end if;
end $$;
-- This exact pledged deposit cannot also be counted as an entry or refund source.
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.sqs_ranked_entries'::regclass and conname='sqs_bonus_funding_not_entry') then
  alter table public.sqs_ranked_entries add constraint sqs_bonus_funding_not_entry
   check(lower(tx)<>'0x008748b63201e11cc463d08aa6f1bdd1ac0bc48845894cdd330119da875de425');
 end if;
end $$;
create unique index if not exists sqs_first_bonus_once on public.sqs_ranked_payouts(week,mode) where kind='prize-bonus';

create or replace function public.sqs_payout_first_bonus(p_key text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare w public.sqs_ranked_payout_weeks; p public.sqs_ranked_payouts; b public.sqs_ranked_payouts; recipient text;
begin
 if sqs_key_ok('payout_key_sha256',p_key) is not true then return jsonb_build_object('error','forbidden'); end if;
 perform pg_advisory_xact_lock(hashtext('sqs_payout_plan'));
 perform pg_advisory_xact_lock(hashtext('sqs_ranked_1'));
 perform pg_advisory_xact_lock(hashtext('sqs_payout_nonce'));
 if now()<'2026-11-16T00:00:00Z'::timestamptz then return jsonb_build_object('ok',true,'waiting',true); end if;
 select * into w from public.sqs_ranked_payout_weeks where week=1 and mode='normal';
 if not found then return jsonb_build_object('ok',true,'waiting',true); end if;
 if w.reward_version<>2 or jsonb_typeof(w.top)<>'array' then return jsonb_build_object('error','invalid settled reward policy'); end if;
 if jsonb_array_length(w.top)=0 then return jsonb_build_object('ok',true,'waiting',true); end if;
 recipient:=w.top->0->>'wallet';
 if recipient is null or recipient!~'^0x[0-9a-f]{40}$' or recipient='0x9d506ba29843a232409d85e289edece8d6a7b452' or coalesce((w.top->0->>'t')::int,0)<180 then
  return jsonb_build_object('error','invalid first-place winner');
 end if;
 select * into p from public.sqs_ranked_payouts where week=1 and mode='normal' and kind='prize1';
 if not found or p.wallet<>recipient or p.amount<=0 then return jsonb_build_object('error','missing first-place award'); end if;
 select * into b from public.sqs_ranked_payouts where kind='prize-bonus';
 if found then
  if b.week<>1 or b.mode<>'normal' or b.wallet<>recipient or b.amount<>20000000000000000000 then return jsonb_build_object('error','bonus differs from approved first place'); end if;
  return jsonb_build_object('ok',true,'again',true);
 end if;
 insert into public.sqs_ranked_payouts(week,mode,kind,wallet,amount,status)
 values(1,'normal','prize-bonus',recipient,20000000000000000000,
  case when p.status='held' or exists(select 1 from public.sqs_ranked_holds where week=1 and wallet=recipient) then 'held' else 'planned' end);
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.sqs_payout_first_bonus(text) from public,anon,authenticated;
grant execute on function public.sqs_payout_first_bonus(text) to anon;

create or replace function public.sqs_ranked_bonus(p_week int,p_mode text default 'normal')
returns jsonb language sql immutable set search_path=pg_catalog,public,pg_temp as $$
 select jsonb_build_object('amountWei',case when p_week=1 and p_mode='normal' then '20000000000000000000' else '0' end,
 'tx',case when p_week=1 and p_mode='normal' then '0x008748b63201e11cc463d08aa6f1bdd1ac0bc48845894cdd330119da875de425' else null end)
$$;
revoke all on function public.sqs_ranked_bonus(int,text) from public,anon,authenticated;
grant execute on function public.sqs_ranked_bonus(int,text) to anon;
notify pgrst,'reload schema';
commit;
