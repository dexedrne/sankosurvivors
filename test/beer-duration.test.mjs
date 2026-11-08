import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSim,step,useBelt,TICK} from '../src/sim.js';
import {translateText} from '../src/i18n.js';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function hud(sim,player='p1'){
 const start=source.indexOf('function updateBeerHud() {'),end=source.indexOf('\n}',start);
 assert(start>=0&&end>start,'Beer boost HUD exists');
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',innerHTML:''});return nodes.get(id)};
 const update=Function('sim','PLAYER','$','imgTag',source.slice(start,end+2)+';return updateBeerHud;')(sim,player,$,n=>`<img alt="" data-item="${n}">`);
 return{update,$};
}
test('actual beer use displays eight seconds, counts down, stacks and expires',()=>{
 const sim=createSim(),p=sim.players[0],h=hud(sim);h.update();assert.equal(h.$('beerboost').hidden,true);
 p.belt=['beer','beer'];assert(useBelt(sim,'p1',0));h.update();assert.equal(h.$('beerboost').hidden,false);assert.equal(h.$('beerleft').textContent,'8s');
 for(let i=0;i<31;i++)step(sim,{},TICK);h.update();assert.equal(h.$('beerleft').textContent,'7s');
 assert(useBelt(sim,'p1',0));h.update();assert.equal(h.$('beerleft').textContent,'15s');
 for(let i=0;i<452;i++)step(sim,{},TICK);h.update();assert.equal(h.$('beerboost').hidden,true);
});
test('held reward state and resumed buff show actual simulation time, never wall time',()=>{
 const sim=createSim(),p=sim.players[0],h=hud(sim);p.buffs.speed=3.2;h.update();assert.equal(h.$('beerleft').textContent,'4s');
 sim.pending.p1={left:30,choices:[]};for(let i=0;i<90;i++)step(sim,{},TICK);h.update();assert.equal(p.buffs.speed,3.2);assert.equal(h.$('beerleft').textContent,'4s');
 delete sim.pending.p1;step(sim,{},TICK);h.update();assert.equal(h.$('beerleft').textContent,'4s');
});
test('guest sees own buff and death hides it even while host remains boosted',()=>{
 const sim=createSim({coop:true,players:[{id:'p1'},{id:'p2'}]}),h=hud(sim,'p2');sim.players[0].buffs.speed=8;h.update();assert.equal(h.$('beerboost').hidden,true);
 sim.players[1].buffs.speed=.01;h.update();assert.equal(h.$('beerleft').textContent,'1s');assert.equal(h.$('beerboost').hidden,false);
 sim.players[1].alive=false;h.update();assert.equal(h.$('beerboost').hidden,true);
});
test('new-run state hides the buff and HUD is called on the shipped update path',()=>{
 const sim=createSim(),h=hud(sim);sim.players[0].buffs.speed=8;h.update();sim.players=createSim().players;h.update();assert.equal(h.$('beerboost').hidden,true);
 const start=source.indexOf('function updateHud(view) {'),end=source.indexOf("  $('hpfill')",start);assert.match(source.slice(start,end),/updateBeerHud\(\)/);
});
test('beer timer has a non-live accessible label and translated display text',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/id="beerboost"[^>]*aria-labelledby="beerlabel"[^>]*hidden/);assert.match(html,/id="beerlabel">Speed boost/);assert.match(html,/id="beerleft"[^>]*role="timer"[^>]*translate="no"/);
 for(const language of['tr','es','fil'])assert.notEqual(translateText('Speed boost',language),'Speed boost');
});
