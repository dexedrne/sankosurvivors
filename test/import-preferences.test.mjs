import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translateText} from '../src/i18n.js';
import {cleanSettings} from '../src/settings.js';
import {profileValue} from '../src/progress-values.js';
import {importProgress} from '../src/progress-import.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),render=readFileSync(new URL('../src/render.js',import.meta.url),'utf8'),J=JSON.stringify;
const boot=main.slice(main.indexOf('async function boot()'),main.indexOf('// ---- gear'));
const helperStart=main.indexOf('function applySavedGraphics('),helpers=helperStart<0?'':main.slice(helperStart,main.indexOf('async function boot()'));
const importer=main.slice(main.indexOf("$('xferload').onclick ="),main.indexOf("for (const b of document.querySelectorAll('#more",main.indexOf("$('xferload').onclick =")));
const defaults=render.slice(render.indexOf('  const settings = {'),render.indexOf('  // time of day:',render.indexOf('  const settings = {')));
const factory=Function('low',defaults+';return {...settings};')(true);
function fixture(data,{allowed=true,failKey=null,settingsOpen=false,denyAfterCommit=false}={}){
 const values=new Map(Object.entries({'sq-settings':J({v:2,res:'1',quality:'medium',fps:'30',dof:true,foliage:false}),'sq-muted':'0','sq-vol':'{"s":30,"m":80}','sq-coins':'850'})),nodes=new Map(),audioCalls=[],applied=[];let queues=0,settingsBuilds=0,failed=false,denyReads=false;
 const localStorage={getItem:k=>{if(denyReads&&k==='sq-settings')throw Error('fixture postcommit read denied');return values.get(k)??null;},setItem(k,v){if(k===failKey&&!failed){failed=true;throw Error('fixture storage failure');}values.set(k,String(v));},removeItem:k=>{values.delete(k);if(denyAfterCommit&&k==='sq-import-backup-v1')denyReads=true;}};
 const $=id=>{if(!nodes.has(id)){const hidden=id==='settings'?!settingsOpen:true;nodes.set(id,{value:'',textContent:'',disabled:false,style:{},dataset:{sure:'1'},classList:{contains:()=>hidden,add(){},remove(){}}});}return nodes.get(id);};
 const live={...factory},rendererApi={getSettings:()=>({...live}),applySettings(next){if(this.failApply){this.failApply=false;throw Error('fixture display failure');}applied.push({...next});Object.assign(live,cleanSettings(next));},preloadGear:async()=>{},setZoom(){},setShift(){}};
 const app=Function('localStorage','$','cleanSettings','profileValue','importProgress','data','rendererApi','audioCalls','allowed','applyCount','buildSettings','queuePageReload',`'use strict';
  let renderer=null,rendererDefaults=null,importAttempt=null,mode='title';const labels={},selMap='greentown',params=new URLSearchParams();
  const load=(k,d)=>{try{return profileValue(k,JSON.parse(localStorage.getItem(k)||'null')??d,d);}catch{return d;}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const audio={applyPreferences:d=>audioCalls.push(d)},createRenderer=async()=>rendererApi,pickAssetHost=async()=>{},getGear=()=>({}),buildAdventurers=()=>{},buildMaps=()=>{},showBest=()=>{},requestAnimationFrame=()=>{},loop=()=>{};
  const canManuallyReload=()=>allowed,progressCanLoad=()=>allowed,xferRead=()=>({data}),getCoins=()=>Number(load('sq-coins',0)),cancelPendingLoads=()=>{},withImportLock=fn=>fn(),showProgressRecovery=()=>{mode='recovery';};
  ${helpers}
  ${boot}
  ${importer}
  return{boot,mode:()=>mode,load:()=>$('xferload').onclick()};
 `)(localStorage,$,cleanSettings,profileValue,importProgress,data,rendererApi,audioCalls,allowed,()=>applied.length,()=>settingsBuilds++,()=>queues++);
 return{...app,values,live,audioCalls,applied,$,failApply:()=>rendererApi.failApply=true,queues:()=>queues,settingsBuilds:()=>settingsBuilds};
}
test('committed manual import applies graphics/audio before the reload and refreshes open Settings',async()=>{
 const settings={v:3,res:'0.5',fps:'30',unknown:'keep'},data={'sq-coins':'650','sq-settings':J(settings),'sq-muted':'1','sq-vol':'{"s":20,"m":70}'},f=fixture(data,{settingsOpen:true});await f.boot();await f.load();
 assert.equal(f.values.get('sq-coins'),'650');assert.equal(f.live.res,'0.5');assert.equal(f.live.dof,false);assert.equal(f.live.foliage,true);assert.equal(f.live.quality,factory.quality);assert.equal(f.queues(),1);assert.deepEqual(f.audioCalls,[data]);assert.equal(f.settingsBuilds(),1);assert.equal(f.values.get('sq-settings'),J(settings));assert.equal(f.values.get('sq-import-backup-v1'),undefined);
});
test('a progress-only import preserves current session display/audio choices',async()=>{
 const f=fixture({'sq-coins':'650'});await f.boot();f.live.res='0.75';const count=f.applied.length;await f.load();assert.equal(f.live.res,'0.75');assert.equal(f.applied.length,count);assert.equal(f.audioCalls.length,0);assert.equal(f.settingsBuilds(),0);
});
test('a sound-only import does not reset graphics or absent sound keys',async()=>{
 const data={'sq-muted':'1'},f=fixture(data);await f.boot();const count=f.applied.length;await f.load();assert.equal(f.applied.length,count);assert.deepEqual(f.audioCalls,[data]);
});
test('a graphics-only import leaves audio alone and preserves valid version2 raw metadata',async()=>{
 const raw=J({v:2,res:'0.75',fps:'30',future:{x:1}}),f=fixture({'sq-settings':raw});await f.boot();await f.load();assert.equal(f.live.res,'0.75');assert.equal(f.live.dof,false);assert.equal(f.audioCalls.length,0);assert.equal(f.values.get('sq-settings'),raw);
});
for(const raw of [J('broken'),J({res:'0',quality:'constructor'}),J({v:2,res:'0',view:'constructor'})])test('malformed/legacy imported graphics use the same effective defaults as boot: '+raw,async()=>{
 const f=fixture({'sq-settings':raw});await f.boot();await f.load();assert.equal(f.live.res,factory.res);assert.equal(f.live.dof,factory.dof);assert.equal(f.live.foliage,factory.foliage);assert.equal(f.live.view,factory.view);
});
test('failed import rollback never applies new device preferences',async()=>{
 const f=fixture({'sq-settings':J({v:2,res:'0.5'}),'sq-muted':'1','sq-coins':'650'},{failKey:'sq-muted'});await f.boot();const before={...f.live},count=f.applied.length;await f.load();assert.deepEqual(f.live,before);assert.equal(f.applied.length,count);assert.equal(f.audioCalls.length,0);assert.equal(f.values.get('sq-coins'),'850');assert.equal(f.queues(),0);
});
test('active-run/wallet admission refuses import before any preference or storage change',async()=>{
 const f=fixture({'sq-settings':J({v:2,res:'0.5'}),'sq-muted':'1'},{allowed:false});await f.boot();const before=[...f.values],count=f.applied.length;await f.load();assert.deepEqual([...f.values],before);assert.equal(f.applied.length,count);assert.equal(f.audioCalls.length,0);assert.equal(f.queues(),0);
});


