import test from 'node:test';
import assert from 'node:assert/strict';
import * as physics from '../src/sim.js';
import {createCoopRun} from '../src/coop-run.js';
const game={protocol:1,epoch:'00112233445566778899aabbccddeeff',build:'test-local',sim:'e2c1419b0907',ground:'0',seed:711,map:'greentown',hard:false,endless:false,players:['p1','p2'].map(id=>({id,loadout:{name:id,adv:'adventurer',meta:{},gear:{},gearLv:{},cleared:[]}}))};
function pair(){
 let time=0;const down=[],up=[];
 const host=createCoopRun({start:game,localId:'p1',ground:null,send:m=>down.push(m),now:()=>time});
 const guest=createCoopRun({start:game,localId:'p2',ground:null,send:m=>up.push(m),now:()=>time});
 for(const run of [host,guest]){const s=run.sim;s.spawnAcc=-1e9;s.bossIndex=99;s.eventT=s.shrineT=1e9;run.begin(0);}
 const deliver=()=>{while(up.length){const m=up.shift();if(m.data.move)host.accept({hero:1,data:m.data});}while(down.length)guest.accept(down.shift().data);};
 const tick=()=>{deliver();host.advance();host.flush();deliver();};tick();
 return {host,guest,up,down,deliver,tick,at:n=>time=n};
}
test('shared walking and bounds match ordinary simulation without consuming RNG or changing source state',()=>{
 assert.equal(typeof physics.walkPlayer,'function');assert.equal(typeof physics.boundPlayer,'function');
 for(const pace of [1,2])for(const move of [[1,0],[1,1],[.005,0],[0,0],[-1,.4]]){
  const a=physics.createSim({seed:711}),b=physics.createSim({seed:711});a.pace=b.pace=pace;
  const p=a.players[0],body={...p},view={ground:a.ground,map:a.map,pace};const before=structuredClone({...a,rng:null});
  physics.walkPlayer(view,body,...move,physics.playerStats(p).speed,physics.TICK);physics.boundPlayer(view,body);
  assert.deepEqual({...a,rng:null},before);assert.equal(a.rng(),b.rng());
  physics.step(a,{[p.id]:{mx:move[0],mz:move[1]}});
  assert.deepEqual([body.x,body.z,body.face,body.moving],[p.x,p.z,p.face,p.moving]);
 }
});
test('guest picture starts and stops immediately while authority and canonical hashes stay unchanged',()=>{
 const p=pair();assert.equal(typeof p.guest.pose,'function');assert.equal(p.host.pose(),null);
 const x=p.guest.sim.players[1].x,hash=p.guest.hash();p.guest.input(1,0);p.guest.pose();p.at(16);
 assert(p.guest.pose().x>x);assert.equal(p.guest.hash(),hash);assert.equal(p.guest.sim.players[1].x,x);
 p.guest.input(0,0);const stopped=p.guest.pose().x;p.at(32);assert.equal(p.guest.pose().x,stopped);assert.equal(p.guest.pose().mv,false);
 p.tick();assert.equal(p.host.hash(),p.guest.hash());
});
test('short tap remains visible before either echo and delayed stop settles after confirmed echo',()=>{
 const p=pair();assert.equal(typeof p.guest.pose,'function');const x=p.guest.sim.players[1].x;
 p.guest.input(1,0);p.guest.pose();p.at(15);const moving=p.guest.pose().x;assert(moving>x);
 p.guest.input(0,0);p.guest.pose();p.at(180);assert.equal(p.guest.pose().x,moving);
 p.tick();p.at(300);assert(Math.abs(p.guest.pose().x-p.guest.sim.players[1].x)<.1);assert.equal(p.host.hash(),p.guest.hash());
});
test('prediction lead freezes at budget and stale packets do not renew its timeline',()=>{
 const p=pair();assert.equal(typeof p.guest.pose,'function');p.guest.input(1,0);p.guest.pose();
 p.at(300);const capped=p.guest.pose();const x=capped.x;p.at(420);assert.equal(p.guest.pose().x,x);
 p.at(520);assert.equal(p.guest.pose().x,x);assert.equal(p.guest.pose().mv,false);
 p.tick();p.at(536);assert(p.guest.pose());assert.equal(p.host.hash(),p.guest.hash());
});
test('fresh neutral host frames renew the lead budget when simulation runs slower than wall time',()=>{
 const p=pair();p.at(1000);p.tick();const x=p.guest.pose().x;
 p.at(1080);p.guest.input(1,0);p.guest.pose();
 p.at(1180);assert(p.guest.pose().x>x+.1);
 assert.equal(p.host.hash(),p.guest.hash(),'only the rendered body predicts');
});
test('choices, death, tumble, hold and close fall back; recovery starts a fresh picture',()=>{
 const p=pair();assert.equal(typeof p.guest.pose,'function');const s=p.guest.sim,hero=s.players[1];
 p.guest.input(1,0);p.at(16);assert(p.guest.pose());
 for(const [pause,resume] of [
  [()=>s.pending.p1={choices:[],left:20},()=>delete s.pending.p1],
  [()=>hero.alive=false,()=>hero.alive=true],
  [()=>hero.rollT=.2,()=>hero.rollT=0],
 ]){pause();assert.equal(p.guest.pose(),null);resume();}
 p.guest.hold();assert.equal(p.guest.pose(),null);p.guest.begin(p.guest.frame);p.tick();assert(p.guest.pose());
 p.guest.close('left');assert.equal(p.guest.pose(),null);
});
test('echoes include unchanged refreshes only after application; duplicate packets never acknowledge new samples',()=>{
 const p=pair();assert.equal(typeof p.guest.pose,'function');p.guest.input(1,0);p.deliver();p.host.advance();p.host.flush();const first=p.down.shift();
 assert.equal(first.data.events.find(e=>e.hero===1).moveSeq,1);p.guest.accept(first.data);assert.equal(p.host.hash(),p.guest.hash());
 p.at(201);p.guest.flushInput();assert(p.up.some(m=>m.data.moveSeq===2));p.deliver();p.host.advance();p.host.flush();const refresh=p.down.shift();assert.equal(refresh.data.events.find(e=>e.hero===1).moveSeq,2);
 p.guest.input(0,0);p.guest.pose();p.guest.accept(first.data);p.at(220);assert.equal(p.guest.pose().mv,false);
 p.guest.accept(refresh.data);assert.equal(p.host.hash(),p.guest.hash());
});

