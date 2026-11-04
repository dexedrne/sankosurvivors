import { run } from '../../tools/payout/runner.mjs';
import { database, Arbitrum, telegram } from '../../tools/payout/ports.mjs';
import { fixture, key } from './payout.mjs';
const f=fixture(3),url=process.argv[2];
const config={...f.config,url,supabaseKey:'fixture-public',telegramToken:'fixture-bot',telegramChat:'fixture-chat'};
const localTelegram=(target,opts)=>fetch(url+'/telegram',opts);
run(config,{rpc:database(config),chain:new Arbitrum(fetch,[url+'/arb']),notify:telegram(config,localTelegram),key:async()=>key,now:()=>f.db.now,pause:async()=>{},log:()=>{}}).catch(error=>{console.error(error);process.exitCode=1;});
