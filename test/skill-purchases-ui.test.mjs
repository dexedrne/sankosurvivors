import {createRequire} from 'node:module';
import {translateText} from '../src/i18n.js';
import {TRANSFER_KEYS} from '../src/progress-import.js';
import {validProfileValue,finiteNumber} from '../src/progress-values.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SKILLS,SKILL_IDS,skillCost,clampSkills} from '../src/content.js';
import {profileValue} from '../src/progress-values.js';
import {importProgress,recoverRunProgress} from '../src/progress-import.js';
let purchases;
try{purchases=await import('../src/skill-purchases.js')}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND'||!e.message.includes('/src/skill-purchases.js'))throw e}
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),J=JSON.stringify;
function fixture(data={},options={}){
 const values=new Map(Object.entries({'sq-coins':'1000','sq-skills':'{}',...data})),calls=[],nodes=new Map(),timers=new Map();let timer=0,buttons=[],cards=[],restartGuard;
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const document={activeElement:null},flags={reload:true,load:true};
 const make=id=>{const classes=new Set();return{id,dataset:{},textContent:'',disabled:false,isConnected:true,tabIndex:0,classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)},addEventListener(type,fn){(this.listeners??={})[type]=fn},focus(){document.activeElement=this},scrollIntoView(){},querySelectorAll(){return[]},querySelector(){return null}}};
 const $=id=>{if(!nodes.has(id))nodes.set(id,make(id));return nodes.get(id)};
 const grid=$('skillgrid');
 Object.defineProperty(grid,'innerHTML',{set(html){for(const n of[...buttons,...cards])n.isConnected=false;buttons=[];cards=[];
  for(const m of html.matchAll(/<button\b([^>]*data-id="([^"]+)"[^>]*)>/g)){
   const card=make('card-'+m[2]),button=make('train-'+m[2]);button.dataset.id=m[2];button.disabled=/\bdisabled\b/.test(m[1]);button.closest=()=>card;card.button=button;cards.push(card);buttons.push(button);
  }
 }});
 grid.querySelectorAll=s=>s==='button'?buttons:s==='.skill'?cards:[];
 grid.querySelector=s=>{const id=/data-id=["']([^"']+)/.exec(s)?.[1];return buttons.find(b=>(!id||b.dataset.id===id)&&(!s.includes(':not(:disabled)')||!b.disabled))??null};
 grid.contains=n=>buttons.includes(n)||cards.includes(n);
 $('skills').contains=n=>grid.contains(n)||['skillrefund','skillsclose','skillstatus'].some(id=>$(id)===n);
 const line=text=>{const a=source.indexOf(text);assert(a>=0,text);return source.slice(a,source.indexOf('\n',a))};
 const saved=Function('localStorage','profileValue','clampSkills',line('const load =')+'\n'+line('const getCoins =')+'\n'+line('const getSkills =')+';return{getCoins,getSkills}') (storage,profileValue,clampSkills);
 const notify=()=>calls.push('notify');
 const save=Function('localStorage','onSaved',line('const save =')+';return save')(storage,notify);
 const start=source.indexOf('function changeSkills(')>=0?source.indexOf('function changeSkills('):source.indexOf('function buildSkills('),end=source.indexOf('// ---- loading',start);assert(start>=0&&end>start);
 const args={$,SKILLS,SKILL_IDS,skillCost,...saved,getGear:()=>({}),progressionText:()=>'',asset:()=>'',save,localStorage:storage,skillQuote:s=>{assert(purchases);return purchases.skillQuote(s)},prepareSkills:(...a)=>{assert(purchases);calls.push('prepare');return purchases.prepareSkills(...a)},importProgress:(...a)=>{calls.push('commit');return importProgress(...a)},canManuallyReload:()=>flags.reload,progressCanLoad:()=>flags.load,onSaved:notify,showBest:()=>{calls.push('best');if(options.viewFailure)throw Error('owned display failure')},navFocus:n=>{calls.push('focus');document.activeElement=n},cancelPendingLoads:()=>calls.push('cancel'),showProgressRecovery:guard=>{restartGuard=guard;calls.push('recovery')},recoverRunProgress,document,setTimeout:fn=>{timers.set(++timer,fn);return timer},clearTimeout:n=>timers.delete(n)};
 const api=Function(...Object.keys(args),source.slice(start,end)+';return{build:buildSkills,change:typeof changeSkills==="function"?changeSkills:null}')( ...Object.values(args));
 api.build();calls.length=0;
 return{values,storage,calls,flags,$,api,get:k=>JSON.parse(values.get(k)??'null'),button:id=>buttons.find(b=>b.dataset.id===id),card:id=>cards.find(c=>c.button.dataset.id===id),press:n=>{document.activeElement=n;n.onclick?.()},fire:(n,type)=>n.listeners[type]?.({preventDefault(){}}),runTimers:()=>{const pending=[...timers.values()];timers.clear();for(const f of pending)f()},active:()=>document.activeElement,canRestart:()=>restartGuard()};
}
test('actual current controls keep the existing Train60/right-click Undo60 behavior',()=>{
 const f=fixture();f.press(f.button('combat'));assert.equal(f.get('sq-coins'),940);assert.equal(f.get('sq-skills').combat,1);f.fire(f.card('combat'),'contextmenu');assert.equal(f.get('sq-coins'),1000);assert.equal(f.get('sq-skills').combat||0,0);
});
test('actual Train commits both values before one notification',()=>{
 const f=fixture();f.press(f.button('combat'));assert.deepEqual(f.calls.slice(0,4),['prepare','commit','notify','best']);assert.equal(f.calls.filter(x=>x==='notify').length,1);assert.equal(f.get('sq-coins'),940);assert.equal(f.get('sq-skills').combat,1);
});
test('a denied coin write cannot leave a free trained rank or notify partial progress',()=>{
 const f=fixture(),put=f.storage.setItem,before=[...f.values];let once=true;f.storage.setItem=(k,v)=>{if(once&&k==='sq-coins'){once=false;throw Error('owned quota')}put(k,v)};f.press(f.button('combat'));assert.deepEqual([...f.values].sort(),before.sort());assert(!f.calls.includes('notify'));
});
for(const flag of['reload','load'])test('actual '+flag+' guard blocks every skill mutation',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'}),before=[...f.values];f.flags[flag]=false;f.press(f.button('combat'));f.fire(f.card('combat'),'contextmenu');f.press(f.$('skillrefund'));f.press(f.$('skillrefund'));assert.deepEqual([...f.values],before);assert(!f.calls.includes('notify'));
});
test('closed menu rejects an outstanding long-hold callback',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'}),before=[...f.values];f.fire(f.card('combat'),'touchstart');f.press(f.$('skillsclose'));f.runTimers();assert.deepEqual([...f.values],before);
});
test('a detached Train button cannot act after a rebuild',()=>{
 const f=fixture(),old=f.button('combat'),before=[...f.values];f.api.build();f.press(old);assert.deepEqual([...f.values],before);
});
test('a detached hold callback cannot undo again after context-menu rebuild',()=>{
 const f=fixture({'sq-skills':'{"combat":2}'}),card=f.card('combat');f.fire(card,'touchstart');f.fire(card,'contextmenu');assert.equal(f.get('sq-coins'),1195);assert.equal(f.get('sq-skills').combat,1);f.runTimers();assert.equal(f.get('sq-coins'),1195);assert.equal(f.get('sq-skills').combat,1);
});
test('a stale Train view refreshes instead of charging the next undisplayed price',()=>{
 const f=fixture(),old=f.button('combat');f.values.set('sq-skills','{"combat":1}');f.press(old);assert.equal(f.get('sq-coins'),1000);assert.equal(f.get('sq-skills').combat,1);assert.match(f.$('skillstatus').textContent,/changed|review/i);assert.equal(f.active(),f.$('skillsclose'));
});
test('actual stale Refund re-quotes255 before any mutation',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'});f.press(f.$('skillrefund'));assert.equal(f.get('sq-coins'),1000);f.values.set('sq-skills','{"combat":2}');f.press(f.$('skillrefund'));assert.equal(f.get('sq-coins'),1000);assert.equal(f.get('sq-skills').combat,2);assert.match(f.$('skillrefund').textContent,/255/);f.press(f.$('skillrefund'));assert.equal(f.get('sq-coins'),1255);assert.equal(f.get('sq-skills').combat||0,0);assert.equal(f.active(),f.$('skillsclose'));
});
test('retaining an old confirmation handler cannot refund reset ranks twice',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'}),old=f.$('skillrefund').onclick;f.press(f.$('skillrefund'));f.press(f.$('skillrefund'));assert.equal(f.get('sq-coins'),1060);old();old();assert.equal(f.get('sq-coins'),1060);
});
test('current coins changed during confirmation are preserved',()=>{
 const f=fixture({'sq-skills':'{"combat":1}'});f.press(f.$('skillrefund'));f.values.set('sq-coins','1020');f.press(f.$('skillrefund'));assert.equal(f.get('sq-coins'),1080);
});
test('a post-commit display error reports saved progress without rollback',()=>{
 const f=fixture({}, {viewFailure:true});assert.equal(typeof f.api.change,'function');assert.equal(f.api.change({kind:'train',id:'combat'}),true);assert.equal(f.get('sq-coins'),940);assert.equal(f.get('sq-skills').combat,1);assert.match(f.$('skillstatus').textContent,/saved on this device/i);assert.equal(f.active(),f.$('skillsclose'));assert(!f.calls.includes('recovery'));
});
test('actual recovery stays blocked if a wallet request begins after the failure',t=>{
 const names=['buyBusy','walletConnecting','holderChecking','walletRequests','rankedBusy','walletModalOpen'];for(const n of names)globalThis[n]=n==='walletModalOpen'?()=>false:false;t.after(()=>{for(const n of names)delete globalThis[n]});
 const f=fixture(),put=f.storage.setItem;let blocked=false;f.storage.setItem=(k,v)=>{if(k==='sq-skills')blocked=true;if(blocked)throw Error('rollback denied');put(k,v)};f.press(f.button('combat'));assert(f.calls.includes('recovery'));assert.equal(f.canRestart(),true);globalThis.walletRequests=1;assert.equal(f.canRestart(),false);assert(!f.calls.includes('notify'));
});

