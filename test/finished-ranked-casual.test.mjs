import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const line=prefix=>source.split('\n').find(s=>s.startsWith(prefix))||'';
function block(name){const a=source.indexOf(`function ${name}(`),b=source.indexOf('\n}',a);assert(a>=0&&b>a);return source.slice(a,b+2);}
const live={run:'local-ticket',sim:'current',ended:true,name:'Fixture',log:{runs:[[90,0,0]],picks:[]}},queued={run:live.run,name:live.name,log:live.log};
function fixture(saved={},playing=false){
 const values=new Map(Object.entries(saved).map(([k,v])=>[k,JSON.stringify(v)])),before=[...values],nodes=new Map(),calls=[];
 const $=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{disabled:false,children:[],classList:{contains:x=>classes.has(x),remove:x=>classes.delete(x),add:x=>classes.add(x)},querySelector:()=>({})});}return nodes.get(id);};
 $('runvariant').children=[{dataset:{variant:'normal'},classList:{contains:()=>false}}];
 const c={readRanked:key=>JSON.parse(values.get(key)||'null'),rankedPlaying:()=>playing,coop:null,mode:'title',runStarting:false,coopLoading:false,rankedBusy:false,renderer:{},mapLoading:false,buyBusy:null,walletConnecting:null,holderChecking:null,walletRequests:0,walletModalOpen:()=>false,cloudConnecting:null,selVariant:'normal',$,showModeCategory:x=>calls.push(x),updateModePicker(){},navFocus(){},openRanked(){calls.push('ranked');},SIM_ID:'current'};
 vm.createContext(c);const start=source.slice(source.indexOf('async function startRun('),source.indexOf('  const isRanked =',source.indexOf('async function startRun(')))+"return 'casual-start';}";
 vm.runInContext([line('const rankedLive ='),line('const rankedUnfinished ='),line('const cloudCanLoad ='),line('const progressCanLoad ='),line('const canReloadGame ='),line('const canManuallyReload ='),block('openModeMenu'),start].join('\n'),c);
 return{c,calls,values,before,$};
}
for(const [name,saved]of [['finished and queued',{'sq-ranked-live':live,'sq-ranked-submit':queued}],['finished without queue',{'sq-ranked-live':live}],['queue only',{'sq-ranked-submit':queued}]]){
 test(`${name} permits Adventure without modifying ranked recovery bytes`,async()=>{const f=fixture(saved);assert.equal(await f.c.startRun(),'casual-start');assert.deepEqual(f.calls,[]);assert.deepEqual([...f.values],f.before);});
 test(`${name} permits the actual mode picker without modifying recovery bytes`,()=>{const f=fixture(saved);f.c.openModeMenu();assert.deepEqual(f.calls,['normal']);assert(!f.$('modemenu').classList.contains('hidden'));assert.deepEqual([...f.values],f.before);});
}
for(const ended of [false,undefined,'true'])test(`unfinished journal ended=${ended} still blocks casual startup and mode picker`,async()=>{const f=fixture({'sq-ranked-live':{...live,ended}});await f.c.startRun();f.c.openModeMenu();assert.deepEqual(f.calls,['ranked']);assert.deepEqual([...f.values],f.before);});
test('in-memory active ranked play stays protected even if its stored journal says ended',async()=>{const f=fixture({'sq-ranked-live':live},true);await f.c.startRun();assert.deepEqual(f.calls,['ranked']);});
for(const [name,saved,expect]of [['finished',{'sq-ranked-live':live,'sq-ranked-submit':queued},'fun'],['queue only',{'sq-ranked-submit':queued},'fun'],['active',{'sq-ranked-live':{...live,ended:false}},'ranked'],['payment',{'sq-ranked-payment':{tx:'local-fake'}},'ranked'],['payment plus finished old run',{'sq-ranked-payment':{tx:'local-fake'},'sq-ranked-live':{...live,sim:'old'}},'ranked']])test(`boot ${name} keeps the intended entry path`,async()=>{
 const f=fixture(saved),c=f.c;c.boot=()=>Promise.resolve();c.applyDmt=()=>{};c.refreshPendingTitleProgress=async()=>{};c.window={};c.cloudPull=()=>{};c.refreshRanked=async()=>{};c.walletHandoff=null;c.params={get:()=> 'fun'};c.openModeMenu=()=>f.calls.push('fun');c.recoverRankedRun=()=>assert.fail('finished journal must never auto-void/restart');
 const a=source.indexOf('boot().then(async () => {'),b=source.indexOf('// QA hooks',a);await vm.runInContext(source.slice(a,b),c);assert.deepEqual(f.calls,[expect]);assert.deepEqual([...f.values],f.before);
});
