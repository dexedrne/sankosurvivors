import test from 'node:test';
import assert from 'node:assert/strict';
import {createSim,spawnEnemy,step,snapshot} from '../src/sim.js';
import {ENEMIES} from '../src/content.js';
import {spellFixture,near} from './helpers/spell-motion-fixture.mjs';
const view=(t,x,extra={})=>({t,alpha:1,players:[{id:'p1',x:0,z:0,al:true,w:{staff:1}}],proj:[[1,'bolt',x,0,Math.PI/2,1,0,false,-1]],eproj:[],pending:{},over:null,...extra});
for(const [tier,size,duration,spread]of[['missile',1,260,.36],['blast',1.65,400,.7]])test(`${tier} flight, glow and impact keep the original factory dimensions`,()=>{
 const f=spellFixture(),o=f.sphere(0x9fe8ff,tier);f.step(o,0);
 const m=new f.THREE.Matrix4(),p=new f.THREE.Vector3(),q=new f.THREE.Quaternion(),s=new f.THREE.Vector3();o.userData.ms.parts.getMatrixAt(0,m);m.decompose(p,q,s);
 near(s.x,.1125*size);near(s.z,.1125*size*1.3);near(o.userData.ms.glow.scale.x,.54*size);
 f.burst(0,1,0,0x9fe8ff,tier,o);f.stepBursts(duration/2);o.userData.ms.parts.getMatrixAt(0,m);m.decompose(p,q,s);near(p.x,spread/2);near(s.x,.0675*size/2);near(o.userData.ms.glow.scale.x,tier==='blast'?1.35*Math.sin(Math.PI*Math.sqrt(.5)):.41);
});
test('held reward alpha cannot rewind the visible parent position',()=>{
 const f=spellFixture();f.frame({...view(.1,1),alpha:.8});f.frame({...view(.2,2),alpha:.8});const o=f.projObjs.get(1),before=o.position.clone();
 f.frame({...view(.2,2),alpha:0});assert(o.position.distanceTo(before)<1e-8,'native whole flight must hold, including its parent');
});

const actor=(f,id,x,y=0,z=0)=>{const root=new f.THREE.Group();root.position.y=y;const a={type:'chicken',px:x,pz:z,root,base:2.6/ENEMIES.chicken.h};f.actors.set(id,a);return a;};
test('a known target uses the source arc instead of ground-flat flight or a nearby decoy',()=>{
 const f=spellFixture();actor(f,7,8);actor(f,9,4,100);
 const metadata={spellTargets:{1:{target:7,speed:8,radius:.5}},spellCasters:{1:'p1'}};
 f.frame(view(1/30,0,metadata));f.frame(view(16/30,4,metadata));const o=f.projObjs.get(1);
 assert(o.position.y>1.35&&o.position.y<2,'original arc rises above its1.3m endpoints and never borrows the high decoy');assert(o.children[0].userData.ms.dir.toArray().every(Number.isFinite));
});
test('an explicit unavailable target never borrows a nearby enemy height',()=>{
 const f=spellFixture();actor(f,9,2,100);f.frame(view(1/30,1,{spellTargets:{1:{target:777,speed:8,radius:.5}}}));near(f.projObjs.get(1).position.y,1.3);
});
test('retargeting keeps the presented height continuous, then follows the new native arc',()=>{
 const f=spellFixture();actor(f,7,8);actor(f,8,12,3);const meta=target=>({spellTargets:{1:{target,speed:8,radius:.5}},spellCasters:{1:'p1'}});
 f.frame(view(1/30,0,meta(7)));f.frame(view(8/30,2,meta(7)));const o=f.projObjs.get(1),before=o.position.y;
 f.frame(view(9/30,2.2,meta(8)));near(o.position.y,before);f.frame(view(10/30,2.5,meta(8)));assert(o.position.y>before);assert(o.position.y<4.3);
 const held=o.position.clone(),dir=o.children[0].userData.ms.dir.clone();f.frame({...view(10/30,2.5,meta(8)),alpha:0});near(o.position.distanceTo(held),0);near(o.children[0].userData.ms.dir.distanceTo(dir),0);
});

