import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spellFixture,near} from './helpers/spell-motion-fixture.mjs';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
const block=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,'Shipped output seam must exist');return source.slice(a,b)};
// Wrong fitted tints or head/trail mixes change the native linear inputs before blending.
for(const col of[0x9fe8ff,0x3b82f6,0x6db33f,0xff5a1f,0xc451ff])for(const tier of['missile','blast'])test(`${tier} ${col.toString(16)} preserves native head and trail tints`,()=>{
 const f=spellFixture(),o=f.sphere(col,tier),parts=o.userData.ms.parts,white=new f.THREE.Color(0xfff4dc),actual=new f.THREE.Color();
 assert.equal(parts.count,7);
 for(let i=0;i<7;i++){const expected=new f.THREE.Color(col).lerp(white,i===0?.7:.12);parts.getColorAt(i,actual);for(const key of['r','g','b'])near(actual[key],expected[key],1e-7);}
 const sibling=f.sphere(col,tier);assert.equal(sibling.userData.ms.parts.material.colorNode,parts.material.colorNode);f.dispose(o);assert(sibling.parent);assert.equal(sibling.userData.ms.parts.count,7);
});
test('shared scene output config supplies the native ACES exposure to its output pass',()=>{
 const f=spellFixture(),renderer={};
 Function('renderer','THREE',block('  renderer.outputColorSpace =','  renderer.shadowMap.enabled ='))(renderer,f.THREE);
 assert.equal(renderer.outputColorSpace,f.THREE.SRGBColorSpace);assert.equal(renderer.toneMapping,f.THREE.ACESFilmicToneMapping);assert.equal(renderer.toneMappingExposure,1);
});
// A bypass must fail with every optional effect off; individual effects are controls, not a substitute for the base output.
const flags={bloom:false,dof:false,ao:false,grade:false,aa:false};
for(const active of['none','bloom','dof','ao','grade','aa','storm'])test(`scene uses one linear-blend output with ${active} optional effect`,()=>{
 const f=spellFixture(),settings={...flags,...(active in flags?{[active]:true}:{})},calls=[],camera=new f.THREE.PerspectiveCamera();camera.position.set(3,4,5);
 const composer={render:dt=>calls.push(['composer',dt])},renderer={render:()=>calls.push(['direct'])},bokeh={uniforms:{focus:{value:7}}},cam={x:3,z:5,flash:.375},stormFx={pass:{enabled:active==='storm'}};
 const run=Function('settings','composer','renderer','bokeh','camera','tmpV','cam','stormFx','dt',`const me=null,grade={},gy=0,scene={};${block('    if (me) grade.uniforms.uLow.value','    return cam.flash;')}return cam.flash;`);
 const value=run(settings,composer,renderer,bokeh,camera,new f.THREE.Vector3(),cam,stormFx,.025);
 assert.deepEqual(calls,[['composer',.025]]);assert.equal(value,.375);assert.equal(bokeh.uniforms.focus.value,active==='dof'?3:7);assert.deepEqual(settings,{...flags,...(active in flags?{[active]:true}:{})},'Output selection must not change saved graphics choices');
});
