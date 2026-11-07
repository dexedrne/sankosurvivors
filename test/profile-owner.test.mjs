import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const tick=()=>new Promise(r=>setImmediate(r));
function navigatorFor(t,locks){const old=Object.getOwnPropertyDescriptor(globalThis,'navigator');Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks}});t.after(()=>old?Object.defineProperty(globalThis,'navigator',old):delete globalThis.navigator);}
function lockManager(){let held=null;return{close(){held=null;},get held(){return !!held;},request(name,options,callback){assert.equal(name,'sqs-profile-owner');assert.deepEqual(options,{ifAvailable:true});if(held)return Promise.resolve(callback(null));const mine={name,mode:'exclusive'};held=mine;return Promise.resolve().then(()=>callback(mine)).finally(()=>{if(held===mine)held=null;});}};}
const owner=()=>import('../src/profile-owner.js');

test('legacy inline startup cannot write a carried save before profile ownership',()=>{
 const writes=[],raw=Buffer.from(JSON.stringify({'sq-coins':'42'})).toString('base64'),context={location:{hostname:'sankosurvivors.quest',hash:'#carry='+encodeURIComponent(raw),pathname:'/',search:''},document:{referrer:'https://sankoquest.vyvanse.beer/'},history:{replaceState(){}},localStorage:{getItem:()=>null,setItem:(...a)=>writes.push(a)},URL,atob:s=>Buffer.from(s,'base64').toString('binary'),escape,decodeURIComponent};
 vm.createContext(context);for(const m of readFileSync(new URL('../index.html',import.meta.url),'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())vm.runInContext(m[1],context);
 assert.deepEqual(writes,[],'a second tab must not apply a carry before obtaining ownership');
});
test('the owner retains exclusivity after startup resolves; a contender never loads or auto-takes over',async t=>{
 const {openProfile}=await owner(),locks=lockManager();navigatorFor(t,locks);let first=0,second=0,settled=false;const blocked=[];
 openProfile(async()=>first++,r=>blocked.push(r)).then(()=>settled=true);await tick();assert.equal(first,1);assert.equal(locks.held,true);assert.equal(settled,false);
 await openProfile(async()=>second++,r=>blocked.push(r));assert.equal(second,0);assert.deepEqual(blocked,['busy']);locks.close();await tick();assert.equal(second,0);
 openProfile(async()=>second++,r=>blocked.push(r));await tick();assert.equal(second,1);
});
test('failed main startup keeps ownership because its recovery controls may still write',async t=>{
 const {openProfile}=await owner(),locks=lockManager();navigatorFor(t,locks);const reasons=[];openProfile(async()=>{throw Error('controlled boot failure');},r=>reasons.push(r));await tick();assert.deepEqual(reasons,['failed']);assert(locks.held);await openProfile(()=>assert.fail('another writer entered'),r=>reasons.push(r));assert.deepEqual(reasons,['failed','busy']);
});
for(const type of ['missing','rejected','throwing'])test(type+' Web Locks never falls back to writable startup',async t=>{
 const {openProfile}=await owner();navigatorFor(t,type==='missing'?undefined:{request(){if(type==='throwing')throw Error('denied');return Promise.reject(Error('denied'));}});const reasons=[];await openProfile(()=>assert.fail('unsafe fallback'),r=>reasons.push(r));assert.deepEqual(reasons,[type==='missing'?'unsupported':'unavailable']);
});

function legacy({data={},from='https://sankoquest.vyvanse.beer/',before={},host='sankosurvivors.quest'}={}){
 const values=new Map(Object.entries(before)),reads=[],writes=[],redirects=[],context={URL,escape,unescape,encodeURIComponent,decodeURIComponent,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),location:{hostname:host,hash:'#carry='+encodeURIComponent(Buffer.from(JSON.stringify(data)).toString('base64')),pathname:'/',search:'?fixture',replace:v=>redirects.push(v)},document:{referrer:from},history:{replaceState(){}},localStorage:{get length(){return values.size;},key:i=>[...values.keys()][i],getItem:k=>{reads.push(k);return values.get(k)??null;},setItem:(k,v)=>{writes.push([k,v]);values.set(k,v);}}};
 vm.createContext(context);const code=readFileSync(new URL('../src/carry-progress.js',import.meta.url),'utf8').replace('export function','function');const result=vm.runInContext(code+'\ncarryProgress();',context);return{result,values,reads,writes,redirects};
}
test('legacy redirects carry progress only and never read or encode account/ticket data',()=>{
 const f=legacy({host:'sankoquest.vyvanse.beer',before:{'sq-coins':'42','sq-cloud':'private-fixture','sq-ranked-live':'ticket-fixture','unrelated':'keep'}});assert.equal(f.result,false);assert.equal(f.redirects.length,1);const encoded=new URL(f.redirects[0]).hash.slice('#carry='.length),payload=JSON.parse(Buffer.from(decodeURIComponent(encoded),'base64').toString('utf8'));assert.deepEqual(payload,{'sq-coins':'42'});assert.deepEqual(f.reads,['sq-coins']);assert.deepEqual(f.writes,[]);
});
test('legacy receiving still requires the old referrer and a known valid progress value',()=>{
 const data={'sq-coins':'42','sq-gear':'{}','sq-ranked-live':'ticket-fixture','sq-cloud':'private-fixture'};const f=legacy({data});assert.deepEqual(f.writes,[['sq-coins','42'],['sq-gear','{}']]);assert.equal(f.result,true);assert.deepEqual(legacy({data,from:'https://not-the-old-game.invalid/'}).writes,[]);
});
test('legacy carry preserves existing progress and ignores malformed values',()=>{
 const f=legacy({data:{'sq-coins':'42','sq-gear':'{}','sq-muted':'not-json','sq-vol':'x'.repeat(20001)},before:{'sq-coins':'800','sq-stats':'{}'}});assert.deepEqual(f.writes,[['sq-gear','{}']]);assert.equal(f.values.get('sq-coins'),'800');
});

async function entry(t,{busy=false,recovery=false,fail=false,redirect=false,language='en',unreadable=false}={}){
 const {openProfile}=await owner(),{preferredLanguage,translateText}=await import('../src/i18n.js'),locks=lockManager();navigatorFor(t,locks);if(busy)locks.request('sqs-profile-owner',{ifAvailable:true},()=>new Promise(()=>{}));
 const nodes=new Map(),node=id=>{if(!nodes.has(id)){const classes=new Set(id==='progressrecovery'&&!recovery?['hidden']:[]);nodes.set(id,{inert:id==='game',disabled:id==='profiletry',textContent:'',classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n)},focus(){}});}return nodes.get(id);};const calls=[],context={document:{getElementById:node,documentElement:{}},navigator:{language:'en'},localStorage:{getItem(){if(unreadable)throw Error('storage blocked');return language;}},location:{reload:()=>calls.push('reload')},openProfile,preferredLanguage,translateText,carryProgress:()=>{calls.push('carry');return !redirect;},__loadMain:async()=>{calls.push('main');if(fail)throw Error('controlled startup failure');}};
 let code=readFileSync(new URL('../src/start.js',import.meta.url),'utf8').replace(/^import .+;\n/gm,'').replace("import('./main.js')",'__loadMain()');vm.createContext(context);vm.runInContext(code,context);await tick();return{nodes:node,calls,locks,document:context.document};
}
test('contended entry never migrates, imports game code or activates controls; retry reloads only on demand',async t=>{
 const f=await entry(t,{busy:true,language:'tr'});assert.deepEqual(f.calls,[]);assert(f.nodes('game').inert);assert(!f.nodes('profilegate').classList.contains('hidden'));assert.equal(f.nodes('profiletry').disabled,false);assert.equal(f.document.documentElement.lang,'tr');f.locks.close();await tick();assert.deepEqual(f.calls,[]);f.nodes('profiletry').onclick();assert.deepEqual(f.calls,['reload']);
});
test('entry owns the profile before migrating and activating the game',async t=>{
 const f=await entry(t);assert.deepEqual(f.calls,['carry','main']);assert(f.locks.held);assert.equal(f.nodes('game').inert,false);assert(f.nodes('profilegate').classList.contains('hidden'));
});
test('legacy redirect never imports or activates the old-host game',async t=>{
 const f=await entry(t,{redirect:true});assert.deepEqual(f.calls,['carry']);assert(f.nodes('game').inert);assert(!f.nodes('profilegate').classList.contains('hidden'));
});
test('an existing startup recovery screen remains usable under the retained lock',async t=>{
 const f=await entry(t,{recovery:true,fail:true});assert(f.locks.held);assert.equal(f.nodes('game').inert,false);assert(f.nodes('profilegate').classList.contains('hidden'));assert(!f.nodes('progressrecovery').classList.contains('hidden'));
});
test('other startup failure exposes reload without allowing another writer',async t=>{
 const f=await entry(t,{fail:true});assert(f.locks.held);assert(f.nodes('game').inert);assert(!f.nodes('profilegate').classList.contains('hidden'));assert.equal(f.nodes('profiletry').disabled,false);
});
test('unreadable language storage does not stop ownership or normal browser-language startup',async t=>{
 const f=await entry(t,{unreadable:true});assert.deepEqual(f.calls,['carry','main']);assert.equal(f.document.documentElement.lang,'en');
});
