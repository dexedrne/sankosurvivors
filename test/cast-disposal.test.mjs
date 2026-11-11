import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { ownActorResource, disposeActor } from '../src/character.js';
import { createPetRenderer } from '../src/pet-renderer.js';
import { createMeleeVfx } from '../src/melee-vfx.js';
import { createSpellMaterials } from '../src/spell-materials.js';

const source = readFileSync(new URL('../src/render.js', import.meta.url), 'utf8');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}
function harness() {
  return Function('THREE', 'ownActorResource', 'disposeActor', 'createPetRenderer', 'createMeleeVfx', 'createSpellMaterials', `
    const dyn = new THREE.Group(), entGroup = new THREE.Group(), camera = new THREE.PerspectiveCamera();
    let merchantActor=null; const castleMarker=new THREE.Group(), folkProto=()=>null;
    const projObjs = new Map(), eprojObjs = new Map(), shrineObjs = new Map(), shieldObjs = new Map();
    const iconTex = () => modelMap;
    const groundAt = () => 0, fxOnly = o => o, colorOut = s => s, emit = () => {}, A = s => s;
    const meleeFx = createMeleeVfx({group:dyn,camera,groundAt,fxOnly,colorOut});
    const petRenderer = createPetRenderer({group:dyn,groundAt,load:async()=>null,spawn:()=>{throw Error('No companion selected in this cast fixture');}});
    const glowTex = new THREE.Texture(), streakTex = new THREE.Texture();
    const modelGeo = new THREE.BoxGeometry(), modelMap = new THREE.Texture(), modelMat = new THREE.MeshBasicMaterial({ map: modelMap });
    const modelScene = new THREE.Group(), spriteGeometry = new THREE.Sprite(modelMat).geometry; modelScene.add(new THREE.Mesh(modelGeo, modelMat));
    const item = async () => ({ gltf: { scene: modelScene } }), loadGLB = async () => ({ scene: modelScene });
    const boxOf = o => new THREE.Box3().setFromObject(o), weaponModelPath = () => 'fixture';
    ${between('  // Orient a (non-skinned)', '  // ---- ground:')}
    ${between('  const SPELL_ELEMENT =', '  const msQ =')}
    ${between('  const softRing =', '  const glowTex =')}
    ${between('  const glowSprite =', '  // the Lighter')}
    ${between('  function meleeTrail(', '  // the ground cracks')}
    const msObj = new THREE.Object3D();
    ${between('  const msBursts =', '  // ---- spell flight')}
    const spFx = { burst: [], volley: [] }, spellStray = () => {}, spellDraw = () => {}, stepMagicSphere = () => {};
    const spellSample = (u, tick) => { u.g1 = tick; }, boltY = () => 1, SHRINE_COLORS = { strength: 0xff0000 };
    let landing = false;
    const spellLand = () => landing;
    function frame(state = {}) {
      const view = { t:0, players: [], proj: [], eproj: [], shrines: [], ...state }, dt = 0.1, time = 0, vt = 0, localId='p1';
      meleeFx.begin(view.t,false);
      ${between('    // monster projectiles (fire and ice)', '    // pickups\n')}
    }
    const slimeFlecks = [], effects = [], pickupSprites = new Map(), numbers = [], parts = [], gemSets = [], partMesh = {};
    const actors = new Map(), playerActors = new Map(), folkActors = new Map(), corpses = [], hazardPool = [], curMap = { cx: 0, cz: 0 }, cam = {};
    let folkT = 0, spTick = 0; const removePickup = () => {}, resetWeather = () => {};
    ${between('  function reset() {', '  return { hop:')}
    function shared() {
      const resources = new Set([meleeFx.mesh, meleeFx.mesh.geometry, meleeFx.mesh.material, modelGeo, modelMat, modelMap, spriteGeometry, glowTex, streakTex, msGeo, msMat, msGlowGeo, ...msGlowMats.values(), ...(msBatch ? [msBatch, msBatch.geometry, msBatch.material] : [])]);
      for (const root of [ARROW, ...arrowCache]) if (root) root.traverse(o => { if (o.geometry) resources.add(o.geometry); for (const m of [].concat(o.material || [])) resources.add(m); });
      return resources;
    }
    return { frame, reset, shared, dyn, meleeFx, merchant:()=>merchantActor, projObjs, eprojObjs, shrineObjs, msBursts,
      landing: value => { landing = value; }, burst: () => magicBurst(0, 1, 0, SPELL_ELEMENT.fire, 'blast'), expire: () => stepMagicBursts(performance.now() + 1000) };
  `)(THREE, ownActorResource, disposeActor, createPetRenderer, createMeleeVfx, createSpellMaterials);
}
const projectile = (id, art, evo = false) => [id, art, 0, 0, 0, 6, 0, evo, -1];
const enemyShot = id => [id, 0, 0, 'ice'];
const shrine = id => [id, 'strength', 0, 0, 0];
const settleModels = async () => { await Promise.resolve(); };
function watch(resources) {
  return [...resources].map(resource => {
    const state = { resource, disposals: 0 };
    resource.addEventListener('dispose', () => state.disposals++); return state;
  });
}
function uniqueResources(root, shared) {
  const resources = new Set();
  root.traverse(o => {
    if (o.isInstancedMesh && !shared.has(o)) resources.add(o);
    if (o.geometry && !o.isSprite && !shared.has(o.geometry)) resources.add(o.geometry);
    for (const material of [].concat(o.material || [])) if (!shared.has(material)) resources.add(material);
  });
  return resources;
}

