import test from 'node:test';
import assert from 'node:assert/strict';
import {spellFixture,fly} from './helpers/spell-motion-fixture.mjs';
test('shipped projectile heads and glows are actual TSL node materials',()=>{
 const f=spellFixture(),o=f.sphere();for(const m of[o.userData.ms.parts.material,o.userData.ms.glow.material]){assert.equal(m.isNodeMaterial,true);assert.equal(m.isShaderMaterial,undefined);assert(m.colorNode);}
 assert(o.userData.ms.glow.material.opacityNode);
});
test('concurrent casts keep independent transforms and preserve shared native materials',()=>{
 const f=spellFixture(),a=f.sphere(),b=f.sphere(0xff5a1f,'blast'),x=a.userData.ms.parts,y=b.userData.ms.parts;
 assert.equal(x.geometry,y.geometry);assert.equal(x.material,y.material);assert.notEqual(x.instanceMatrix,y.instanceMatrix);
 let dead=0,live=0;x.addEventListener('dispose',()=>dead++);y.addEventListener('dispose',()=>live++);y.material.addEventListener('dispose',()=>live++);
 f.dispose(a);assert.equal(dead,1);assert.equal(live,0);assert(b.parent);
});
test('native pulse time is bound to the held run clock',()=>{
 const f=spellFixture(),o=f.sphere(0x9fe8ff,'blast');fly(f,o,1200);assert(f.clockNode,'Original TSL receives the run clock');assert.equal(f.clockNode.value,1.2);
 f.wall(999999);f.step(o,1200);assert.equal(f.clockNode.value,1.2);fly(f,o,1500);assert.equal(f.clockNode.value,1.5);
});
