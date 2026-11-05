import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createSim} from '../src/sim.js';
import * as content from '../src/content.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
function fixture(){
 const sim=createSim(),p=sim.players[0],nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,classList:{toggle(name,on){this[name]=on;}}});return nodes.get(id);};let hops=0;
 const start=main.indexOf('const hop ='),end=main.indexOf('let padPrev',start);assert.ok(start>=0&&end>start);
 const app=Function('sim','renderer','audio','$',`${main.slice(start,end)};let mode='play',pendingUse=null;const PLAYER='p1';return{hop,setMode(v){mode=v;},pending:()=>pendingUse,clear(){pendingUse=null;}};`)(sim,{hop(){hops++;}},{play(){}},$);
 return{sim,p,app,$,hops:()=>hops};
}
test('real shared Space/A/mobile handler queues only one ready pace2 action and never a cosmetic jump',()=>{
 const h=fixture();h.app.hop();assert.equal(h.app.pending(),4);assert.equal(h.hops(),0);assert.equal(typeof h.$('tumblebtn').onclick,'function');
 h.app.clear();h.p.rollCd=1;h.$('tumblebtn').onclick();assert.equal(h.app.pending(),null);h.p.rollCd=0;
 for(const mode of ['levelup','casket','pause','title','end']){h.app.setMode(mode);h.app.hop();assert.equal(h.app.pending(),null,mode);}
 h.app.setMode('play');h.sim.pending.p1={choices:[]};h.app.hop();assert.equal(h.app.pending(),null);delete h.sim.pending.p1;h.p.alive=false;h.app.hop();assert.equal(h.app.pending(),null);
});
test('week0 Space/A retains the cosmetic hop without recording a tumble',()=>{const h=fixture();h.sim.pace=1;h.app.hop();assert.equal(h.hops(),1);assert.equal(h.app.pending(),null);});
test('actual HUD shows ready/cooldown state and hides the tumble action on pace1',()=>{
 const h=fixture(),start=main.indexOf('function updateTumbleHud('),end=main.indexOf('function updateHud(',start);assert.ok(start>=0&&end>start,'actual HUD helper');
 const update=Function('$','sim',`${main.slice(start,end)};return updateTumbleHud;`)(h.$,h.sim);
 update({rollCd:4.3});assert.equal(h.$('tumblebtn').disabled,true);assert.equal(h.$('tumblecd').textContent,'5');update({rollCd:0});assert.equal(h.$('tumblebtn').disabled,false);assert.equal(h.$('tumblecd').textContent,'');h.sim.pace=1;update({});assert.equal(h.$('tumblebtn').classList.hidden,true);
});
test('native rig tumble pivots the body around its waist and restores it without rotating the floor ring',()=>{
 const start=render.indexOf('function applyTumblePose('),end=render.indexOf('export async function createRenderer',start);assert.ok(start>=0&&end>start,'production pose helper');
 const pose=Function('THREE','TUMBLE',`${render.slice(start,end)};return applyTumblePose;`)(THREE,content.TUMBLE);
 for(const native of [true,false]){
  const root=new THREE.Group(),holder=new THREE.Group(),body=new THREE.Group(),ring=new THREE.Group();holder.rotation.x=-Math.PI/2;holder.scale.setScalar(.02);holder.position.set(.1,.2,.3);holder.add(body);root.add(holder,ring);
  const a={root,inner:native?body:holder,kit:native?{}:null};holder.updateMatrix();const original=holder.matrix.clone();
  pose(a,{rollT:.1});assert.equal(a.rollPivot.parent,root);assert.equal(holder.parent,a.rollPivot);assert.ok(Math.abs(a.rollPivot.rotation.x-Math.PI)<1e-8);assert.equal(a.rollPivot.position.y,1.6);assert.equal(ring.parent,root);assert.equal(ring.rotation.x,0);holder.updateMatrix();assert.deepEqual(holder.matrix,original);
  pose(a,{rollT:0});assert.equal(a.rollPivot.rotation.x,0);assert.equal(a.rollPivot.position.length(),0);pose(a,{});assert.equal(a.rollPivot.position.length(),0);
 }
});
