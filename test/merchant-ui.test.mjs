import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{merchantLoadoutOptions,merchantServicePrices}from'../src/merchant.js';
import{GEAR,compareGear,deltaText}from'../src/content.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function fixture({near=true,pending=false,bought=true,touchUI=false}={}){
 const a=main.indexOf('// ---- wandering merchant'),b=main.indexOf('// ---- HUD',a);assert(a>=0&&b>a,'shipped merchant interaction exists');
 const nodes=new Map(),calls=[];
 const node=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']),e={id,innerHTML:'',textContent:'',disabled:false,focus(){calls.push('focus:'+id);},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){v?classes.add(k):classes.delete(k);}},addEventListener(){},querySelectorAll(){return[];},querySelector(){return{focus(){}};}};nodes.set(id,e);}return nodes.get(id);};
 const s={pace:2,ranked:false,coop:false,t:240,players:[{id:'p1',alive:true,weapons:{katana:1},passives:{might:2},gear:{head:'Bronze Helmet'},gearLv:{}}],pending:{},merchant:{id:17,life:75,offers:[{item:'Iron Helmet',price:60,sold:false}]}};
 const env={calls,merchantLoadoutOptions,merchantServicePrices,document:{documentElement:{lang:'en'}},translateText:s=>s,confirm:()=>true,changeMerchantLoadout(...args){calls.push(['service',...args]);return true;},isTouchUI:touchUI,rewardWasShown:false,waitingForMove:false,readInput:()=>({mx:0,mz:0}),touch:{id:null},stickEl:node('stick'),containMenuTab:()=>{},$:node,sim:s,mode:'play',PLAYER:'p1',merchantNear:()=>near,clearTouch:()=>calls.push('clear'),setMapPeek:v=>calls.push('map:'+v),keys:{clear:()=>calls.push('keys')},audio:{duck:v=>calls.push('duck:'+v)},spendableRunCoins:()=>1000,runCoinOptions:()=>({multiplier:1.1,baseline:null}),GEAR,compareGear,deltaText,casketItemHTML:n=>'<b>'+n+'</b>',esc:s=>String(s).replaceAll('<','&lt;'),resumeAfterReward:()=>calls.push('resume'),showLevelUp:()=>calls.push('reward'),navFocus:()=>{},buyMerchant(...args){calls.push(['buy',...args]);if(!bought)return false;if(pending)s.pending.p1={casket:{item:'Iron Helmet'}};s.merchant.offers[0].sold=true;return true;}};
 const resume=main.slice(main.indexOf('function resumeAfterReward() {'),main.indexOf('function showLevelUp()',main.indexOf('function resumeAfterReward() {')));
 const api=Function('env',`with(env){let pendingUse=1,acc=.1;${resume};const actualResume=resumeAfterReward;resumeAfterReward=()=>{calls.push('resume');actualResume();};${main.slice(a,b)};return{openMerchant,closeMerchant,buyMerchantOffer,renderMerchant,serviceMerchantItem};}`)(env);
 return{...api,env,calls,nodes,sim:s,node};
}
test('deliberate trade freezes the UI and clears held input without advancing simulation time',()=>{const f=fixture();assert.equal(f.openMerchant(),true);assert.equal(f.env.mode,'merchant');assert(!f.node('merchant').classList.contains('hidden'));assert.equal(f.sim.t,240);assert(f.calls.includes('clear')&&f.calls.includes('keys')&&f.calls.includes('map:false')&&f.calls.includes('duck:true'));f.closeMerchant();assert.equal(f.env.mode,'play');assert(f.calls.includes('resume'));});
test('out-of-range and reward-modal interactions cannot open shopping',()=>{const f=fixture({near:false});assert.equal(f.openMerchant(),false);assert.equal(f.env.mode,'play');const g=fixture();g.sim.pending.p1={};assert.equal(g.openMerchant(),false);assert.equal(g.env.mode,'play');});
test('purchase uses captured encounter plus same GP options and transfers into the existing reward UI',()=>{const f=fixture({pending:true});f.openMerchant();assert.equal(f.buyMerchantOffer(0),true);const call=f.calls.find(Array.isArray);assert.equal(call[1],f.sim);assert.deepEqual(call.slice(2),['p1',17,0,{multiplier:1.1,baseline:null}]);assert(f.calls.includes('reward'));assert(f.node('merchant').classList.contains('hidden'));assert.equal(f.buyMerchantOffer(0),false,'a duplicate DOM event cannot buy after closing');});
test('rejected or stale purchase keeps the game paused and never targets a replacement encounter',()=>{const f=fixture({bought:false});f.openMerchant();assert.equal(f.buyMerchantOffer(0),false);assert.equal(f.env.mode,'merchant');assert(!f.calls.includes('resume'));const g=fixture();g.openMerchant();g.sim.merchant.id=18;assert.equal(g.buyMerchantOffer(0),false);assert(!g.calls.some(Array.isArray));});

