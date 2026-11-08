"""Two real PostgreSQL sessions: claim/plan serialization, using only an owned disposable cluster."""
import json
import re
from pathlib import Path
import subprocess
import sys
import time
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'qa-kit'))
from test_postgres import database, connection
root = Path(__file__).resolve().parents[1]
with database(root / 'ranked-clock-postgres.log') as base:
    args, env = connection(base)
    def sql(statement):
        return subprocess.run(args + ['-c', statement], env=env, text=True, capture_output=True, check=True, timeout=15).stdout.strip()
    assert sql('show listen_addresses') == ''
    sql('create role anon;create role authenticated;')
    sql("create function public.sqs_fixture_now() returns timestamptz language sql volatile as $$select '2026-11-09T00:05:00Z'::timestamptz$$;")
    for name in ['schema','update2','update3','ranked','payouts','update4','update5','update6','update7','update8','update9','update10','update14','update15','update16']:
        sql(re.sub(r'\b(?:clock_timestamp|now)\(\)', 'sqs_fixture_now()', (root / ('tools/supabase/' + name + '.sql')).read_text()))
    sql("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' else 'server-key' end,'UTF8')),'hex');")
    wallet = '0x' + '1'*40
    sql(f"insert into sqs_ranked_entries(week,wallet,tx,paid,ip_hash,seed,adv,started_at,clock_version,clock_deadline) values(0,'{wallet}','0x{'1'*64}',500000000000000000,'test',1,'adventurer','2026-11-08T23:00:00Z',1,1794182400000);")
    started = sql('select (extract(epoch from started_at)*1000)::bigint from sqs_ranked_entries where id=1')
    claim = f"select sqs_ranked_claim_v2('server-key',1,'{wallet}',{started},'{'a'*64}','00000000-0000-4000-8000-000000000001',true)"
    plan = "select sqs_payout_plan('payout-key',0,'{\"house\":\"50000000000000000\",\"pool\":\"450000000000000000\",\"rollover\":\"450000000000000000\",\"prizes\":[]}')"
    def overlap(first_query, second_query, expected_first, expected_second):
        first = subprocess.Popen(args, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        second = None
        try:
            first.stdin.write('begin;'+first_query+';\n');first.stdin.flush()
            result=json.loads(first.stdout.readline());assert all(result.get(k)==v for k,v in expected_first.items()),result
            second=subprocess.Popen(args+['-c',"set application_name='sqs_rollover_waiter';"+second_query],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
            timeout=time.monotonic()+8
            while sql("select count(*) from pg_stat_activity where application_name='sqs_rollover_waiter' and wait_event_type='Lock'")!='1':
                assert second.poll() is None and time.monotonic()<timeout
                time.sleep(.025)
            first.stdin.write('commit;\n\\q\n');first.stdin.flush();first.wait(timeout=10)
            result,error=second.communicate(timeout=10);assert second.returncode==0,error
            result=json.loads(result);assert all(result.get(k)==v for k,v in expected_second.items()),result
        finally:
            for proc in [first,second]:
                if proc is not None:
                    if proc.poll() is None:proc.kill();proc.wait()
                    for pipe in [proc.stdin,proc.stdout,proc.stderr]:
                        if pipe:pipe.close()
    overlap(claim,plan,{'ok':True},{'error':'replay in progress'})
    sql("update sqs_ranked_entries set claimed_at=null,submit_sha=null,submit_attempt=null,submit_until=null;create or replace function public.sqs_fixture_now() returns timestamptz language sql volatile as $$select '2026-11-09T00:05:01Z'::timestamptz$$;")
    overlap(plan,claim,{'ok':True},{'error':'that week is already settled: tell the dev'})
    print(json.dumps({'claimThenPlan':'pass','planThenClaim':'pass','database':'isolated PostgreSQL16','productionWrites':0,'fundsMoved':0}))