test('copied movement respects walls, solid corners, map bounds, and leaves cold collision caches off authority',()=>{
 assert.equal(typeof physics.walkPlayer,'function');
 const sim=physics.createSim({seed:711}),ground={n:16,cell:true,blocked:new Uint8Array(256),walls:new Uint8Array(256),fences:new Uint8Array(256)};
 sim.ground=ground;sim.map={...sim.map,cx:8,cz:8,r:7};const view={ground,map:sim.map,pace:2};
 ground.walls[8*16+8]=2;ground.fences[8*16+8]=2;
 const body={x:8.5,z:8.5,face:0};for(let i=0;i<20;i++)physics.walkPlayer(view,body,1,0,6,physics.TICK);
 assert(body.x<8.66,'wall body margin stops at east edge');assert(!Object.hasOwn(sim,'_W'));assert(!Object.hasOwn(sim,'_wg'));
 body.x=5.9;body.z=5.9;ground.blocked[5*16+6]=1;ground.blocked[6*16+5]=1;
 physics.walkPlayer(view,body,1,1,6,physics.TICK);assert(body.x<6&&body.z<6,'no blocked-corner shortcut');
 body.x=18;body.z=8;physics.boundPlayer(view,body);assert.equal(body.x,15);assert.equal(body.z,8);
});
test('teleport discards the old picture instead of gliding through geometry',()=>{
 const p=pair();p.guest.input(1,0);p.guest.pose();p.at(40);const before=p.guest.pose().x;
 for(const run of [p.host,p.guest])run.sim.players[1].x+=10;
 p.tick();const pose=p.guest.pose();assert(pose.x>before+9);assert(Math.abs(pose.x-p.guest.sim.players[1].x)<.01);assert.equal(p.host.hash(),p.guest.hash());
});
test('duplicate frames cannot echo a newer stop or restart stale render advancement',()=>{
 const p=pair();p.guest.input(1,0);p.deliver();p.host.advance();p.host.flush();const applied=p.down.shift();p.guest.accept(applied.data);p.guest.pose();
 p.at(20);p.guest.pose();p.guest.input(0,0);const stopped=p.guest.pose().x;
 const duplicate={...applied.data,events:applied.data.events.map(e=>({...e,move:[0,0],moveSeq:2}))};
 p.at(150);p.guest.accept(duplicate);assert.equal(p.guest.pose().x,stopped);
 p.at(600);p.guest.accept(duplicate);assert.equal(p.guest.pose().x,stopped);assert.equal(p.guest.pose().mv,false);
});
test('thousands of rapid local samples keep newest direction usable within bounded replay',()=>{
 const p=pair();p.guest.pose();const hash=p.guest.hash();
 for(let i=1;i<=2000;i++){p.at(i/10);p.guest.input(i%2?1:-1,0);}
 p.at(210);p.guest.input(0,1);const pose=p.guest.pose();assert(pose.mv);assert.equal(pose.f,0);assert.equal(p.guest.hash(),hash);
 p.at(520);assert.equal(p.guest.pose().mv,false);
});

test('local pause resets cannot make an old host frame fresh again',()=>{
 const p=pair();p.at(600);p.guest.resetInput();p.at(610);p.guest.input(1,0);
 assert.equal(p.guest.pose(),null,'stale link remains stale until an actual confirmed step');
});

test('settling correction preserves stopped facing instead of facing the correction vector',()=>{
 const p=pair();p.guest.input(1,0);p.guest.pose();p.at(20);const facing=p.guest.pose().f;
 p.guest.input(0,0);p.guest.pose();for(const run of [p.host,p.guest])run.sim.players[1].z+=.5;
 p.tick();p.at(80);assert.equal(p.guest.pose().f,facing);assert.equal(p.guest.pose().mv,false);
});

test('a wall that blocks correction snaps to the valid confirmed side',async()=>{
 const {createMovementPrediction}=await import('../src/coop-prediction.js');let time=0;
 const sim=physics.createSim({seed:711}),ground={n:16,cell:true,blocked:new Uint8Array(256),walls:new Uint8Array(256)};
 sim.ground=ground;sim.map={...sim.map,cx:8,cz:8,r:7};const p=sim.players[0];p.x=8.5;p.z=8.5;
 ground.walls[8*16+8]=2;const prediction=createMovementPrediction({sim,index:0,now:()=>time});prediction.confirm([]);
 prediction.sample([127,0]);prediction.render(true);time=20;assert(prediction.render(true).x<9);
 const seq=prediction.sample([0,0]);p.x=9.4;prediction.confirm([{hero:0,move:[0,0],moveSeq:seq}]);
 time=100;assert.equal(prediction.render(true).x,9.4);assert.equal(p.x,9.4);
});