test('a real backup/API round trip keeps the new skill result and future keys',()=>{
 assert(purchases);const f=fixture({'sq-skills':'{"FutureCraft":"9"}'});f.press(f.button('combat'));assert.equal(f.get('sq-coins'),940);
 const a=source.indexOf('const b64 ='),b=source.indexOf("$('xferbtn').onclick",a);assert(a>=0&&b>a);
 const transfer=Function('localStorage','XFER_KEYS','profileValue','validProfileValue','finiteNumber',source.slice(a,b)+';return{xferCode,xferRead}')(f.storage,TRANSFER_KEYS,profileValue,validProfileValue,finiteNumber),parsed=transfer.xferRead(transfer.xferCode());
 assert.equal(parsed.error,undefined);assert.equal(parsed.data['sq-coins'],'940');assert.deepEqual(JSON.parse(parsed.data['sq-skills']),{FutureCraft:'9',combat:1});assert.deepEqual(createRequire(import.meta.url)('../tools/vercel-api/cloud.js').cleanSave(parsed.data),parsed.data);assert(Buffer.byteLength(J(parsed.data))<24000);
});
for(const lang of['tr','es','fil'])test('new Skills decisions/errors and update notes translate in '+lang,()=>{
 const messages=['The skill change was not confirmed saved. Your previous progress is kept.','Skills were saved on this device. Reopen Skills to refresh the display.','Skill progress could not be read. Keep this device’s progress.','Your skills changed. Review the current ranks and try again.','Cloud save paused because skills changed on both devices. Your local progress is safe. Turn cloud save on again and choose which progress to keep.','Safer skill upgrades','Skill purchases, Undo and Refund all now save ranks and coins together.','A changed refund quote needs confirmation again.','Delayed holds cannot change skills after you close the menu or start a run.','If skills changed on two devices, cloud saving pauses for an explicit progress choice.'];
 for(const message of messages)assert.notEqual(translateText(message,lang),message,message);
 assert.notEqual(translateText('Click again to refund every skill (255 coins)',lang),'Click again to refund every skill (255 coins)');
});

