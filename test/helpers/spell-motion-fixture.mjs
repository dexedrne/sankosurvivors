import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {ownActorResource,disposeActor} from '../../src/character.js';
import {createMeleeVfx} from '../../src/melee-vfx.js';
import {ENEMIES} from '../../src/content.js';
const source=readFileSync(new URL('../../src/render.js',import.meta.url),'utf8');
const slice=(a,b)=>{const start=source.indexOf(a),end=source.indexOf(b,start);assert(start>=0&&end>start,a);return source.slice(start,end)};
// Execute the shipped seams with real Three objects; only unrelated rendering/assets are outside this fixture.
export function spellFixture(){
 return Function('THREE','ownActorResource','disposeActor','ENEMIES','createMeleeVfx',`'use strict';
  const dyn=new THREE.Group(),camera=new THREE.PerspectiveCamera(),actors=new Map(),playerActors=new Map(),corpses=[],projObjs=new Map(),eprojObjs=new Map();
  const fxOnly=o=>o,colorOut=s=>s,groundAt=()=>0,meleeTrail=()=>{},emit=()=>{};const meleeFx=createMeleeVfx({group:dyn,camera,groundAt,colorOut,fxOnly});let wallNow=0;const performance={now:()=>wallNow};
  const ringMat=col=>new THREE.MeshBasicMaterial({color:col}),addEffect=o=>dyn.add(o),arrowOf=()=>{throw Error('Only magic is requested by this fixture')};
  ${slice('  const SPELL_ELEMENT =','  const lin =')}
  ${slice('  const msQ =','  // ---- spell flight')}
  ${slice('  let spTick =','  const shieldObjs =')}
  function frame(view,dt=1/30){const localId='p1',vt=spellClock(view,dt,!!view.over||Object.keys(view.pending||{}).length>0);
   ${slice('    // monster projectiles (fire and ice)','    // shrines:')}
  }
  return {THREE,dyn,camera,projObjs,eprojObjs,bursts:msBursts,events(values={}){for(const k of Object.keys(spFx)){spFx[k].length=0;spFx[k].push(...(values[k]||[]))}},frame,
   now(value){wallNow=value;if(typeof spellTime!=='undefined')spellTime=value},wall(value){wallNow=value},time:()=>typeof spellTime==='undefined'?undefined:spellTime,
   clock:(v,dt=0,frozen=false)=>spellClock(v,dt,frozen),sphere:(col=SPELL_ELEMENT.air,tier='missile')=>{const o=magicSphere(col,tier);dyn.add(o);return o},
   step:stepMagicSphere,stepBursts:stepMagicBursts,burst:magicBurst,stray:spellStray,land:spellLand,dispose:disposeActor,glow:msGlowMat};
 `)(THREE,ownActorResource,disposeActor,ENEMIES,createMeleeVfx);
}
export function piece(o,i){const m=new THREE.Matrix4(),p=new THREE.Vector3();o.updateWorldMatrix(true,true);o.userData.ms.parts.getMatrixAt(i,m);return p.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld)}
export function fly(f,o,t,x=14*t/1000,z=0){f.now(t);o.position.set(x,1,z);f.step(o,t)}
export const near=(a,b,eps=1e-5)=>assert(Math.abs(a-b)<=eps,`${a} vs ${b}`);
