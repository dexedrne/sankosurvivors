import { address } from './crypto.mjs';
import { RANKED, racesOf, placeable } from '../../src/ranked.js';
export const DMT = '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
export const COLLECT = '0xa1e6e6ee71300c238935b7d59c8983b06e991be0';
export const HOUSE = '0x9d506ba29843a232409d85e289edece8d6a7b452';
// the developer's own wallet (also the house fee wallet) plays ranked but is never paid a prize: its places go to the next
// players. tools/supabase/payouts.sql applies the same rule, so the plan still matches the database's own settlement.
export const NO_PRIZE = new Set([HOUSE]);
export const EPOCH = RANKED.weekEpoch, WEEK = 7*86400000;
export const weekOf = now => Math.floor((now-EPOCH)/WEEK);
export const weekEnd = w => EPOCH+(w+1)*WEEK;
// Runs started just before the reset can still be sent: the longest run (src/ranked.js runSeconds, 46 min) plus the
// API's 40-minute LATE_SECONDS, plus up to 5 minutes of server replay. Plans wait this long after the week ends;
// tools/supabase/payouts.sql waits the same.
export const GRACE_MS = 180*60000; // a 2:00:00 run + 40 min to send it + its replay (same as tools/supabase/payouts.sql)
// each week's races, each with its own pot and rollover chain: Normal from week 0, Hard from RANKED.kpmWeek
export { racesOf };
export const firstWeek = mode => mode==='hard'?RANKED.kpmWeek:0;
export function units(value) {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) throw new Error('invalid base units');
  const n = BigInt(value); if (n >= 1n << 256n) throw new Error('amount overflow'); return n;
}
export function decimal(value) {
  if (typeof value !== 'string' || !/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('invalid decimal cap');
  const [whole,fraction=''] = value.split('.'); const n = BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
  if (n <= 0n || n >= 1n << 256n) throw new Error('invalid cap'); return n;
}
export function dmt(n) {
  n = BigInt(n); return `${n/10n**18n}.${(n%10n**18n).toString().padStart(18,'0')}`.replace(/\.?0+$/, '');
}
// One race's plan for one week. report.top is in the week's board order (sqs_ranked_settle); the week picks the rule for
// who can win: from week 1 a run under 3:00 never wins, and the developer's wallet never wins in any week or race.
export function makePlan(report, incoming = '0', week = report.week ?? 0) {
  const paid = units(report.paid), house = paid/10n, pool = paid-house+units(incoming);
  const shares = RANKED.payouts.map(weight=>pool*BigInt(Math.round(weight*100))/100n);
  const top = report.top.filter((winner)=>!NO_PRIZE.has(address(winner.wallet)) && placeable(week, winner));
  const count = Math.min(top.length,shares.length);
  if(count) shares[count-1] += pool-shares.reduce((sum,share)=>sum+share,0n);
  const seen = new Set();
  const prizes = top.slice(0,count).map((winner,i)=>{
    const wallet = address(winner.wallet); if (seen.has(wallet)) throw new Error('duplicate winner'); seen.add(wallet);
    return {wallet,amount:shares[i].toString()};
  });
  return { house:house.toString(), pool:pool.toString(), prizes, rollover:(pool-prizes.reduce((s,p)=>s+BigInt(p.amount),0n)).toString() };
}
