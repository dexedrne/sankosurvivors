import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const cleanup=source.slice(source.indexOf('  function removePickup('),source.indexOf('  function iconTex('));
const add=source.slice(source.indexOf('  function addEffect('),source.indexOf('  // a sword swing:'));
test('flat effects have a bounded budget and dispose replaced resources',()=>{
  for(const fx of ['full','reduced']) {
    let disposed=0;
    const effects=[],dyn={add(){},remove(){}},fxOnly=()=>{},settings={fx};
    const push=Function('effects','dyn','fxOnly','settings',`${add};return addEffect;`)(effects,dyn,fxOnly,settings);
    for(let i=0;i<400;i++)push({userData:{},scale:{x:1},geometry:{dispose(){disposed++;}},material:{dispose(){disposed++;}}},1,0);
    assert.equal(effects.length,fx==='reduced'?32:96);
    assert.equal(disposed,(400-effects.length)*2);
  }
});
test('new runs remove transient effects, pickup materials and damage labels',()=>{
  const code=source.slice(source.indexOf('  function reset() {'),source.indexOf('  return { hop:',source.indexOf('  function reset() {')));
  let disposed=0,removed=0;
  const obj=()=>({geometry:{dispose(){disposed++;}},material:{dispose(){disposed++;}}});
  const effects=[obj(),obj()],pickupSprites=new Map([[1,obj()]]),numbers=[{el:{remove(){removed++;}}}],parts=[{life:1}],gemSets=[{geometry:{setDrawRange(){}}}],partMesh={count:700};
  Function('effects','pickupSprites','numbers','parts','gemSets','partMesh',`
    const actors=new Map(),playerActors=new Map(),projObjs=new Map(),shieldObjs=new Map(),folkActors=new Map(),eprojObjs=new Map(),shrineObjs=new Map();
    const slimeFlecks=[],corpses=[],msBursts=[],hazardPool=[],dyn={remove(){}},entGroup={remove(){}},curMap={cx:0,cz:0},cam={};let folkT=0,spTick=0;
    ${cleanup}${code};reset();
  `)(effects,pickupSprites,numbers,parts,gemSets,partMesh);
  assert.equal(effects.length,0);assert.equal(pickupSprites.size,0);assert.equal(numbers.length,0);
  assert.equal(removed,1);assert.ok(disposed>=5);assert.equal(partMesh.count,0);
});
test('decorative pressure never evicts an active boss charge warning',()=>{
  const effects=[],dyn={add(){},remove(){}},fxOnly=()=>{},settings={fx:'reduced'};
  const push=Function('effects','dyn','fxOnly','settings',`${add};return addEffect;`)(effects,dyn,fxOnly,settings);
  const mesh=()=>({userData:{},scale:{x:1,setScalar(){}},geometry:{dispose(){}},material:{dispose(){}}});
  const aim=source.slice(source.indexOf('  function aimFx('),source.indexOf('  // boss attack warnings',source.indexOf('  function aimFx(')));
  const warning=mesh();warning.position={set(){}};warning.rotation={};
  const THREE={PlaneGeometry:class{rotateX(){return this;}translate(){return this;}},Mesh:class{constructor(){return warning;}}};
  Function('THREE','ringMat','groundAt','addEffect',`${aim};aimFx(0,0,0,12,0.8);`)(THREE,()=>({}),()=>0,push);
  for(let i=0;i<400;i++)push(mesh(),0.5,0);
  assert.ok(effects.includes(warning),'charge lane remains for the whole wind-up');
  assert.equal(effects.length,32);
  const expiry=source.slice(source.indexOf('    // flat effects\n'),source.indexOf('    // camera\n',source.indexOf('    // flat effects\n')));
  Function('effects','dyn',`const dt=2;${expiry}`)(effects,dyn);
  assert.equal(effects.length,0,'warning expires normally after its attack');
});
