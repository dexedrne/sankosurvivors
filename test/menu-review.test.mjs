import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const fn=name=>{const a=main.indexOf(`function ${name}(`),b=main.indexOf('\n}',a);assert(a>=0&&b>a);return main.slice(a-6,a)==='async '?main.slice(a-6,b+2):main.slice(a,b+2);};
test('Fun return yields to pending ranked payment, submission or live recovery',async()=>{
 const a=main.indexOf('boot().then(async () => {'),b=main.indexOf('// QA hooks',a),code=main.slice(a,b);
 for(const pending of [null,'sq-ranked-payment','sq-ranked-submit','live']){
  const calls=[],ready={};await Function('boot','params','walletHandoff','rankedLive','readRanked','openRanked','recoverRankedRun','openModeMenu','cloudPull','refreshRanked','applyDmt','refreshPendingTitleProgress','window','SIM_ID','return '+code)(()=>Promise.resolve(),{get:()=> 'fun'},null,()=>pending==='live'?{sim:'same'}:null,key=>key===pending?{}:null,()=>calls.push('ranked'),()=>assert.fail('same sim'),()=>calls.push('fun'),()=>{},async()=>{},()=>{},async()=>{},ready,'same');
  assert.deepEqual(calls,pending?['ranked']:['fun'],pending||'ordinary fun return');assert(ready.__sqReady);
 }
});
test('mode card handlers cannot change maps once a run has started',async()=>{
 let picks=0;const choose=Function('mode','mapLoading','runStarting','coop','VARIANTS','selectVariant','$','return '+fn('chooseRunMode'))('play',false,false,null,{fun:{}},()=>{picks++;},()=>assert.fail('no UI writes during play'));
 await choose('fun');assert.equal(picks,0);
});
test('starting a run hides a leftover mode chooser',()=>{
 const body=fn('startRun'),line=body.split('\n').find(s=>s.includes("classList.add('hidden')")&&s.includes("'title'"));assert(line,'startup hides title menus');
 const hidden=[];Function('$',line)(id=>({classList:{add(){hidden.push(id);}}}));assert(hidden.includes('modemenu'));
});
test('preview animation receives elapsed draw time at both60Hz and120Hz',()=>{
 const a=main.indexOf("  if (petViewer && !$('pets').classList.contains('hidden'))"),b=main.indexOf("  if (mode === 'title' || mode === 'end')",a);assert(a>=0&&b>a);
 for(const hz of [60,120]){
  let seconds=0,draws=0;const tick=Function('petViewer','$','document',`let lastMenuDrawn=0;return(ts,dt)=>{${main.slice(a,b)}};`)({draw(dt){seconds+=dt;draws++;}},()=>({classList:{contains:()=>false}}),{hidden:false});
  for(let n=1;n<=hz;n++)tick(n*1000/hz,1/hz);assert(draws>=29&&draws<=31);assert(seconds>.95&&seconds<1.05,`${hz}Hz advances ${seconds}s`);
 }
});
