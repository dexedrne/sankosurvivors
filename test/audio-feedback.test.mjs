import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file=readFileSync(new URL('../src/audio.js',import.meta.url),'utf8'),source=file.slice(file.indexOf('const SFX =')).replace('export function createAudio','function createAudio');
function fixture(values={}){
 const store=new Map(Object.entries(values)),sources=[],gains=[],tracks=[],fades=[];let time=100;
 class AudioContext{
  state='running';destination={};get currentTime(){return time;}
  createGain(){const node={gain:{value:0},connect(){}};gains.push(node);return node;}
  createBufferSource(){const node={playbackRate:{value:0},connect(){},start(){sources.push(this);}};return node;}
  async decodeAudioData(value){return{fixture:value};}async resume(){}
 }
 class Audio{constructor(url){this.url=url;this.volume=0;tracks.push(this);}async play(){}pause(){this.paused=true;}}
 const audio=Function('asset','window','Audio','localStorage','fetch','setInterval','clearInterval',source+';return createAudio();')(p=>p,{AudioContext},Audio,{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v))},async url=>({arrayBuffer:async()=>url}),fn=>{fades.push(fn);return fades.length;},()=>{});
 return{audio,store,sources,gains,tracks,tick:()=>{time+=1;},fade:()=>fades.forEach(fn=>fn())};
}
test('default native sound effects schedule a decoded source through the saved master volume',async()=>{
 const f=fixture({'sq-vol':'{"s":30,"m":80}'});await f.audio.init();f.audio.play('pickup');assert.equal(f.sources.length,1);assert.equal(f.gains[0].gain.value,0.25);assert.equal(f.gains[1].gain.value,1);assert.equal(f.sources[0].buffer.fixture,'sound/soundEffects/PickUp_item.mp3');
});
test('per-effect volume and rate preserve their existing public options',async t=>{
 t.mock.method(Math,'random',()=>0.5);const f=fixture();await f.audio.init();f.audio.play('hit',{vol:0.4,rate:1.5});assert.equal(f.sources.length,1);assert.equal(f.gains[0].gain.value,0.5);assert.equal(f.gains[1].gain.value,0.4);assert.equal(f.sources[0].playbackRate.value,1.5);assert.equal(f.sources[0].buffer.fixture,'sound/soundEffects/Sword_Hit3.mp3');
});
test('simulation feedback reaches native hit, pickup and reward sounds',async()=>{
 const f=fixture();await f.audio.init();f.audio.onFx([{k:'dmg'},{k:'get'},{k:'level'}],null);assert.equal(f.sources.length,3);assert.deepEqual(f.gains.slice(1).map(g=>g.gain.value),[0.5,0.6,0.8]);
});
test('muted and zero-volume effects stay silent until explicitly restored',async()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":60,"m":60}'});await f.audio.init();f.audio.play('pickup');assert.equal(f.sources.length,0);f.audio.setMuted(false);f.audio.setVolume('s',0);f.audio.play('pickup');assert.equal(f.sources.length,0);f.audio.setVolume('s',60);f.audio.play('pickup');assert.equal(f.sources.length,1);assert.equal(f.store.get('sq-muted'),'0');assert.equal(JSON.parse(f.store.get('sq-vol')).s,60);
});
test('effect throttling is per kind and resumes after its existing gap',async()=>{
 const f=fixture();await f.audio.init();f.audio.play('hit');f.audio.play('hit');f.audio.play('pickup');assert.equal(f.sources.length,2);f.tick();f.audio.play('hit');assert.equal(f.sources.length,3);
});
test('music volume and ducking remain independent of a silent effects slider',async()=>{
 const f=fixture({'sq-vol':'{"s":0,"m":80}'});await f.audio.init();f.audio.music('early');f.audio.setVolume('m',80);assert.equal(f.tracks[0].url,'music/Fresh_Beginnings.mp3');assert.equal(f.tracks[0].volume,0.4);f.audio.duck(true);assert.ok(Math.abs(f.tracks[0].volume-0.4/3)<1e-12);f.audio.play('pickup');assert.equal(f.sources.length,0);f.audio.setMuted(true);assert.equal(f.tracks[0].volume,0);
});
test('saved volume clamps and cold audio do not schedule an unready source',async()=>{
 const f=fixture({'sq-vol':'{"s":900,"m":-4}'});assert.equal(f.audio.volume('s'),100);assert.equal(f.audio.volume('m'),0);f.audio.play('pickup');assert.equal(f.sources.length,0);await f.audio.init();f.audio.play('pickup');assert.equal(f.sources.length,1);
});
