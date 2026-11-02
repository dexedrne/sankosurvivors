import { createHash, timingSafeEqual } from 'node:crypto';
import { loadVercelConfig, loadWallet } from './config.mjs';
import { database, telegram, Arbitrum } from './ports.mjs';
import { run } from './runner.mjs';

export default async function handler(req,res) {
  const secret=process.env.CRON_SECRET,authorization=req.headers?.authorization;
  const digest=value=>createHash('sha256').update(value).digest();
  const reply=(status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
  if(!secret||typeof authorization!=='string'||!timingSafeEqual(digest('Bearer '+secret),digest(authorization)))return reply(401,{error:'Unauthorized'});
  if(req.method!=='GET')return reply(405,{error:'GET required'});
  let config;
  try{config=loadVercelConfig();}
  catch{console.error('Payout cron refused: missing or invalid payout configuration. Check tools/payout/README.md.');return reply(503,{error:'Payout configuration missing or invalid'});}
  console.log(config.live?'LIVE payout cron':'DRY RUN: sending disabled');
  // Abort every outbound request with a minute left for unwinding before Vercel's 300s limit.
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),240000);
  const request=(url,options)=>fetch(url,{...options,signal:AbortSignal.any([options.signal,controller.signal])});
  try{
    await run(config,{rpc:database(config,request),chain:new Arbitrum(request),notify:telegram(config,request),key:()=>loadWallet(config)});
    return reply(200,{ok:true,live:config.live});
  }catch{
    console.error(controller.signal.aborted?'Payout cron paused at the time budget; the next invocation resumes from the ledger.':'Payout cron stopped; check configuration, ledger and connectivity.');
    return reply(controller.signal.aborted?503:500,{error:'Payout run stopped; check function logs'});
  }finally{clearTimeout(timer);}
}
