import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {translateText} from '../src/i18n.js';
import {transformMain} from '../tools/wavedash/edition.mjs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fixture({ranked=false,coop=false,edition=false}={}){
 const code=edition?transformMain(main):main;
 const calls=[],nodes=new Map();
 const $=id=>{if(!nodes.has(id)){const classes=new Set(id==='pausemain'?[]:['hidden']);nodes.set(id,{id,textContent:'',disabled:false,addEventListener(){},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,on){on?classes.add(k):classes.delete(k);}}});}return nodes.get(id);};
 const env={$,TICK:1/30,mode:'pause',sim:{over:null,t:120},coop:coop?{close(){calls.push('close');env.mode='coop';env.sim=null;}}:null,rankedRun:null,rankedPlaying:()=>ranked,navFocus:node=>calls.push('focus:'+node.id),clearTouch(){},pendingUse:null,keys:new Set(),acc:0,runStarting:false,document:{hidden:false,addEventListener(){}},addEventListener(){},audio:{duck(){},init:()=>Promise.resolve()},updateRankedPause(){},containMenuTab(){}};
 const a=code.indexOf('let quitTarget = null;'),b=code.indexOf(edition?'let resumeMode =':'function pause(on)',a),helpers=a<0?'':code.slice(a,b);
 const pause=code.slice(code.indexOf(edition?'let resumeMode =':'function pause(on)'),code.indexOf("$('start').onclick",code.indexOf('function pause(on)')));
 const wiring=code.slice(code.indexOf("$('quit').onclick"),code.indexOf('// touch:',code.indexOf("$('quit').onclick")));
 const api=Function('env',`with(env){${helpers}${pause}${wiring};return{click:()=>$('quit').onclick(),cancel:()=>$('quitcancel').onclick(),confirm:()=>$('quitconfirmbtn').onclick(),pause};}`)(env);
 return {...api,env,calls,$};
}
test('Quit first asks without ending the actual casual run',()=>{
 const f=fixture();f.click();assert.equal(f.env.sim.over,null,'first Quit click must not kill the run');assert.equal(f.env.mode,'pause');
 assert.equal(f.$('quitconfirm').classList.contains('hidden'),false);assert.equal(f.$('pausemain').classList.contains('hidden'),true);assert.equal(f.calls.at(-1),'focus:quitcancel');
});
test('Back keeps the same paused run and restores its Quit control',()=>{
 const f=fixture(),sim=f.env.sim;f.click();f.cancel();assert.equal(f.env.sim,sim);assert.equal(sim.over,null);assert.equal(f.env.mode,'pause');assert(f.$('quitconfirm').classList.contains('hidden'));assert(!f.$('pausemain').classList.contains('hidden'));assert.equal(f.calls.at(-1),'focus:quit');
});
test('only explicit confirmation takes the existing solo death/results path once',()=>{
 const f=fixture(),sim=f.env.sim;f.click();f.confirm();assert.equal(sim.over,'dead');assert.equal(f.env.mode,'play');assert(f.$('quitconfirm').classList.contains('hidden'));f.confirm();assert.equal(sim.over,'dead');
});
test('co-op stays connected until confirmation and leaves once',()=>{
 const f=fixture({coop:true});f.click();assert(!f.calls.includes('close'));assert.match(f.$('quitconfirmtext').textContent,/both players/);f.confirm();f.confirm();assert.equal(f.calls.filter(c=>c==='close').length,1);
});
test('ranked and inactive contexts cannot open the confirmation or end a run',()=>{
 const ranked=fixture({ranked:true});ranked.click();assert.equal(ranked.env.sim.over,null);assert(ranked.$('quitconfirm').classList.contains('hidden'));
 for(const mode of ['title','play','levelup','casket','end']){const f=fixture();f.env.mode=mode;f.click();assert.equal(f.env.sim.over,null,mode);assert(f.$('quitconfirm').classList.contains('hidden'),mode);}
});
test('a stale confirmation cannot end a replacement simulation or co-op session',()=>{
 for(const replace of ['sim','coop']){const f=fixture({coop:true});f.click();if(replace==='sim')f.env.sim={over:null,t:0};else f.env.coop={close(){assert.fail('replacement session must not close');}};f.confirm();assert.equal(f.env.sim.over,null);assert(!f.calls.includes('close'));}
});
test('resuming clears confirmation and old confirm clicks cannot end the resumed run',()=>{
 const f=fixture();f.click();f.pause(false);f.confirm();assert.equal(f.env.sim.over,null);assert(f.$('quitconfirm').classList.contains('hidden'));f.pause(true);assert(!f.$('pausemain').classList.contains('hidden'));
});
test('Escape/controller Back cancels before the ordinary pause-resume navigation',()=>{
 const a=main.indexOf('function navBack()'),b=main.indexOf("  if (!$('cloudpick')",a);assert(a>=0&&b>a);
 const branch=main.slice(a+'function navBack() {'.length,b);
 const f=fixture();f.click();let cancelled=0;
 const back=Function('mode','walletModalOpen','$','cancelQuit',branch)('pause',()=>false,f.$,()=>{cancelled++;f.cancel();});
 assert.equal(back,true);assert.equal(cancelled,1);assert.equal(f.env.mode,'pause');assert.equal(f.env.sim.over,null);
});
test('confirmation has labelled native dialog semantics and Back precedes the destructive action',()=>{
 assert.match(html,/<div id="quitconfirm"[^>]*role="alertdialog"[^>]*aria-modal="true"[^>]*aria-labelledby="quitconfirmtitle"[^>]*aria-describedby="quitconfirmtext"/);
 assert(html.indexOf('id="quitcancel"')<html.indexOf('id="quitconfirmbtn"'));assert(main.includes("$('quitconfirm').addEventListener('keydown', containMenuTab)"));
});
test('wallet-free extracted entry keeps executable quit handlers and resets them on Resume',()=>{
 const f=fixture({edition:true});f.click();assert.equal(f.env.sim.over,null);assert(!f.$('quitconfirm').classList.contains('hidden'));
 f.pause(false);f.confirm();assert.equal(f.env.sim.over,null);f.pause(true);f.click();f.confirm();assert.equal(f.env.sim.over,'dead');
});
for(const lang of ['tr','es','fil'])test('quit decision and consequences are translated in '+lang,()=>{
 for(const text of ['Quit this run?','Leave co-op?','End this run and show your results?','Leaving ends this co-op run for both players. Unfinished rewards are not saved.'])assert.notEqual(translateText(text,lang),text);
});