for (const [art, evo, count] of [['sword', false, 0], ['ball', false, 4], ['ball', true, 5], ['axe', false, 0], ['bolt', false, 1], ['bolt', true, 1]]) {
  test(`${evo ? 'evolved ' : ''}${art} expiry releases its own resources and preserves a live cast and shared cache`, async () => {
    const h = harness(), first = projectile(1, art, evo), second = projectile(2, art, evo);
    h.frame({ proj: [first, second] }); await settleModels();
    const shared = h.shared(), own = watch(uniqueResources(h.projObjs.get(1), shared)), live = watch(uniqueResources(h.projObjs.get(2), shared)), cached = watch(shared);
    assert.equal(own.length, count);
    h.frame({ proj: [second] });
    assert.equal(h.projObjs.has(1), false); assert.ok(own.every(x => x.disposals === 1));
    assert.ok([...live, ...cached].every(x => x.disposals === 0));
    h.reset(); assert.ok(live.every(x => x.disposals === 1)); assert.ok(cached.every(x => x.disposals === 0));
  });
}

test('enemy projectile buffers survive landing interpolation and are released on disappearance', () => {
  const h = harness(); h.frame({ eproj: [enemyShot(1)] });
  const own = watch(uniqueResources(h.eprojObjs.get(1), h.shared())), cached = watch(h.shared());
  assert.equal(own.length, 1);
  h.landing(true); h.frame(); assert.ok(own.every(x => x.disposals === 0)); assert.equal(h.eprojObjs.size, 1);
  h.landing(false); h.frame(); assert.ok(own.every(x => x.disposals === 1)); assert.equal(h.eprojObjs.size, 0);
  assert.ok(cached.every(x => x.disposals === 0));
});

test('impact bursts release their instance buffers without disposing shared spell assets', () => {
  const h = harness(); h.burst();
  const own = watch(uniqueResources(h.msBursts[0].o, h.shared())), cached = watch(h.shared());
  assert.equal(own.length, 1); h.expire();
  assert.equal(h.msBursts.length, 0); assert.ok(own.every(x => x.disposals === 1)); assert.ok(cached.every(x => x.disposals === 0));
});

test('shrine retirement releases beam and ring resources while preserving the cached altar model', async () => {
  const h = harness(); h.frame({ shrines: [shrine(1)] }); await settleModels();
  const own = watch(uniqueResources(h.shrineObjs.get(1), h.shared())), cached = watch(h.shared());
  assert.equal(own.length, 6); h.frame();
  assert.equal(h.shrineObjs.size, 0); assert.ok(own.every(x => x.disposals === 1)); assert.ok(cached.every(x => x.disposals === 0));
});

test('reset purges active casts, enemy shots, bursts and shrines with disposal exactly once', async () => {
  const h = harness(); h.frame({ proj: [projectile(1, 'ball', true)], eproj: [enemyShot(2)], shrines: [shrine(3)] }); h.burst(); await settleModels();
  const own = watch(uniqueResources(h.dyn, h.shared())), cached = watch(h.shared());
  assert.equal(own.length, 13); h.reset(); h.reset();
  assert.deepEqual(h.dyn.children.filter(o=>o.name!=='spell-heads'), [h.meleeFx.mesh]); assert.equal(h.dyn.getObjectByName('spell-heads')?.count,0); assert.equal(h.meleeFx.mesh.count,0); assert.equal(h.shrineObjs.size, 0);
  assert.ok(own.every(x => x.disposals === 1)); assert.ok(cached.every(x => x.disposals === 0));
});

test('merchant retirement and reset dispose their owned ring without touching cached assets',()=>{const h=harness();h.frame({merchant:{id:17,x:1,z:1},players:[{id:'p1',x:0,z:0}]});const root=h.merchant().root,owned=watch(uniqueResources(root,h.shared())),cached=watch(h.shared());h.frame();assert.equal(h.merchant(),null);assert.equal(root.parent,null);assert.ok(owned.every(x=>x.disposals===1));assert.ok(cached.every(x=>x.disposals===0));h.frame({merchant:{id:18,x:2,z:1},players:[{id:'p1',x:0,z:0}]});const next=watch(uniqueResources(h.merchant().root,h.shared()));h.reset();assert.equal(h.merchant(),null);assert.ok(next.every(x=>x.disposals===1));});


test('a Gold node releases its sprite and effect materials while retaining cached native resources',async()=>{
 const h=harness();h.frame({shrines:[[777,'gold',0,0,.5]]});await settleModels();
 const root=h.shrineObjs.get(777);assert.equal(root.name,'gold-node');
 const own=watch(uniqueResources(root,h.shared())),cached=watch(h.shared());
 h.reset();assert.equal(h.shrineObjs.size,0);
 assert(own.every(r=>r.disposals===1));assert(cached.every(r=>r.disposals===0));
});
