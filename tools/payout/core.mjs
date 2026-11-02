import { address } from './crypto.mjs';
import { RANKED } from '../../src/ranked.js';
export const DMT = '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8';
export const COLLECT = '0xa1e6e6ee71300c238935b7d59c8983b06e991be0';
export const HOUSE = '0x9d506ba29843a232409d85e289edece8d6a7b452';
export const EPOCH = RANKED.weekEpoch, WEEK = 7*86400000;
export const weekOf = now => Math.floor((now-EPOCH)/WEEK);
export const weekEnd = w => EPOCH+(w+1)*WEEK;
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
export function makePlan(report, incoming = '0') {
  const paid = units(report.paid), house = paid/10n, pool = paid-house+units(incoming);
  const shares = RANKED.payouts.map(weight=>pool*BigInt(Math.round(weight*100))/100n);
  const count = Math.min(report.top.length,shares.length);
  if(count) shares[count-1] += pool-shares.reduce((sum,share)=>sum+share,0n);
  const seen = new Set();
  const prizes = report.top.slice(0,count).map((winner,i)=>{
    const wallet = address(winner.wallet); if (seen.has(wallet)) throw new Error('duplicate winner'); seen.add(wallet);
    return {wallet,amount:shares[i].toString()};
  });
  return { house:house.toString(), pool:pool.toString(), prizes, rollover:(pool-prizes.reduce((s,p)=>s+BigInt(p.amount),0n)).toString() };
}