test('a rolled-back purchase keeps keyboard focus inside Skills',()=>{
 const f=fixture(),put=f.storage.setItem;let once=true;f.storage.setItem=(k,v)=>{if(once&&k==='sq-coins'){once=false;throw Error('quota')}put(k,v)};f.press(f.button('combat'));assert.equal(f.get('sq-coins'),1000);assert.equal(f.active(),f.$('skillsclose'));
});

for(const initial of[{}, {combat:2}])test('a long hold cannot retrain on its compatibility click: '+J(initial),()=>{
 const f=fixture({'sq-skills':J(initial)}),card=f.card('combat');f.fire(card,'touchstart');f.runTimers();const event=new Event('touchend',{cancelable:true});card.listeners.touchend(event);if(!event.defaultPrevented)f.press(f.button('combat'));assert.equal(f.get('sq-coins'),initial.combat?1195:1000);assert.equal(f.get('sq-skills').combat||0,initial.combat?1:0);
});

test('a short touch on an obsolete card cannot train its replacement',()=>{
 const f=fixture(),card=f.card('combat');f.fire(card,'touchstart');f.api.build();const e=new Event('touchend',{cancelable:true});card.listeners.touchend(e);if(!e.defaultPrevented)f.press(f.button('combat'));assert.equal(f.get('sq-coins'),1000);assert.equal(f.get('sq-skills').combat||0,0);
});
test('closing Skills cancels the pending touch activation before it reaches the title',()=>{
 const f=fixture(),card=f.card('combat');f.fire(card,'touchstart');f.press(f.$('skillsclose'));const e=new Event('touchend',{cancelable:true});card.listeners.touchend(e);assert.equal(e.defaultPrevented,true);
});
