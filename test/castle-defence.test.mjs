import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSim, step, spawnEnemy, snapshot, walkable, TICK } from '../src/sim.js';
import { ENEMIES, MAP_BY_ID } from '../src/content.js';
import { unpackGround } from '../src/ground-pack.js';
import { cleanRoomSettings } from '../src/coop-protocol.js';
import { prepareRunRewards } from '../src/run-rewards.js';
import { translateText } from '../src/i18n.js';
const castle = extra => createSim({ variant: 'castle', seed: 31, ...extra });
const quiet = s => { s.players[0].weapons = {}; s.players[0].inv = 1e6; return s; };
const run = (s,n) => { for(let i=0;i<n;i++){s.pending={};step(s);} };
const ground = () => unpackGround(readFileSync(new URL('../tools/vercel-api/ground.bin',import.meta.url)));
test('castle is solo Standard Greentown Endless with selected bonuses and gate start',()=>{
 const s=castle({meta:{combat:2},players:[{id:'p1',adv:'knight',gear:{head:'Iron Helmet'}}]});
 assert.equal(s.endless,true);assert.equal(s.map.id,'greentown');assert.deepEqual([s.players[0].x,s.players[0].z],[371.5,340.5]);
 assert.equal(s.players[0].adv,'knight');assert.equal(s.players[0].meta.combat,2);assert.deepEqual(s.players[0].gear,{head:'Iron Helmet'});
 assert.deepEqual(s.castle,{x:369.5,z:340.5,hp:250,maxHp:250});
 assert.deepEqual(snapshot(s).castle,s.castle);assert.notEqual(snapshot(s).castle,s.castle);
 for(const extra of [{coop:true,players:[{id:'p1'},{id:'p2'}]},{ranked:true},{pace:1},{hard:true},{map:MAP_BY_ID.oasis},{endAt:1}])assert.throws(()=>castle(extra));
 assert.equal(cleanRoomSettings({protocol:1,build:'test',sim:'8117e1f2d413',map:'greentown',hard:false,endless:true,variant:'castle'}),null);
 assert.equal(createSim().castle,undefined);assert.equal(createSim({pace:1}).variant,undefined);
});
test('authored waves are deterministic mixed humans, escalating and bounded at 32 with no ambient systems',()=>{
 const a=quiet(castle()),b=quiet(castle());
 for(const s of [a,b]){
  s.castle.hp=1e9;
  for(let wave=1;wave<=40;wave++){
   s.t=(wave-1)*35;step(s);assert.equal(s.wave,wave);
   assert.ok(s.enemies.length<=32);assert.ok(s.enemies.every(e=>['protestm','protestf'].includes(e.type)));
   assert.equal(s.event,null);assert.equal(s.shrines.length,0);assert.equal(s.hazards.length,0);assert.equal(s.merchant,null);
   if(wave===1){assert.equal(s.enemies.length,6);assert.ok(s.enemies.some(e=>e.type==='protestf'));assert.ok(s.enemies.some(e=>e.type==='protestm'));}
  }
 }
 assert.deepEqual(snapshot(a),snapshot(b));assert.equal(a.over,null);
 const m=ENEMIES.protestm,f=ENEMIES.protestf;for(const key of ['hp','speed','r','dmg','xp'])assert.equal(m[key],f[key]);
 for(const map of Object.values(MAP_BY_ID))assert.ok(map.pool.every(e=>!['protestm','protestf'].includes(e.type)));
});
test('real native west lane routes to castle even with player closer and away, without player recycling',()=>{
 const s=quiet(castle({ground:ground()}));s.nextWave=1e9;const p=s.players[0];p.x=348.5;p.z=340.5;
 spawnEnemy(s,'protestm',350.5,340.5);const e=s.enemies[0];assert.ok(walkable(s,e.x,e.z));
 run(s,90);assert.ok(e.x>355,'walks east to castle, away from closer player');
 p.x=280.5;p.z=280.5;run(s,600);assert.ok(s.castle.hp<250,'reaches and attacks through actual west gate');
 assert.ok(Math.hypot(e.x-s.castle.x,e.z-s.castle.z)<2,'never teleported to far-away defender');
 const f=s.flow,k=(Math.floor(s.castle.z)-f.z0)*121+Math.floor(s.castle.x)-f.x0;assert.equal(f.dist[k],0);
});
test('castle contact uses per-enemy cooldown, dead enemies cannot hit, walls block attacks and HP zero ends once',()=>{
 const s=quiet(castle());s.nextWave=1e9;spawnEnemy(s,'protestf',368.5,340.5);const e=s.enemies[0];e.speed=0;
 step(s);const hp=s.castle.hp;assert.ok(hp<250);run(s,15);assert.equal(s.castle.hp,hp);run(s,30);assert.ok(s.castle.hp<hp);
 e.hp=0;const deadHp=s.castle.hp;run(s,60);assert.equal(s.castle.hp,deadHp);
 const dead=quiet(castle());dead.nextWave=1e9;spawnEnemy(dead,'protestm',368.5,340.5);dead.castle.hp=1;step(dead);assert.equal(dead.castle.hp,0);assert.equal(dead.over,'dead');
 const tick=dead.tick;step(dead);assert.equal(dead.tick,tick);
 const grid=ground();grid.walls[340*512+368]|=2;const wall=quiet(castle({ground:grid}));wall.nextWave=1e9;spawnEnemy(wall,'protestm',368.5,340.5);wall.enemies[0].speed=0;step(wall);assert.equal(wall.castle.hp,250);
});
test('defender death remains a loss and player contact still hurts while attackers seek castle',()=>{
 const s=castle();s.nextWave=1e9;s.players[0].weapons={};spawnEnemy(s,'protestm',s.players[0].x-.7,s.players[0].z);s.players[0].hp=1;
 step(s);assert.equal(s.players[0].alive,false);assert.equal(s.over,'dead');assert.ok(s.castle.hp>0);
});
test('castle results save only GP and gear, with no records, campaign, quests or stats',()=>{
 const s=castle();s.over='dead';s.t=300;s.kills=500;s.loot=['Iron Helmet'];
 const receipt=prepareRunRewards({getItem:()=>null},s,{earned:25});
 assert.deepEqual(Object.keys(receipt.data).sort(),['sq-bank','sq-coins']);assert.deepEqual(receipt.quests,[]);assert.equal(receipt.personalBest,null);assert.deepEqual(receipt.cleared,[]);
});
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const block=name=>{const start=main.indexOf(`function ${name}(`),end=main.indexOf('\n}',start);assert.ok(start>=0&&end>start);return main.slice(start,end+2);};
test('castle selection forces Greentown, preserves hero and restores ordinary map',async()=>{
 const result=await Function(`return(async()=>{
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{checked:false,disabled:false,textContent:'',children:[],classList:{toggle(){}},setAttribute(){}});return nodes.get(id);};
 let mode='title',selVariant='normal',selMap='swamp',fieldMap='swamp',hardOn=true,endlessOn=true,mapLoading=false,runStarting=false,coop=null,window={},loadedMapId='swamp';
 const VARIANTS={normal:{},castle:{}},MODE_INFO={castle:'Solo only'},WISE_OLD_MAN={},BOSS_KIT={},ADVENTURER_BY_ID={};
 const pickMap=async id=>{selMap=loadedMapId=id;},buildAdventurers=()=>{},banner=()=>{};
 ${block('updateModePicker')} async ${block('selectVariant')}
 await selectVariant('castle');const selected={map:selMap,name:$('modename').textContent,start:$('start').textContent};await selectVariant('normal');return{selected,map:selMap};})()` )();
 assert.deepEqual(result,{selected:{map:'greentown',name:'Castle Defence',start:'Defend the castle'},map:'swamp'});
});
test('castle co-op guard is early and translated',()=>{
 let message='';Function('banner',`const selVariant='castle',mode='title',canManuallyReload=()=>false;return ${block('openCoop')};`)(v=>message=v)();
 assert.equal(message,'Castle Defence is solo only. Choose another mode for co-op.');
 for(const lang of ['tr','es','fil'])for(const text of ['Castle Defence','Defend the castle','Castle health','Castle destroyed','Defender fallen',message,'Choose Castle Defence ›','Defend Greentown castle against endless waves of human DMT protesters.','Solo only. Defend the west gate with your selected adventurer. Castle destruction or defender death ends the run. Earn GP and gear; campaign progress and normal leaderboards stay separate.'])assert.notEqual(translateText(text,lang),text,`${lang}: ${text}`);
});

