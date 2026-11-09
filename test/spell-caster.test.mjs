import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,snapshot} from '../src/sim.js';
import {predictedView} from '../src/coop-view.js';
import {spellFixture,near} from './helpers/spell-motion-fixture.mjs';

const player=(id,x,al=true)=>({id,x,z:0,al,w:{staff:1}});
function launch(players,spellCasters){
 const f=spellFixture();
 f.frame({t:.1,alpha:.5,players,proj:[[1,'bolt',1,0,Math.PI/2,1,0,0,-1]],eproj:[],pending:{},over:null,...(spellCasters&&{spellCasters})});
 return f.projObjs.get(1);
}

for(const reverse of [false,true])test(`a co-op spell starts at its actual caster when a teammate is closer (reversed ${reverse})`,()=>{
 const players=[player('p1',.9),player('p2',0)];if(reverse)players.reverse();
 const o=launch(players,{1:'p2'});near(o.userData.x0,0);near(o.position.x,.5);
});

for(const [label,players,owner]of[
 ['missing caster',[player('p1',.9)],'gone'],
 ['dead caster',[player('p1',.9),player('p2',0,false)],'p2'],
 ['distant recovered caster',[player('p1',.9),player('p2',-9)],'p2'],
])test(`${label} does not borrow the nearby teammate as a spell origin`,()=>{
 const o=launch(players,{1:owner});near(o.userData.x0,1);near(o.position.x,1);
});

test('older snapshots without ownership keep their nearby-player launch fallback',()=>{
 const o=launch([player('p1',.9),player('p2',0)]);near(o.userData.x0,.9);near(o.position.x,.95);
});

test('two simultaneous nearby co-op casters keep independent launch origins',()=>{
 const f=spellFixture(),players=[player('p1',0),player('p2',.9)];
 f.frame({t:.1,alpha:.5,players,proj:[[1,'bolt',1,0,Math.PI/2,1,0,0,-1],[2,'bolt',.1,0,Math.PI/2,1,0,0,-1]],spellCasters:{1:'p1',2:'p2'},eproj:[],pending:{},over:null});
 near(f.projObjs.get(1).userData.x0,0);near(f.projObjs.get(2).userData.x0,.9);
});

test('the actual main view carries existing ownership through local prediction without changing simulation or wire snapshots',()=>{
 const sim=createSim({seed:8,players:[{id:'p1',adv:'wizard'},{id:'p2',adv:'wizard'}]});sim.fx=[];
 sim.proj=[{id:51,art:'bolt',owner:'p2',x:1,z:0,vx:1,vz:0,lvl:1},{id:52,art:'arrow',owner:'p1',x:2,z:0,vx:1,vz:0,lvl:1}];
 const before=JSON.stringify(sim.proj),source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 const a=source.indexOf('  const view = snapshot(sim, { maxEnemies: 420 });'),b=source.indexOf('  view.petActive =',a);assert(a>=0&&b>a);
 const view=Function('sim','snapshot',source.slice(a,b)+'\nreturn view;')(sim,snapshot);
 assert.deepEqual(view.spellCasters,{51:'p2'});assert.equal(JSON.stringify(sim.proj),before);
 const rendered=predictedView(view,{x:20,z:0,f:0,mv:1},'p1');assert.equal(rendered.spellCasters,view.spellCasters);assert.equal(rendered.players.find(p=>p.id==='p2').x,view.players.find(p=>p.id==='p2').x);
 const plain=snapshot(sim);delete view.spellCasters;assert.deepEqual(view,plain);assert(!Object.hasOwn(plain,'spellCasters'));
});
