import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as ranked from '../src/ranked.js';
import {translateText} from '../src/i18n.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('ranked has a fixed thirty-minute allowance independent of run length',()=>{
 assert.equal(ranked.RANKED.pauseSeconds,1800);assert.equal(typeof ranked.pauseRemaining,'function');
 const start=1700000000000;
 for(const played of [0,60,1354,7200]){
  assert.equal(ranked.pauseRemaining(start,played,start+(played+1800)*1000),0);
  assert.equal(ranked.pauseRemaining(start,played,start+(played+1800.001)*1000)<0,true);
 }
 assert.equal(Math.round(ranked.pauseRemaining(start,1354,start+2590708)),563);
 assert.equal(ranked.pauseRemaining(start,120,start+120000),1800);
 for(const args of [[null,1,start],[start,NaN,start],[start,1,Infinity]])assert.equal(ranked.pauseRemaining(...args),null);
});
test('actual pause readout shares one elapsed budget across reload, choices and pauses',()=>{
 const start=1700000000000,els=Array.from({length:4},()=>({textContent:'',classList:{toggle(){}}}));
 const a=main.indexOf('function updateRankedPause()'),b=main.indexOf('setInterval(updateRankedPause',a);
 assert.ok(a>=0&&b>a,'real UI integration');
 const make=Function('RANKED','pauseRemaining','document','Date',`let rankedRun={started:${start}},sim={t:60,over:null};const rankedPlaying=()=>!!rankedRun&&!sim.over,liveRace=x=>x,fmtT=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');${main.slice(a,b)};return{update:updateRankedPause,end:()=>sim.over='dead'};`);
 let now=start+60000;const app=make(ranked.RANKED,ranked.pauseRemaining,{querySelectorAll:()=>els},{now:()=>now});
 app.update();assert.match(els[0].textContent,/30:00/);
 now+=29*60000;app.update();assert.match(els[0].textContent,/1:00/);
 const reload=make(ranked.RANKED,ranked.pauseRemaining,{querySelectorAll:()=>els},{now:()=>now});reload.update();assert.match(els[0].textContent,/1:00/);
 now+=61000;app.update();assert.match(els[0].textContent,/exceeded/i);
 app.end();app.update();
});
test('ranked warning is visible before payment/start and timers exist in pause and choice menus',()=>{
 assert.match(html,/Ranked is competitive play/);assert.match(html,/Bathroom breaks are fine/);assert.match(html,/30 minutes/);assert.match(html,/Reloading does not reset it/);
 for(const id of ['pause','levelup','casket','settings']){
  const a=html.indexOf('id="'+id+'"');assert.ok(a>=0);assert.ok(html.slice(a,html.indexOf('</h2>',a)+200).includes('rankedpause'),id);
 }
});
test('ranked pause warnings and countdowns translate in all supported languages',()=>{
 const messages=['Ranked is competitive play. Bathroom breaks are fine: you have 30 minutes of total pause allowance per run. Time away, upgrade choices, reloads and connection delays all count. Reloading does not reset it. Exceeding the allowance disqualifies the run.','Estimated pause allowance left: 29:59 / 30:00','Pause allowance exceeded. This run cannot qualify.'];
 for(const lang of ['tr','es','fil'])for(const message of messages)assert.notEqual(translateText(message,lang),message,lang+': '+message);
});
