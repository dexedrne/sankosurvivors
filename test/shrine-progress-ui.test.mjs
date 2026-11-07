import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHRINE,SHRINES} from '../src/sim.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function fixture(){
 const start=main.indexOf('function updateShrineHud('),end=main.indexOf('function updateTumbleHud(',start);assert(start>=0&&end>start,'shrine progress HUD exists');
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',value:0,classList:{hidden:false,toggle(_,value){this.hidden=value;}}});return nodes.get(id);};
 return{update:Function('$','PLAYER','SHRINE','SHRINES',main.slice(start,end)+';return updateShrineHud;')($,'p1',SHRINE,SHRINES),$};
}
const view=(x,shrines,alive=1)=>({players:[{id:'p1',x,z:0,al:alive}],shrines});
test('nearby shrine shows actual charge percentage and explicit inside/outside guidance',()=>{
 const f=fixture(),s=[[1,'magic',0,0,.57,70]];
 f.update(view(0,s));assert.equal(f.$('shrinecharge').classList.hidden,false);assert.equal(f.$('shrinename').textContent,SHRINES.magic.name);assert.equal(f.$('shrineprogress').value,57);assert.equal(f.$('shrinepct').textContent,'57%');assert.equal(f.$('shrinestate').textContent,'Charging');
 f.update(view(SHRINE.r+.5,s));assert.equal(f.$('shrinestate').textContent,'Step into circle');assert.equal(f.$('shrineprogress').value,57);
});
test('nearest shrine wins; depleted, distant and absent shrines never leave stale charging UI',()=>{
 const f=fixture();f.update(view(0,[[1,'magic',2,0,.5],[2,'prayer',1,0,0]]));assert.equal(f.$('shrinename').textContent,SHRINES.prayer.name);assert.equal(f.$('shrineprogress').value,0);
 for(const v of[view(20,[[1,'magic',0,0,.4]]),view(0,[]),view(0,[[1,'magic',0,0,.4]],0)]){f.update(v);assert.equal(f.$('shrinecharge').classList.hidden,true);}
});