test('castle HUD exposes objective health and its next authored wave',()=>{
 const lines=main.split('\n').filter(line=>line.includes("$('modeprogress').innerHTML"));
 const html=Function(`const sim={variant:'castle',wave:3,nextWave:105,t:71,castle:{hp:122,maxHp:250}},VARIANTS={castle:{name:'Castle Defence'}},node={},$=()=>node,fmtT=String;${lines.join('\n')};return node.innerHTML;`)();
 assert.match(html,/Castle Defence/);assert.match(html,/Wave<\/span> 3/);assert.match(html,/Next wave<\/span> 34/);assert.match(html,/Castle health<\/span> 122\/250/);
 assert.ok(html.startsWith('<span>Castle health</span> 122/250'),'objective health stays first when narrow screens truncate the mode line');
});
test('late-game native-lane replenishment stays mixed and bounded without ambient attacks',()=>{
 const s=quiet(castle({ground:ground()}));s.castle.hp=1e9;
 for(let wave=0;wave<52;wave++){
  s.t=wave*36;run(s,60);s.fx=[];
  assert.ok(s.enemies.length>0&&s.enemies.length<=32);assert.ok(s.enemies.every(e=>!ENEMIES[e.type].boss&&e.hp>0));
  assert.ok(s.enemies.some(e=>e.type==='protestm'));assert.ok(s.enemies.some(e=>e.type==='protestf'));
  assert.equal(s.shrines.length,0);assert.equal(s.hazards.length,0);assert.equal(s.eproj.length,0);assert.equal(s.event,null);assert.equal(s.merchant,null);
  if(wave%2===0)s.enemies=[];
 }
 assert.equal(s.wave,52);assert.equal(s.over,null);
});
test('upgrade hold freezes castle, wave and contact clocks; fresh run owns fresh objective',()=>{
 const s=quiet(castle());s.nextWave=1e9;spawnEnemy(s,'protestm',368.5,340.5);step(s);
 const hp=s.castle.hp,t=s.t,cd=s.enemies[0].atkCd,wave=s.wave;s.pending={p1:{choices:[],left:25}};step(s);
 assert.equal(s.castle.hp,hp);assert.equal(s.t,t);assert.equal(s.enemies[0].atkCd,cd);assert.equal(s.wave,wave);
 const restarted=castle();assert.equal(restarted.castle.hp,250);assert.notEqual(restarted.castle,s.castle);assert.equal(restarted.wave,0);
});