test('an expired bolt cannot borrow unrelated damage as its impact',()=>{
 const f=spellFixture();f.frame(view(1/30,0,{spellHits:[]}));f.frame(view(2/30,1,{spellHits:[]}));f.events({dmg:[{x:2,z:0,v:10}]});f.frame({...view(3/30,2,{spellHits:[]}),proj:[]});assert.equal(f.bursts.length,0);
});
test('an impact follows the exact hit target rather than the nearby homing target or decoy',()=>{
 const f=spellFixture();actor(f,7,4,4);actor(f,8,3);f.frame(view(1/30,0,{spellHits:[]}));f.frame(view(2/30,1,{spellHits:[]}));
 f.events({dmg:[{x:3,z:0,v:1}]});const hit={k:'spell-hit',projectile:1,target:7,x:4,z:0,owner:'p1',lvl:1,evo:0,r:0};
 f.frame({...view(3/30,2,{spellHits:[hit]}),proj:[]});assert.equal(f.bursts.length,1);near(f.bursts[0].o.position.x,4);near(f.bursts[0].o.position.y,5.3);assert.equal(f.dyn.children.filter(o=>o.geometry?.type==='RingGeometry').length,0);
});
test('a point-blank level-one hit gets its native impact without inventing a splash',()=>{
 const f=spellFixture();actor(f,7,.2);const hit={k:'spell-hit',projectile:91,target:7,x:.2,z:0,owner:'p1',lvl:1,evo:0,r:0};
 f.frame({...view(1/30,0,{spellHits:[hit]}),proj:[]});assert.equal(f.bursts.length,1);assert.equal(f.dyn.children.filter(o=>o.geometry?.type==='RingGeometry').length,0);
});

test('hostile flight uses its actual caster and player anchor, then only its own collision',()=>{
 const f=spellFixture();actor(f,7,0);const root=new f.THREE.Group();f.playerActors.set('p2',{px:8,pz:0,root});
 const make=(t,x,extra={})=>({...view(t,0),proj:[],eproj:[[2,x,0,'ice']],enemySpellTargets:{2:{target:'p2',caster:7,speed:7,radius:.55}},spellHits:[],...extra});
 f.events({volley:[{x:.1,z:0}]});f.frame(make(1/30,0));near(f.eprojObjs.get(2).userData.ox,0);f.frame(make(16/30,3.5));const o=f.eprojObjs.get(2);assert(o.position.y>.8&&o.position.y<1.6);
 f.events({hurt:[{id:'p1',x:4,z:0}]});f.frame(make(17/30,4,{eproj:[]}));assert.equal(f.bursts.length,0);
});
test('a point-blank hostile collision bursts at the actual player, without staff splash',()=>{
 const f=spellFixture(),root=new f.THREE.Group();root.position.y=3;f.playerActors.set('p2',{px:5,pz:1,root});
 f.frame({...view(1/30,0),proj:[],spellHits:[{k:'spell-hit',projectile:92,target:'p2',x:5,z:1,enemy:1,art:'ice'}]});assert.equal(f.bursts.length,1);near(f.bursts[0].o.position.y,3.8);near(f.bursts[0].o.position.x,5);
});
test('a late target actor keeps the original known launch instead of the latest snapshot position',()=>{
 const f=spellFixture(),meta={spellTargets:{1:{target:7,speed:8,radius:.5}},spellCasters:{1:'p1'}};
 f.frame(view(1/30,0,meta));f.frame(view(2/30,1,meta));actor(f,7,8);f.frame(view(3/30,2,meta));near(f.projObjs.get(1).userData.launch.x,0);
});

test('an exact collision tick cannot gain an extra frame from clock conversion rounding',()=>{
 for(let tick=1;tick<=120;tick++){
  const f=spellFixture();f.frame(view((tick-1)/30,1,{spellHits:[]}));
  const hit={k:'spell-hit',projectile:1,target:7,x:2,z:0,owner:'p1',lvl:1,evo:0,r:0};f.frame({...view(tick/30,2,{spellHits:[hit]}),proj:[]});
  assert.equal(f.bursts.length,1,`collision tick${tick} must present its impact now`);
 }
});

