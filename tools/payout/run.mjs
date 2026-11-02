#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { loadConfig, loadWallet, DEFAULT_ENV } from './config.mjs';
import { database, telegram, Arbitrum } from './ports.mjs';
import { run } from './runner.mjs';
export async function main(args=process.argv.slice(2)) {
  if(args.length && (args.length!==2 || args[0]!=='--env'))throw Error('usage: node tools/payout/run.mjs [--env /path/payout.env]');
  const config=await loadConfig(args[1]??DEFAULT_ENV);
  console.log(config.live?'LIVE payout run':'DRY RUN: sending disabled');
  await run(config,{rpc:database(config),chain:new Arbitrum(),notify:telegram(config),key:()=>loadWallet(config)});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('Payout run stopped. Check file permissions, configuration, database ledger and connectivity. No secrets are logged.');process.exitCode=1;});
