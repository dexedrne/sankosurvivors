import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translateText } from '../src/i18n.js';
const file=readFileSync(new URL('../src/audio.js',import.meta.url),'utf8'),source=file.slice(file.indexOf('const SFX =')).replace('export function createAudio','function createAudio');
function fixture(values={},fail={}){
 const store=new Map(Object.entries(values)),sources=[],gains=[],tracks=[],fades=[];let time=100;
 class AudioContext{
  state='running';destination={};get currentTime(){return time;}
  createGain(){const node={gain:{value:0},connect(){}};gains.push(node);return node;}
  createBufferSource(){const node={playbackRate:{value:0},connect(){},start(){sources.push(this);}};return node;}
  async decodeAudioData(value){return{fixture:value};}async resume(){}
 }
 class Audio{constructor(url){this.url=url;this.volume=0;tracks.push(this);}async play(){}pause(){this.paused=true;}}
 const storage={getItem:k=>{if(fail.read==='all'||fail.read===k)throw Error('fixture read denied');return store.get(k)??null;},setItem:(k,v)=>{if(fail.write)throw Error('fixture quota');store.set(k,String(v));}};
 const audio=Function('asset','window','Audio',fail.lookup?'unusedStorage':'localStorage','fetch','setInterval','clearInterval',source+';return createAudio();')(p=>p,{AudioContext},Audio,storage,async url=>({arrayBuffer:async()=>url}),fn=>{fades.push(fn);return fades.length;},()=>{});
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
for(const read of ['sq-muted','all'])test('unreadable audio preferences use defaults without failing construction: '+read,async()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'},{read});assert.equal(f.audio.muted,false);assert.equal(f.audio.volume('s'),read==='all'?60:30);assert.equal(f.audio.volume('m'),read==='all'?60:80);await f.audio.init();f.audio.play('pickup');assert.equal(f.sources.length,1);
});
test('denied localStorage property access still allows default audio and live mute',async()=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('fixture storage getter denied');}});
 try{const f=fixture({},{lookup:true});assert.equal(f.audio.muted,false);assert.equal(f.audio.volume('s'),60);await f.audio.init();assert.doesNotThrow(()=>f.audio.setMuted(true));assert.equal(f.gains[0].gain.value,0);assert.doesNotThrow(()=>f.audio.setMuted(false));assert.equal(f.gains[0].gain.value,0.5);}
 finally{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else delete globalThis.localStorage;}
});
test('failed mute write immediately silences the existing effects graph and music',async()=>{
 const fail={},f=fixture({'sq-muted':'0','sq-vol':'{"s":30,"m":80}'},fail);await f.audio.init();f.audio.music('early');f.audio.setVolume('m',80);assert.equal(f.gains[0].gain.value,0.25);assert.equal(f.tracks[0].volume,0.4);fail.write=true;
 let error;try{f.audio.setMuted(true);}catch(e){error=e;}
 assert.equal(f.gains[0].gain.value,0);assert.equal(f.tracks[0].volume,0);assert.equal(error,undefined);assert.equal(f.audio.muted,true);f.audio.play('pickup');assert.equal(f.sources.length,0);assert.equal(f.store.get('sq-muted'),'0');
 fail.write=false;f.audio.setMuted(true);assert.equal(f.store.get('sq-muted'),'1');
});
test('failed unmute write restores sound with independent volume and ducking',async()=>{
 const fail={},f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'},fail);await f.audio.init();f.audio.music('early');f.audio.duck(true);fail.write=true;
 let error;try{f.audio.setMuted(false);}catch(e){error=e;}
 assert.equal(f.gains[0].gain.value,0.25);assert.ok(Math.abs(f.tracks[0].volume-0.4/3)<1e-12);assert.equal(error,undefined);assert.equal(f.audio.muted,false);f.audio.play('pickup');assert.equal(f.sources.length,1);assert.equal(f.store.get('sq-muted'),'1');
});
test('failed preference writes before AudioContext init remain session controls',async()=>{
 const f=fixture({},{write:true});assert.doesNotThrow(()=>f.audio.setMuted(true));await f.audio.init();assert.equal(f.gains[0].gain.value,0);assert.equal(f.audio.volume('s'),60);assert.equal(f.store.has('sq-muted'),false);
});

for(const language of ['tr','es','fil'])test(language+': audio storage update translates',()=>{for(const message of ["Reliable sound controls", "Fixed a loading failure when sound settings could not be read. Mute and unmute now work even when preferences cannot be saved."])assert.notEqual(translateText(message,language),message);});

test('imported sound preferences update the live graph/media without rewriting raw data',async()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'});await f.audio.init();f.audio.music('early');f.audio.duck(true);const before=[...f.store],data=Object.freeze({'sq-muted':'0','sq-vol':'{"s":60.5,"m":40}'});f.audio.applyPreferences(data);assert.equal(f.audio.muted,false);assert.equal(f.audio.volume('s'),60.5);assert.equal(f.audio.volume('m'),40);assert.ok(Math.abs(f.gains[0].gain.value-.5*60.5/60)<1e-12);assert.ok(Math.abs(f.tracks[0].volume-.2/3)<1e-12);assert.deepEqual([...f.store],before);
});
test('partial mute import preserves an unsaved live volume without reading storage',async()=>{
 const fail={},f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'},fail);fail.write=true;f.audio.setVolume('s',75);f.audio.setVolume('m',35);fail.read='all';f.audio.applyPreferences({'sq-muted':'0'});assert.equal(f.audio.muted,false);assert.equal(f.audio.volume('s'),75);assert.equal(f.audio.volume('m'),35);assert.equal(f.store.get('sq-muted'),'1');
});
test('partial volume import preserves mute and resets missing volume members like startup',()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'});f.audio.applyPreferences({'sq-vol':'{"s":15}'});assert.equal(f.audio.muted,true);assert.equal(f.audio.volume('s'),15);assert.equal(f.audio.volume('m'),60);
});
for(const raw of ['null','"broken"','{"s":{"valueOf":0,"toString":0},"m":1e400}','{"s":999,"m":-4}'])test('imported audio blob follows existing startup validation: '+raw,()=>{
 const f=fixture({'sq-muted':'1'}),expected=fixture({'sq-vol':raw});f.audio.applyPreferences({'sq-muted':'0','sq-vol':raw});assert.equal(f.audio.muted,expected.audio.muted);assert.equal(f.audio.volume('s'),expected.audio.volume('s'));assert.equal(f.audio.volume('m'),expected.audio.volume('m'));
});
test('an import without audio keys preserves live audio before context init',async()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'});f.audio.applyPreferences({'sq-coins':'650'});assert.equal(f.audio.muted,true);assert.equal(f.audio.volume('s'),30);await f.audio.init();assert.equal(f.gains[0].gain.value,0);
});