test('native source body and short-hair files carry the original female Key 1 morph',()=>{
 for(const part of ['Chest/Styles/Shoulders','Arms/Nude','Legs/Styles/Pants','Head/Bald','Head/Neck','Head/Styles/Short']){
  const b=readFileSync(new URL(`../public/assets/models/playerCharacter/${part}.glb`,import.meta.url)),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  assert.ok(j.meshes.some(m=>m.extras?.targetNames?.includes('Key 1')),part);
 }
});

test('renderer builds both protesters with their native body spec, unarmored clothes and placards',async()=>{
 const THREE=await import('three'),render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
 const start=render.indexOf('  function makeEnemy('),end=render.indexOf('\n  function batchEnemy(',start),specs=[];
 const kit={build:spec=>{specs.push(spec);return{root:new THREE.Group(),master:new THREE.Group(),setMoving(){},spec};}};
 const create=Function('THREE','kit','ENEMIES',`const protestBoard=new THREE.PlaneGeometry(),protestPole=new THREE.BoxGeometry(),protestWood=new THREE.MeshBasicMaterial(),protestInk=new THREE.MeshBasicMaterial();${render.slice(start,end)};return makeEnemy;`)(THREE,kit,ENEMIES);
 const male=create('protestm',2),female=create('protestf',3);
 assert.equal(specs[0].body,'A');assert.equal(specs[1].body,'B');for(const spec of specs){assert.deepEqual(spec.armor,{});assert.equal(spec.hair,'Short');assert.equal(spec.h,1.6);}
 assert.equal(male.root.children.length,2);assert.equal(female.root.children.length,2);assert.notEqual(specs[0].shirt,specs[1].shirt);
});

test('distant defender tumble uses local native reachability while enemy flow stays on castle',()=>{
 const s=quiet(castle({ground:ground()}));s.nextWave=1e9;s.flowT=1;
 const p=s.players[0];p.x=371.5;p.z=275.5;
 const normal=quiet(createSim({seed:31,ground:ground()}));normal.spawnAcc=-1000;normal.flowT=1;normal.players[0].x=p.x;normal.players[0].z=p.z;
 spawnEnemy(s,'protestm',350.5,340.5);const enemy=s.enemies[0],objectiveFlow=s.flow;
 step(s,{p1:{mx:0,mz:-1,use:4}});step(normal,{p1:{mx:0,mz:-1,use:4}});
 assert.equal(p.z,normal.players[0].z,'same valid native first step as normal');
 assert.ok(p.z<275.3,`distant tumble moved to ${p.z}`);assert.equal(p.rollCd,5);
 assert.equal(s.flow,objectiveFlow,'player reachability must not replace or overwrite the objective field');
 const f=s.flow,k=(Math.floor(s.castle.z)-f.z0)*121+Math.floor(s.castle.x)-f.x0;assert.equal(f.dist[k],0);
 for(let i=0;i<15;i++){s.pending={};step(s,{p1:{mx:0,mz:-1}});step(normal,{p1:{mx:0,mz:-1}});assert.equal(p.z,normal.players[0].z,'same native walls and reachability throughout tumble');}
 assert.ok(p.z<275.3,'tumble advances up to the native wall');assert.ok(enemy.x>351,'attacker continues east toward castle during distant roll');
 run(s,700);assert.ok(s.castle.hp<250,'attacker reaches castle after the remote roll');
 assert.equal(p.rollFlow,undefined,'finished tumble releases its temporary field');
});
