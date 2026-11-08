// Permanent gear purchases/refunds only; Smithing unlocks are never refundable.
import {GEAR,GEAR_MAX_LV,gearUpgradeCost,smithNext,smithPrev} from './content.js';
import {finiteNumber,validProfileValue} from './progress-values.js';
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const problem = () => Error('Gear payment history could not be read. Keep this device’s progress.');
const read = (storage,key,fallback) => { const raw=storage.getItem(key);return raw===null?fallback:JSON.parse(raw); };
function levelsOf(raw,bank) {
  return Object.fromEntries(Object.keys(raw).sort().flatMap(n=>{const lv=Math.max(0,Math.min(GEAR_MAX_LV,Math.floor(finiteNumber(raw[n]))));return Object.hasOwn(GEAR,n)&&bank.has(n)&&lv?[[n,lv]]:[];}));
}
const price = (n,lv) => {let sum=0;for(let i=0;i<lv;i++)sum+=gearUpgradeCost(n,i);return sum;};
function values(levels) {
  const roots=new Map();let upper=0;
  for(const[n,lv]of Object.entries(levels)) {
    if(!Object.hasOwn(GEAR,n))throw problem();
    upper+=price(n,lv);let root=n,previous;while((previous=smithPrev(root)))root=previous;
    roots.set(root,Math.max(roots.get(root)||0,lv));
  }
  return {lower:[...roots].reduce((sum,[n,lv])=>sum+price(n,lv),0),upper};
}
function state(storage) {
  const coinsValue=read(storage,'sq-coins',0),bank=read(storage,'sq-bank',[]),raw=read(storage,'sq-gearlv',{}),book=read(storage,'sq-armoury',null);
  if(!validProfileValue('sq-coins',coinsValue)||!Array.isArray(bank)||!bank.every(n=>typeof n==='string')||!object(raw)||!validProfileValue('sq-gearlv',raw))throw problem();
  const coins=finiteNumber(coinsValue);if(!Number.isSafeInteger(coins)||coins<0)throw problem();
  const levels=levelsOf(raw,new Set(bank)),basis=values(levels);let amount=basis.lower,legacy=amount,rev=0;
  if(book!==null) {
    if(!validProfileValue('sq-armoury',book))throw problem();rev=book.rev;
    // shortcut: book price bounds use v1 prices; migrate the book before changing reinforcement prices.
    const bounds=values(book.levels);
    if(book.paid<bounds.lower||book.paid>bounds.upper)throw problem();
    const recorded=Object.fromEntries(Object.entries(book.levels).sort(([a],[b])=>a.localeCompare(b)));
    const current=Object.fromEntries(Object.entries(levels).sort(([a],[b])=>a.localeCompare(b)));
    if(JSON.stringify(recorded)===JSON.stringify(current)){amount=book.paid;legacy=book.legacy;}
  }
  return {coins,bank,raw,levels,amount,legacy,rev,identity:JSON.stringify([bank,raw,book])};
}
export function armouryQuote(storage) {
  const {amount,legacy,identity}=state(storage);return {amount,legacy,identity};
}
export function prepareArmoury(storage,action) {
  const s=state(storage),raw={...s.raw},bank=[...s.bank],data={};let coins=s.coins,paid=s.amount,legacy=s.legacy,amount=0;
  if(action?.kind==='refund') {
    if(!paid)throw Error('There are no reinforcements to refund.');
    amount=paid;coins+=paid;paid=legacy=0;for(const n of Object.keys(raw))if(Object.hasOwn(GEAR,n))delete raw[n];
  } else if(action?.kind==='reinforce'||action?.kind==='smith') {
    const n=action.name;if(!Object.hasOwn(GEAR,n)||!bank.includes(n))throw Error('That gear is not in your collection.');
    const lv=s.levels[n]||0,up=action.kind==='smith'?smithNext(n):null;
    if(action.kind==='reinforce'&&lv>=GEAR_MAX_LV||action.kind==='smith'&&(!up||bank.includes(up.name)))throw Error('That gear cannot be upgraded.');
    const cost=up?up.cost:gearUpgradeCost(n,lv);if(coins<cost)throw Error('Not enough coins.');
    amount=-cost;coins-=cost;
    if(up) {
      bank.push(up.name);if(lv)raw[up.name]=lv;else delete raw[up.name];data['sq-bank']=JSON.stringify(bank);
      const gear=read(storage,'sq-gear',{});if(!object(gear))throw problem();const slot=GEAR[n].slot;
      if(gear[slot]===n)data['sq-gear']=JSON.stringify({...gear,[slot]:up.name});
    } else {raw[n]=lv+1;paid+=cost;}
  } else throw Error('Unknown Armoury action.');
  if(!Number.isSafeInteger(coins)||!Number.isSafeInteger(paid)||!Number.isSafeInteger(s.rev+1))throw problem();
  data['sq-coins']=JSON.stringify(coins);data['sq-gearlv']=JSON.stringify(raw);
  data['sq-armoury']=JSON.stringify({v:1,rev:s.rev+1,paid,legacy,levels:levelsOf(raw,new Set(bank))});
  return {data,amount,legacy};
}
