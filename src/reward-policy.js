export const REWARD_HOUSE = '0x9d506ba29843a232409d85e289edece8d6a7b452';
export const REBATE_WEEK = 3;
export const rewardPolicyVersion = (week, mode='normal') => week<1 ? 0 : week>=REBATE_WEEK&&mode==='normal' ? 3 : 2;
export function rewardPolicy(week,version=2) {
  if(week<1)return {version:0,placing:100,runs:0,seconds:0,minSeconds:0,capped:false};
  if(version===1)return {version:1,placing:80,runs:10,seconds:10,minSeconds:180,capped:false};
  if(version===3)return {version:3,placing:80,rebates:[[180,3],[600,6],[1200,9]],minSeconds:30,placeMinSeconds:180,capped:false};
  if(version!==2)throw Error('unknown reward policy');
  return {version:2,placing:80,paid:10,seconds:10,minSeconds:30,placeMinSeconds:180,capped:false};
}
const weights = [40n,25n,15n,12n,8n];
const integer = n => typeof n === 'string' && /^(0|[1-9]\d{0,77})$/.test(n) && BigInt(n) < 1n<<256n;
// Largest remainder per activity bucket; equal remainders go to the lower wallet address.
function proportional(pool, rows, field) {
  if(!rows.length)return [];
  const total=rows.reduce((n,r)=>n+BigInt(r[field]),0n);
  const shares=rows.map(r=>({wallet:r.wallet,amount:pool*BigInt(r[field])/total,remainder:pool*BigInt(r[field])%total}));
  let dust=pool-shares.reduce((n,r)=>n+r.amount,0n);
  for(const row of [...shares].sort((a,b)=>a.remainder===b.remainder?a.wallet.localeCompare(b.wallet):a.remainder>b.remainder?-1:1))if(dust>0n){row.amount++;dust--;}
  return shares;
}
export function allocateRewards(pool, count, week=0, activity, version=2, entryPool) {
  pool=BigInt(pool);count=Math.min(count,5);
  const policy=rewardPolicy(week,version);
  const placing=week>=1?pool*80n/100n:pool;
  const runPool=week>=1?pool/10n:0n, secondsPool=week>=1?pool-placing-runPool:0n;
  const shares=weights.map(w=>placing*w/100n);
  if(count)shares[count-1]+=placing-shares.reduce((n,s)=>n+s,0n);
  const prizes=shares.slice(0,count).map(String);
  if(week<1)return {prizes,rollover:String(pool-prizes.reduce((n,s)=>n+BigInt(s),0n))};
  if(!Array.isArray(activity))throw Error('missing reward activity');
  const seen=new Set();
  const rows=activity.map(r=>{
    if(!r||!/^0x[0-9a-f]{40}$/.test(r.wallet)||/^0x0{40}$/.test(r.wallet)||seen.has(r.wallet)||!integer(r.runs)||!integer(r.seconds)||BigInt(r.runs)<=0n||BigInt(r.seconds)<BigInt(policy.minSeconds)*BigInt(r.runs)||policy.version>=2&&(!integer(r.paid)||BigInt(r.paid)<=0n))throw Error('invalid reward activity');
    if(version===3&&(!integer(r.rebate)||BigInt(r.rebate)>BigInt(r.paid)*9n/100n))throw Error('invalid survival rebate');
    seen.add(r.wallet);return r;
  }).filter(r=>r.wallet!==REWARD_HOUSE).sort((a,b)=>a.wallet.localeCompare(b.wallet));
  let participation;
  if(version===3){
    const rebates=rows.reduce((n,r)=>n+BigInt(r.rebate),0n);
    const fresh=BigInt(entryPool);
    if(fresh<0n||fresh>pool||rebates>fresh/10n)throw Error('invalid survival rebate budget');
    const seconds=proportional(pool-placing-rebates,rows,'seconds');
    participation=rows.map((r,i)=>({wallet:r.wallet,amount:String(BigInt(r.rebate)+seconds[i].amount)}));
  }else{
    const runs=proportional(runPool,rows,version===2?'paid':'runs'),seconds=proportional(secondsPool,rows,'seconds');
    participation=runs.map((r,i)=>({wallet:r.wallet,amount:String(r.amount+seconds[i].amount)}));
  }
  return {prizes,participation,rollover:String(pool-[...prizes,...participation.map(r=>r.amount)].reduce((n,s)=>n+BigInt(s),0n))};
}
