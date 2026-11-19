import {raceForWeek} from './ranked.js';

export const ULTRA_ENTRY_WEEK = 2;

const PAID_TIERS = {
 high: {entryDmt:'10',entryWei:'10000000000000000000'},
 max: {entryDmt:'25',entryWei:'25000000000000000000'},
 ultra: {entryDmt:'100',entryWei:'100000000000000000000'},
};

// Every wager uses the same Normal race, physics and scoring.
export function entryForWeek(week,mode='normal',tier='standard') {
 if(!Number.isSafeInteger(week)||week<0||typeof tier!=='string')return null;
 const race=raceForWeek(week,mode);
 if(!race)return null;
 if(tier==='standard')return {...race,tier};
 if(week<(tier==='ultra'?ULTRA_ENTRY_WEEK:1)||mode!=='normal'||!Object.hasOwn(PAID_TIERS,tier))return null;
 return {...race,tier,...PAID_TIERS[tier]};
}
export const entryOptions=(week,mode='normal')=>['standard',...Object.keys(PAID_TIERS)].map(tier=>entryForWeek(week,mode,tier)).filter(Boolean);

export function entryMessage(nonce,week,mode='normal',deadline,tier='standard') {
 const price=entryForWeek(week,mode,tier)||(tier==='standard'&&Number.isSafeInteger(week)&&week<0?raceForWeek(week,mode):null);
 if(!price||typeof nonce!=='string'||!nonce||nonce.length>2048)return null;
 const message=mode==='hard'
  ? `SankoQuest Survivors ranked\n\nSign to enter this week's Hard ranked race (week ${week}). Signing is free. Your wallet asks separately before sending the ${price.entryDmt} DMT entry.\n\nNonce: ${nonce}`
  : `SankoQuest Survivors ranked\n\nSign to enter this week's ranked runs (week ${week}). Signing is free. Your wallet asks separately before sending the ${price.entryDmt} DMT entry.\n\nNonce: ${nonce}`;
 if(!Number.isSafeInteger(deadline))return message;
 if(!Number.isFinite(new Date(deadline).getTime()))return null;
 return message+`\n\nI acknowledge this run stops at ${new Date(deadline).toISOString()} and keeps the score earned by then.`;
}
