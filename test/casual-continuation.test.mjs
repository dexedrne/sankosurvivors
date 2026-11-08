import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,choose,openCasket,step,TICK} from '../src/sim.js';
import {prepareRunRewards} from '../src/run-rewards.js';
import {saveRunProgress,recoverRunProgress,RUN_SAVE_KEY} from '../src/progress-import.js';
const helper=await import('../src/casual-continuation.js').catch(()=>({}));
const storage=(data={})=>{const m=new Map(Object.entries(data));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const win=()=>{const s=createSim({seed:61,pace:2});Object.assign(s,{over:'win',t:900,kills:11,bossKills:2,evolves:1,killsByType:{goblin:11}});s.players[0].coins=2;return s;};
const baseline=(s,r)=>{assert.equal(typeof helper.captureRewardBaseline,'function');return helper.captureRewardBaseline(s,r);};
test('eligible normal victory continues identical living world and refuses other modes/repeated transition',()=>{
 assert.equal(typeof helper.canContinueCasual,'function');assert.equal(typeof helper.continueCasual,'function');
 const s=win(),p=s.players[0],pending={choices:[]};s.pending.p1=pending;p.hp=17;
 const refs=[s.players,s.enemies,s.pickups,s.rng,p.gear],r=prepareRunRewards(storage(),s,{earned:127}),b=baseline(s,r);
 helper.continueCasual(s,b);assert.equal(s.endless,true);assert.equal(s.over,null);assert.equal(s.t,900);assert.equal(p.hp,17);assert.equal(s.pending.p1,pending);
 assert.deepEqual([s.players,s.enemies,s.pickups,s.rng,p.gear],refs);assert.throws(()=>helper.continueCasual(s,b));
 for(const patch of [{ranked:true},{coop:true},{endless:true},{over:'dead'},{over:null}])assert.equal(helper.canContinueCasual(Object.assign(win(),patch)),false);
 const dead=win();dead.players[0].alive=false;assert.equal(helper.canContinueCasual(dead),false);
 assert.throws(()=>helper.continueCasual(win(),b));
});
test('reward phases pay raw-source deltas with changed multiplier and cumulative personal records',()=>{
 const db=storage(),s=win();let r=prepareRunRewards(db,s,{earned:127});saveRunProgress(db,r.data);const b=baseline(s,r),before=Number(db.getItem('sq-coins'));
 helper.continueCasual(s,b);Object.assign(s,{over:'dead',t:920,kills:12,bossKills:3,evolves:2,killsByType:{goblin:12}});s.players[0].coins=3;
 assert.equal(helper.phaseCoins(s,{baseline:b,multiplier:2}),12); // (one kill coin +3 pickup +2 Endless) *2
 r=prepareRunRewards(db,s,{earned:12,baseline:b});saveRunProgress(db,r.data);
 assert.equal(Number(db.getItem('sq-coins'))-before,12);const stats=JSON.parse(db.getItem('sq-stats'));assert.equal(stats.kills,12);assert.equal(stats.bosses,3);assert.equal(stats.evolves,2);assert.equal(stats['kills.goblin'],12);
 const best=JSON.parse(db.getItem('sq-bests'));assert.equal(best['greentown:n:r'].kills,11);assert.equal(best['greentown:n:e'].kills,12);assert.equal(best['greentown:n:e'].t,920);
});
test('old duplicate alch pays only its top-up while identical new loot is independently settled',()=>{
 const db=storage({'sq-bank':'["Iron Helmet"]'}),s=win();s.loot=['Iron Helmet','Iron Helmet'];s.alched=[];s.alchedLootIndices=[];
 let r=prepareRunRewards(db,s,{earned:127});saveRunProgress(db,r.data);const b=baseline(s,r),before=Number(db.getItem('sq-coins'));
 helper.continueCasual(s,b);s.over='dead';s.loot.push('Iron Helmet');s.alched=['Iron Helmet','Iron Helmet'];s.alchedLootIndices=[1,2];s.players[0].alch=70;
 assert.equal(helper.phaseCoins(s,{baseline:b,multiplier:1}),45); // old35-25 plus new35
 r=prepareRunRewards(db,s,{earned:45,baseline:b});saveRunProgress(db,r.data);
 assert.equal(Number(db.getItem('sq-coins'))-before,45);assert.equal(r.loot.length,1);assert.equal(r.loot[0].wasAlched,true);assert.equal(JSON.parse(db.getItem('sq-stats')).caskets,3);
});
test('fresh old item later alched keeps full alch and exact earlier alched duplicate does not hide a sale',()=>{
 const db=storage(),s=win();s.loot=['Iron Helmet','Iron Helmet'];s.alched=['Iron Helmet'];s.alchedLootIndices=[1];s.players[0].alch=35;
 const r=prepareRunRewards(db,s,{earned:162});assert.equal(r.loot[0].wasAlched,false);assert.equal(r.loot[1].wasAlched,true);saveRunProgress(db,r.data);const b=baseline(s,r);
 helper.continueCasual(s,b);s.over='dead';s.alched.push('Iron Helmet');s.alchedLootIndices.push(0);s.players[0].alch=70;
 assert.equal(helper.phaseCoins(s,{baseline:b,multiplier:1}),35);
});
test('casket occurrence identity survives queued manual and timeout alch; pace1 and ranked stay unextended',()=>{
 const s=createSim({pace:2}),p=s.players[0];s.loot=['Iron Helmet','Iron Helmet'];p.casketQ=['Iron Helmet','Iron Helmet'];p.casketLootIndices=[0,1];
 assert.equal(openCasket(s,p),true);assert.equal(s.pending.p1.lootIndex,0);choose(s,'p1',0);
 assert.equal(s.pending.p1.lootIndex,1);s.pending.p1.rec=1;s.pending.p1.left=0;step(s,{},TICK);
 assert.deepEqual(s.alchedLootIndices,[1]);
 assert.equal(Object.hasOwn(createSim({pace:1}),'alchedLootIndices'),false);assert.equal(Object.hasOwn(createSim({pace:2,ranked:true}),'alchedLootIndices'),false);
});
test('normal and delta rewards reuse the existing journal across failed cleanup and reload',()=>{
 const db=storage(),s=win(),r=prepareRunRewards(db,s,{earned:127}),remove=db.removeItem;db.removeItem=()=>{throw Error('denied');};
 assert.throws(()=>saveRunProgress(db,r.data));db.removeItem=remove;assert.equal(recoverRunProgress(db),true);const b=baseline(s,r),normal=Number(db.getItem('sq-coins'));
 helper.continueCasual(s,b);s.over='dead';s.kills=12;const next=prepareRunRewards(db,s,{earned:1,baseline:b});db.removeItem=()=>{throw Error('denied');};assert.throws(()=>saveRunProgress(db,next.data));db.removeItem=remove;saveRunProgress(db,next.data);
 assert.equal(Number(db.getItem('sq-coins')),normal+1);assert.equal(db.getItem(RUN_SAVE_KEY),null);assert.equal(JSON.parse(db.getItem('sq-stats')).kills,12);
});
test('captured score submissions coalesce, retry the first payload, and never mark another result sent',async()=>{
 assert.equal(typeof helper.submitCasualResult,'function');const a={},b={};let release;const bodies=[];
 const send=body=>{bodies.push(body);return new Promise(r=>release=r);};
 const first=helper.submitCasualResult(a,{name:'first',t:900},send);const same=helper.submitCasualResult(a,{name:'changed',t:999},send);assert.equal(first,same);assert.equal(bodies.length,1);
 release({ok:false});await first;const retry=helper.submitCasualResult(a,{name:'changed',t:999},send);assert.deepEqual(bodies[1],{name:'first',t:900});release({ok:true,rank:3});await retry;assert.equal(a.sent,true);assert.equal(b.sent,undefined);
 assert.equal((await helper.submitCasualResult(a,{},send)).ok,true);assert.equal(bodies.length,2);
});

test('real collected caskets assign acquisition indices through every queued choice',async()=>{
 const {GEAR}=await import('../src/content.js');const s=createSim({seed:61,pace:2}),p=s.players[0];
 for(const [name,g] of Object.entries(GEAR))if(!p.gear[g.slot])p.gear[g.slot]=name;
 s.pickups=[0,1,2].map(i=>({id:i,kind:'casket',x:p.x,z:p.z}));step(s,{},TICK);
 assert.equal(s.loot.length,3);assert.equal(s.pending.p1.lootIndex,0);assert.deepEqual(p.casketLootIndices,[1,2]);
 choose(s,'p1',1);choose(s,'p1',0);choose(s,'p1',1);
 assert.deepEqual(s.alchedLootIndices,[0,2]);assert.deepEqual(s.alched,[s.loot[0],s.loot[2]]);assert.equal(p.casketLootIndices.length,0);
});

test('a quest reached only in Endless pays once using the current merged profile',()=>{
 const db=storage(),s=win();s.kills=299;s.killsByType={goblin:299};const r=prepareRunRewards(db,s,{earned:169});saveRunProgress(db,r.data);const b=baseline(s,r),normal=Number(db.getItem('sq-coins'));
 assert.ok(!JSON.parse(db.getItem('sq-quests')).includes('goblins'));helper.continueCasual(s,b);s.over='dead';s.kills=300;s.killsByType.goblin=300;
 // Same-owner cloud reconciliation may add progress between the two finishes.
 db.setItem('sq-coins',String(normal+7));const stats=JSON.parse(db.getItem('sq-stats'));stats.kills+=10;db.setItem('sq-stats',JSON.stringify(stats));
 const next=prepareRunRewards(db,s,{earned:1,baseline:b});assert.deepEqual(next.quests.map(q=>q.id),['goblins']);saveRunProgress(db,next.data);
 assert.equal(Number(db.getItem('sq-coins')),normal+7+1+150);assert.equal(JSON.parse(db.getItem('sq-stats')).kills,310);assert.equal(JSON.parse(db.getItem('sq-quests')).filter(q=>q==='goblins').length,1);
});
