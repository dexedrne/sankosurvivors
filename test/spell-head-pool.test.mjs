import test from 'node:test';
import assert from 'node:assert/strict';
import {spellFixture,fly,near} from './helpers/spell-motion-fixture.mjs';
test('all seven original shards per cast share one growing GPU mesh',()=>{
 const f=spellFixture();assert.equal(typeof f.syncHeads,'function','Pooled spell heads exist');
 const casts=Array.from({length:100},(_,i)=>{const o=f.sphere(i%2?0xff5a1f:0x9fe8ff,'blast');fly(f,o,1000,i*.5);return o});
 f.syncHeads();const mesh=f.heads();assert(mesh.isInstancedMesh);assert.equal(mesh.material.isNodeMaterial,true);assert.equal(mesh.count,700);assert(casts.every(o=>!o.userData.ms.parts.visible));
 const m=new f.THREE.Matrix4(),p=new f.THREE.Vector3();mesh.getMatrixAt(7*99,m);p.setFromMatrixPosition(m);near(p.x,49.5);near(p.y,1);
 const colour=new f.THREE.Color();mesh.getColorAt(7*99,colour);const expected=new f.THREE.Color(0xff5a1f).lerp(new f.THREE.Color(0xfff4dc),.7);for(const k of['r','g','b'])near(colour[k],expected[k],1e-7);
});
test('hidden and retired casts leave live siblings intact and pool growth releases old GPU resources',()=>{
 const f=spellFixture();assert.equal(typeof f.syncHeads,'function','Pooled spell heads exist');const a=f.sphere(),b=f.sphere();fly(f,a,1000,1);fly(f,b,1000,9);f.syncHeads();
 a.visible=false;f.syncHeads();assert.equal(f.heads().count,7);a.visible=true;f.dispose(a);f.syncHeads();assert.equal(f.heads().count,7);
 const m=new f.THREE.Matrix4(),p=new f.THREE.Vector3();f.heads().getMatrixAt(0,m);near(p.setFromMatrixPosition(m).x,9);
 const old=f.heads();let disposed=0;for(const r of[old,old.geometry,old.material])r.addEventListener('dispose',()=>disposed++);
 for(let i=0;i<100;i++)f.sphere();f.syncHeads();assert.notEqual(f.heads(),old);assert.equal(disposed,3);assert.equal(f.heads().count,707);
 f.dispose(b);for(const root of [...f.dyn.children])if(root.userData.ms)f.dispose(root);f.syncHeads();assert.equal(f.heads().count,0);
});