test('post-commit display failure keeps imported progress and requests a guarded reload',async()=>{
 const f=fixture({'sq-coins':'650','sq-settings':J({v:2,res:'0.5'})});await f.boot();f.failApply();await f.load();assert.equal(f.values.get('sq-coins'),'650');assert.equal(f.values.get('sq-import-backup-v1'),undefined);assert.equal(f.queues(),0);assert.equal(f.mode(),'recovery');
});

test('committed graphics use the accepted raw blob even when subsequent storage reads fail',async()=>{
 const raw=J({v:3,res:'0.75',fps:'30',future:'keep'}),f=fixture({'sq-settings':raw},{denyAfterCommit:true});await f.boot();await f.load();assert.equal(f.live.res,'0.75');assert.equal(f.values.get('sq-settings'),raw);
});
test('standalone legacy roof import retains the same settings precedence as boot',async()=>{
 const f=fixture({'sq-roofs':'auto'});await f.boot();await f.load();assert.equal(f.live.roofs,factory.roofs);assert.equal(f.values.get('sq-roofs'),'auto');assert.equal(f.audioCalls.length,0);
});

for(const language of ['tr','es','fil'])test(language+': imported preference update translates',()=>{for(const message of ["Imported settings, ready to play", "Imported display and sound settings now apply before your next run, even when starting cancels the planned reload.", "Finish applying settings", "Your imported progress is saved. Reload the game to finish applying display and sound settings before playing.", "Reload game", "The game could not restart. Try again."])assert.notEqual(translateText(message,language),message);});
