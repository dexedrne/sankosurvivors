import {WEAPON_IDS} from '../src/content.js';
import test from 'node:test';import assert from 'node:assert/strict';import {createSim,playerStats,applyChoice} from '../src/sim.js';import {captureRunBuild} from '../src/run-build.js';
test('final build captures real weapon metals, evolution, continuous quality, worn ranks and actual skills',()=>{
 const s=createSim({pace:2,meta:{combat:3,smithing:2},players:[{id:'p1',adv:'ranger',gear:{head:'Iron Helmet'},gearLv:{'Iron Helmet':2}}]}),p=s.players[0];s.t=1334;s.level=36;s.kills=4321;s.over='dead';p.weapons={bow:6,staff:3};p.evo={bow:true};p.wm={bow:2};p.quality.weapons.bow=125;p.passives={haste:3};p.quality.passives.haste=45;p.belt=['cheese'];p.foodStacks.cheese=4;
 const b=captureRunBuild(s,p,{name:'Player',ranked:false,version:'0.45'}),by=title=>b.sections.find(s=>s.title===title).rows;
 assert.equal(b.name,'Player');assert.equal(b.t,1334);assert.equal(b.kills,4321);assert.equal(b.level,36);assert.equal(b.version,'0.45');assert.equal(by('Weapons').length,2);assert(by('Weapons')[0].details.includes('Evolved'));assert(by('Weapons')[0].details.includes('Effective level: 7.25'));assert(by('Passives')[0].details.includes('Effective level: 3.45'));assert.equal(by('Equipment')[0].name,'Iron Helmet +2');assert.equal(by('Skills').length,2);assert(by('Belt')[0].details.includes('Quantity: 4'));assert.equal(b.stats.find(s=>s.id==='maxHp').value,playerStats(p).maxHp);
 const saved=JSON.stringify(b);p.weapons.staff=6;p.gear.head='Runite Helmet';p.quality.weapons.bow=999;p.meta.combat=5;s.t=9999;assert.equal(JSON.stringify(b),saved,'continuing as Endless or changing profile cannot mutate the old final build');assert(!saved.includes('ticket'));assert(!saved.includes('address'));
});
test('ranked snapshots show only the in-run loadout, and bounded known slots ignore prototype/invalid additions',()=>{
 const s=createSim({pace:1,ranked:true}),p=s.players[0];p.weapons.unknown=6;p.weapons.constructor=6;p.passives.greed=0;p.gear.head='No such helmet';p.meta={combat:0,unknown:999};const b=captureRunBuild(s,p,{name:'Adventurer',ranked:true});assert.equal(b.mode,'Ranked');assert.equal(b.sections.find(s=>s.title==='Equipment').rows.length,0);assert(!b.sections.some(s=>s.title==='Skills'));assert(b.sections.find(s=>s.title==='Weapons').rows.every(r=>r.name!=='unknown'));assert(!JSON.stringify(b).includes('constructor'));
});
test('full slots, active effects and Endless growth retain their values without current profile lookups',()=>{
 const s=createSim({pace:2}),p=s.players[0];p.endlessGrowth={might:7,maxHp:2,area:3};p.buffs={speed:34,strength:5};s.endless=true;const b=captureRunBuild(s,p);assert(b.mode.includes('Endless'));assert.equal(b.sections.find(s=>s.title==='Active effects').rows.length,2);assert.equal(b.sections.find(s=>s.title==='Endless growth').rows.length,3);assert.equal(b.stats.find(s=>s.id==='maxHp').value,playerStats(p).maxHp);
});

test('all four real belt item types appear, and only food stacks its count',()=>{const s=createSim({pace:2}),p=s.players[0];p.belt=['cheese','beer','warp','pumpkin'];p.foodStacks={cheese:8,beer:99};const rows=captureRunBuild(s,p).sections.find(s=>s.title==='Belt').rows;assert.deepEqual(rows.map(r=>r.name),['Cheese','Tin of Beer','Warp Shard','Pumpkin']);assert.deepEqual(rows.map(r=>r.details[0]),['Quantity: 8','Quantity: 1','Quantity: 1','Quantity: 1']);});

test('special mode cards identify their scenario instead of ordinary casual play',()=>{const s=createSim({pace:2,variant:'wizard'});assert.match(captureRunBuild(s,s.players[0]).mode,/Wizard Invasion/);});

test('evolved weapons retain actual equipped metals and every bow retains its arrow tier',()=>{
 const s=createSim({pace:2}),p=s.players[0];p.weapons={katana:6,bow:6};p.evo={katana:true,bow:true};p.wm={katana:5,bow:2,arrow:4};
 const rows=captureRunBuild(s,p).sections[0].rows;assert(rows[0].details.includes('Runite Katana'));assert(rows[1].details.includes('Cherry Bow'));assert(rows[1].details.includes('Adamantite Arrow'));
 p.evo.bow=false;assert(captureRunBuild(s,p).sections[0].rows[1].details.includes('Adamantite Arrow'));
});
test('final stat rows include every player stat and preserve critical percentages',()=>{const s=createSim({pace:2}),p=s.players[0],stats=playerStats(p),rows=captureRunBuild(s,p).stats;assert.deepEqual(rows.map(r=>r.id).sort(),Object.keys(stats).sort());assert.equal(rows.find(r=>r.id==='critC').value,8);assert.equal(rows.find(r=>r.id==='critC').suffix,'%');});

test('visual level indicators capture actual base level and evolution independently of quality',()=>{
 const s=createSim({pace:2}),p=s.players[0];p.weapons={katana:6};p.evo={katana:true};p.quality.weapons.katana=125;p.passives={haste:3};
 const b=captureRunBuild(s,p),weapon=b.sections[0].rows[0],passive=b.sections[1].rows[0];assert.equal(weapon.level,6);assert.equal(weapon.maxLevel,6);assert.equal(weapon.evolved,true);assert.equal(passive.level,3);assert.equal(passive.maxLevel,5);assert.equal(passive.evolved,false);
});

test('earned seventh weapon and capacity survive a detached full build capture',()=>{
 const s=createSim({meta:{strength:2}}),p=s.players[0];s.level=10;p.weapons=Object.fromEntries(WEAPON_IDS.slice(0,6).map(id=>[id,1]));applyChoice(s,p,{kind:'slot',id:'weapon',level:1});applyChoice(s,p,{kind:'weapon',id:WEAPON_IDS[6],level:1,from:0,rarity:'common'});const build=captureRunBuild(s,p);assert.equal(build.sections.find(section=>section.title==='Weapons').rows.length,7);assert.equal(build.stats.find(row=>row.id==='weaponSlots').value,7);const frozen=JSON.stringify(build);p.slotUpgrade=undefined;p.weapons={katana:1};assert.equal(JSON.stringify(build),frozen);
});
