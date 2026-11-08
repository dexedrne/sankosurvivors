#!/usr/bin/env node
// Owner authorization is week0 only; this bounded job never authorizes later pots or refunds.
import {pathToFileURL} from 'node:url';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join,dirname} from 'node:path';
import {loadConfig,loadWallet} from './config.mjs';
import {database,Arbitrum} from './ports.mjs';
import {run} from './runner.mjs';
import {main as reviewMain} from './review.mjs';
import {weekEnd} from './core.mjs';

export async function runApprovedWeek({week,now=Date.now,load=loadConfig,ports,execute=run,review=reviewMain,log=console.log,isComplete=async()=>false,markComplete=async()=>{}}={}) {
  if(week!==0)throw Error('Only week0 has an approved schedule');
  const time=now(),end=weekEnd(week);
  if(!Number.isFinite(time))throw Error('Invalid schedule clock');
  if(time<end){log('WAIT: approved week has not ended.');return;}
  if(time>=end+48*3600000){log('STOP: approved payout window expired.');return;}
  if(await isComplete()){log('STOP: approved week0 payouts are confirmed.');return;}
  const config=await load();
  if(!ports&&(!config.keystore||!config.passphraseFile))throw Error('Encrypted wallet configuration is incomplete');
  const io=ports??{rpc:database(config),chain:new Arbitrum(),key:()=>loadWallet(config),notify:async text=>log(text),log};
  // A null server key checks migration availability before any ledger mutation.
  const ready=await io.rpc('sqs_ranked_clock',{p_server_key:null,p_id:0,p_wallet:'',p_started:0,p_action:'state',p_seq:0,p_frame:0});
  if(ready?.error!=='forbidden')throw Error('SQL16 is required before the approved payout');
  await review([String(week)],{config,db:io.rpc});
  const scoped={...io,approvedWeek:week,atReset:true,now};
  log('Approved week0: dry preview; sending disabled.');
  const preview=await execute({...config,live:false},scoped);
  if(preview?.complete){await markComplete();return preview;}
  if(!preview?.rows?.length)return;
  log('Approved week0: sending only the exact previewed prize/house rows.');
  const result=await execute({...config,live:true},{...scoped,expectedRows:preview.rows});
  if(result?.complete)await markComplete();
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const args=process.argv.slice(2);
  if(args.length!==2||args[0]!=='--week'||args[1]!=='0'){console.error('Usage: scheduled.mjs --week 0');process.exitCode=1;}
  else {
    const state=join(homedir(),'.local/state/sankosurvivors/payout-week0.complete');
    const isComplete=async()=>{try{return(await readFile(state,'utf8')).startsWith('week0 confirmed ');}catch(error){if(error.code==='ENOENT')return false;throw error;}};
    const markComplete=async()=>{await mkdir(dirname(state),{recursive:true,mode:0o700});await writeFile(state,'week0 confirmed '+new Date().toISOString()+'\n',{mode:0o600});};
    runApprovedWeek({week:0,isComplete,markComplete}).catch(()=>{console.error('Approved payout stopped. Check local configuration, SQL16, ledger and connectivity. No secrets are logged.');process.exitCode=1;});
  }
}
