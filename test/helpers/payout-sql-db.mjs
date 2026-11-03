import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
export async function sqlDB() {
  const { PGlite } = await import(pathToFileURL(process.env.SQS_PGLITE));
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated;');
  for(const f of ['schema','ranked','payouts','update4','update6']) await db.exec(await readFile(new URL(`../../tools/supabase/${f}.sql`,import.meta.url),'utf8'));
  // The clock is controlled only in this isolated PostgreSQL instance.
  await db.exec("create or replace function pg_catalog.now() returns timestamptz language sql stable as $$ select '2026-11-17T01:00:00Z'::timestamptz $$;");
  await db.exec("update sqs_admin set v=encode(sha256(convert_to(case when k='payout_key_sha256' then 'payout-key' when k='reports_key_sha256' then 'reports-key' else 'server-key' end,'UTF8')),'hex');");
  const rpc = async(fn,args={})=>(await db.query(`select ${fn}(${Object.keys(args).map((k,i)=>`${k} => $${i+1}`).join(',')}) as r`,Object.values(args).map(v=>typeof v==='object'&&v!==null?JSON.stringify(v):v))).rows[0].r;
  return {db,rpc};
}