test('touch Back and empty-slot purchase both retain movement re-entry using the actual reward helper',()=>{for(const purchase of[false,true]){const f=fixture({touchUI:true});f.openMerchant();purchase?f.buyMerchantOffer(0):f.closeMerchant();assert.equal(f.env.waitingForMove,true,'combat must wait for a fresh drag after shopping');assert(!f.node('movehint').classList.contains('hidden'));}});
test('controller B in actual play-loop prefix deliberately opens nearby merchant',()=>{const a=main.indexOf("  else if (mode === 'play') {",main.indexOf('function loop(ts)')),b=main.indexOf('    if (edges.a) hop();',a);assert(a>=0&&b>a);let opened=0;Function('edges','openMerchant','pause',main.slice(a+"  else if (mode === 'play') {".length,b))({b:true},()=>{opened++;return true;},()=>{});assert.equal(opened,1);});

test('loadout services show prices, and removal confirms the item and encounter before spending',()=>{
 const f=fixture();f.openMerchant();
 const view=f.node('merchantservices').innerHTML;
 assert.match(view,/Upgrade<\/span> · <span translate="no">290 GP/);
 assert.match(view,/Remove<\/span> · <span translate="no">430 GP/);
 assert.match(view,/data-merchant-item="0" data-service="remove" disabled/);
 const item={kind:'passive',id:'might',level:2};
 f.env.confirm=()=>false;
 assert.equal(f.serviceMerchantItem('remove',item,430),false);
 assert(!f.calls.some(x=>x[0]==='service'));
 f.env.confirm=()=>true;
 assert.equal(f.serviceMerchantItem('remove',item,430),true);
 const service=f.calls.find(x=>x[0]==='service');
 assert.deepEqual(service.slice(1),[f.sim,'p1',17,'remove','passive','might',2,430,{multiplier:1.1,baseline:null}]);
 assert.equal(f.node('merchantstatus').textContent,'Item removed. Slot freed.');
 assert.equal(f.env.mode,'merchant');
});

test('Ranked shop records and immediately saves actions while the pause clock is active', () => {
 const f=fixture({pending:true});
 f.sim.rankedMerchant=true; f.sim.tick=7200;
 Object.assign(f.env,{
  rankedRec:{},
  enforceRankedDeadline:()=>false,
  rankedShop(sim,rec,token){assert.equal(sim,f.sim); assert.equal(rec,this.rankedRec); f.calls.push(token); return true;},
  persistRanked:()=>f.calls.push('persist'),
  syncRankedClock:()=>f.calls.push('clock'),
  updateRankedPause:()=>f.calls.push('pause display'),
 });
 assert(f.openMerchant());
 assert.equal(f.node('merchantpause').hidden,false);
 assert(f.calls.includes('clock') && f.calls.includes('pause display'));
 assert(f.serviceMerchantItem('upgrade',{kind:'passive',id:'might',level:2},290));
 assert(f.buyMerchantOffer(0));
 assert.deepEqual(f.calls.filter(x=>typeof x === 'string' && (x.startsWith('m:') || x === 'persist')),[
  'm:7200:17:upgrade:passive:might:2:290','persist','m:7200:17:buy:0','persist',
 ]);
 assert(!f.calls.some(Array.isArray),'Ranked never uses the solo GP options');
});

test('Ranked reset prevents any further shop charges or purchased casket choices', () => {
 const f=fixture();
 f.sim.rankedMerchant=true;
 Object.assign(f.env, {
  rankedRec:{}, enforceRankedDeadline:()=>true, syncRankedClock(){}, updateRankedPause(){},
  rankedShop(){assert.fail('action after cutoff');},
 });
 assert(f.openMerchant());
 assert.equal(f.buyMerchantOffer(0),false);
 assert.equal(f.serviceMerchantItem('upgrade',{kind:'passive',id:'might',level:2},290),false);
 const first=main.indexOf('function pickCasket(i'),last=main.indexOf("$('ckwear').onclick",first);
 const pick=Function('sim','rankedRec','enforceRankedDeadline','rankedChoice',
  `const PLAYER='p1', mode='casket';${main.slice(first,last)};return pickCasket;`)(
  {pending:{p1:{casket:{},merchantPurchase:true}}},{},()=>true,()=>assert.fail('choice after cutoff'),
 );
 pick(0);
});
