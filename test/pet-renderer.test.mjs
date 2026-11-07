import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const pets = await import('../src/pet-renderer.js').catch(error => { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; return {}; });
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const view = (x = 0, extra = {}) => ({ players: [{ id: 'p1', x, z: 2, f: 0, al: true }], petActive: true, ...extra });
function setup(load, options = {}) {
  assert.equal(typeof pets.createPetRenderer, 'function'); const group = new THREE.Group(), advances = [];
  const controller = pets.createPetRenderer({ group, load, groundAt: (x,z) => x + z, spawn: proto => {
    const root = new THREE.Group(); root.name = proto; const mixer = new THREE.AnimationMixer(root);
    return { root, mixer, update: (dt,moving) => advances.push({ proto, dt, moving }) };
  }, ...options }); return { controller, group, advances };
}
test('late A to B to A model loads never equip an obsolete selection', async () => {
  const requests = [], s = setup(id => { const d = deferred(); requests.push({ id, ...d }); return d.promise; });
  const a1=s.controller.set('chicken'), b=s.controller.set('fox'), a2=s.controller.set('chicken');
  requests[2].resolve('current'); assert.equal(await a2,true); s.controller.update(view(),.1,'p1'); assert.equal(s.group.children[0].name,'current');
  requests[0].resolve('old-a'); requests[1].resolve('old-b'); assert.equal(await a1,false); assert.equal(await b,false);
  s.controller.update(view(),.1,'p1'); assert.equal(s.group.children.length,1); assert.equal(s.group.children[0].name,'current');
});

test('revoking authority during a model load prevents a late companion from spawning', async () => {
  const pending=deferred(); let allowed=true; const s=setup(()=>pending.promise);
  const ready=s.controller.set('fox',()=>allowed);allowed=false;pending.resolve('obsolete');
  assert.equal(await ready,false);s.controller.update(view(),.1,'p1');assert.equal(s.group.children.length,0);assert.equal(s.controller.state(),'idle');
});
test('every frame checks current authority and removes even an already loaded companion', async () => {
  let allowed=true;const s=setup(async id=>id,{choice:id=>id==='bun:Mini'?id:null});
  await s.controller.set('bun:Mini',()=>allowed);s.controller.update(view(),.1,'p1');assert.equal(s.group.children.length,1);
  allowed=false;s.controller.update(view(),.1,'p1');assert.equal(s.group.children.length,0);assert.equal(s.controller.state(),'idle');
  allowed=true;s.controller.update(view(),.1,'p1');assert.equal(s.group.children.length,0);
  assert.equal(await s.controller.set('bun:Mini',()=>{throw Error('lost account');}),false);assert.equal(s.group.children.length,0);
});
test('disable and failed loads clear the actor, and retry can recover without blocking the run', async () => {
  let fail=false; const s=setup(async id=>{if(fail)throw Error('asset');return id;});
  assert.equal(await s.controller.set('chicken'),true);s.controller.update(view(),.1,'p1');assert.equal(s.group.children.length,1);
  fail=true;assert.equal(await s.controller.set('fox'),false);assert.equal(s.group.children.length,0);assert.equal(s.controller.state(),'unavailable');
  fail=false;assert.equal(await s.controller.set('fox'),true);s.controller.update(view(),.1,'p1');assert.equal(s.group.children[0].name,'fox');
  assert.equal(await s.controller.set(null),true);assert.equal(s.group.children.length,0);assert.equal(s.controller.state(),'idle');
});
test('reset during loading spawns only at the current map/local player; pause/death never advance', async () => {
  const pending=deferred(),s=setup(()=>pending.promise), ready=s.controller.set('fox');
  s.controller.reset();s.controller.update(view(100),.1,'p1');assert.equal(s.group.children.length,0);
  pending.resolve('fox');await ready;s.controller.update(view(100),.1,'p1');assert.equal(s.group.children[0].position.x,100);assert.equal(s.group.children[0].position.y,102);
  const count=s.advances.length;s.controller.update(view(100,{petActive:false}),.1,'p1');assert.equal(s.advances.length,count);
  s.controller.update(view(100),.1,'absent');assert.equal(s.group.children.length,0);assert.equal(s.advances.length,count);
  s.controller.update({players:[{id:'p1',x:100,z:2,al:false}]},.1,'p1');assert.equal(s.advances.length,count);
  s.controller.update(view(3),.1,'p1');assert.equal(s.group.children[0].position.x,3);
  s.controller.reset();assert.equal(s.group.children.length,0);
});

test('title companion uses its walkable preview spot without overlapping the hero or leaking into the run trail',async()=>{
 const s=setup(async id=>id);await s.controller.set('fox');
 const preview={x:1.5,z:2.5,f:.3},v=view(0,{petPreview:preview}),before=structuredClone(v);
 s.controller.update(v,.1,'p1');assert.deepEqual(s.group.children[0].position.toArray(),[1.5,4,2.5]);assert.deepEqual(v,before);
 s.controller.update(view(20,{petPreview:{x:21.5,z:2.5,f:0}}),.1,'p1');assert.equal(s.group.children[0].position.x,21.5);
 s.controller.update(view(0),.1,'p1');assert.equal(s.group.children[0].position.x,0,'run trail starts from the actual hero, not the preview');
});
