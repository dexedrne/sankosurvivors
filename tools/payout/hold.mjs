#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { loadConfig, DEFAULT_ENV } from './config.mjs';
import { database } from './ports.mjs';
import { address } from './crypto.mjs';
export async function main(args=process.argv.slice(2)) {
  const [week,wallet,reason,...rest]=args;
  if(!/^\d+$/.test(week)||!Number.isSafeInteger(Number(week))||!reason||(rest.length&&(rest.length!==2||rest[0]!=='--env')))throw Error('usage: hold.mjs <week> <wallet> "<reason>" [--env /path/payout.env]; reason --clear clears a hold');
  const config=await loadConfig(rest[1]??DEFAULT_ENV);
  const result=await database(config)('sqs_payout_hold',{p_key:config.payoutKey,p_week:Number(week),p_wallet:address(wallet),p_reason:reason==='--clear'?null:reason});
  if(result.error)throw Error('hold rejected');
  console.log((reason==='--clear'?'Hold cleared':'Winner held')+(result.unchanged?` (${result.unchanged} prize(s) already sending or sent: unchanged).`:'.'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Hold failed. Check arguments, env file and database access.');process.exitCode=1;});