test('an exact splash ID stays attached across a long render gap without a second impact',()=>{
 const f=spellFixture();actor(f,7,8);const a=view(1/30,0,{spellHits:[]}),b=view(2/30,1,{spellHits:[]});a.proj[0][5]=b.proj[0][5]=2;f.frame(a);f.frame(b);
 f.events({burst:[{k:'burst',projectile:1,x:8,z:0,r:2,owner:'p1',lvl:2,evo:0}]});const hit={k:'spell-hit',projectile:1,target:7,x:8,z:0,owner:'p1',lvl:2,evo:0,r:2};f.frame({...view(9/30,8,{spellHits:[hit]}),proj:[]});
 assert.equal(f.bursts.length,1,'one actual hit must not become a landing plus an invented point-blank impact');assert.equal(f.dyn.children.filter(o=>o.geometry?.type==='RingGeometry').length,1);
});

for(const hostile of[false,true])test(`${hostile?'hostile':'player'} landing retains the whole presented native pose at a held collision boundary`,()=>{
 const f=spellFixture(),root=new f.THREE.Group();if(hostile){root.position.y=3;f.playerActors.set('p2',{px:8,pz:0,root});actor(f,27,0);}else f.actors.set(7,{type:'colossus',px:8,pz:0,root,base:1});
 const make=(tick,x,alpha=1)=>({...view(tick/30,x),alpha,proj:hostile?[]:[[1,'bolt',x,0,Math.PI/2,1,0,0,-1]],eproj:hostile?[[2,x,0,'ice']]:[],spellTargets:{1:{target:7,speed:8,radius:.5}},enemySpellTargets:{2:{target:'p2',caster:27,speed:8,radius:.55}},spellCasters:{1:'p1'},spellHits:[]});
 f.frame(make(1,0));f.frame(make(21,16/3));const o=(hostile?f.eprojObjs:f.projObjs).get(hostile?2:1),before=o.position.clone(),matrices=Array.from(o.children[0].userData.ms.parts.instanceMatrix.array),at=f.time();assert(before.y>2);
 const next=make(22,5.6,0);next.proj=next.eproj=[];next.spellHits=[{k:'spell-hit',projectile:hostile?2:1,target:hostile?'p2':7,x:8,z:0,owner:'p1',lvl:1,evo:0,r:0,...(hostile?{enemy:1,art:'ice'}:{})}];f.frame(next);
 near(f.time(),at);near(o.position.distanceTo(before),0);assert.deepEqual(Array.from(o.children[0].userData.ms.parts.instanceMatrix.array),matrices);
 f.frame({...next,alpha:.5,spellHits:[]});assert(o.position.y>=before.y&&o.position.y<=(hostile?3.8:3));
});


test('an unseen spell uses its actual splash center while its native impact resolves the victim',()=>{
 const sim=createSim({seed:28,pace:2}),p=sim.players[0];sim.spawnAcc=-1e9;sim.bossIndex=99;sim.shrineT=sim.eventT=1e9;p.cd.katana=1e9;spawnEnemy(sim,'chicken',p.x+4,p.z);const e=sim.enemies[0];e.speed=0;const id=sim.nextId++;
 sim.proj.push({id,art:'bolt',owner:p.id,lvl:2,evo:false,x:e.x-.7,z:e.z,vx:0,vz:0,speed:0,life:1,r:.5,hit:[],dmg:1,burst:2,homing:e.id});step(sim);const v=snapshot(sim),burst=v.fx.find(f=>f.k==='burst');v.alpha=1;v.spellHits=v.fx.filter(f=>f.k==='spell-hit');const f=spellFixture(),a=actor(f,e.id,e.x,0,e.z);f.events({burst:v.fx.filter(f=>f.k==='burst')});f.frame(v);
 assert.equal(f.bursts.length,1);near(f.bursts[0].o.position.x,a.px);const rings=f.dyn.children.filter(o=>o.geometry?.type==='RingGeometry');assert.equal(rings.length,1);near(rings[0].position.x,burst.x);near(rings[0].position.z,burst.z);assert(Math.abs(rings[0].position.x-e.x)>.5);
});
