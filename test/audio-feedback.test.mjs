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
 const audio=Function('asset','window','Audio',fail.lookup?'unusedStorage':'localStorage','fetch','setInterval','clearInterval',source+';return createAudio();')(p=>p,{AudioContext},Audio,storage,async url=>({arrayBuffer:async()=>url}),fn=>{fades.push(fn);return fades.length;},id=>{fades[id-1]=null;});
 return{audio,store,sources,gains,tracks,tick:()=>{time+=1;},fade:()=>fades.forEach(fn=>fn?.()),activeFades:()=>fades.filter(Boolean).length};
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

function overlap(f){f.audio.music('early');for(let i=0;i<20;i++)f.fade();f.audio.music('mid');f.fade();assert.ok(f.tracks[0].volume>0);assert.ok(f.tracks[1].volume>0);}
test('normal music crossfade keeps its existing steps and retires only the outgoing track',()=>{
 const f=fixture();overlap(f);assert.ok(Math.abs(f.tracks[0].volume-.27)<1e-12);assert.equal(f.tracks[1].volume,.02);for(let i=0;i<30;i++)f.fade();assert.equal(f.tracks[0].volume,0);assert.equal(f.tracks[0].paused,true);assert.equal(f.tracks[1].volume,.3);assert.notEqual(f.tracks[1].paused,true);assert.equal(f.activeFades(),0);
});
for(const [name,control]of [['mute',f=>f.audio.setMuted(true)],['zero music',f=>f.audio.setVolume('m',0)],['imported mute',f=>f.audio.applyPreferences({'sq-muted':'1'})],['imported zero music',f=>f.audio.applyPreferences({'sq-vol':'{"s":60,"m":0}'})]])test('every playing music element obeys '+name+' immediately during a crossfade',()=>{
 const f=fixture();overlap(f);control(f);assert.deepEqual(f.tracks.map(el=>el.volume),[0,0]);f.fade();assert.deepEqual(f.tracks.map(el=>el.volume),[0,0]);
});
test('lower music volume and ducking cap outgoing tracks without changing effects volume',async()=>{
 const f=fixture();await f.audio.init();overlap(f);f.audio.setVolume('m',20);assert.ok(f.tracks.every(el=>el.volume<=.1+1e-12));assert.equal(f.gains[0].gain.value,.5);f.audio.duck(true);assert.ok(f.tracks.every(el=>el.volume<=.1/3+1e-12));assert.equal(f.gains[0].gain.value,.5);f.audio.setVolume('s',0);assert.equal(f.gains[0].gain.value,0);assert.ok(f.tracks[1].volume>0);
});
test('failed mute persistence silences overlapping music and unmute restores only the current target',()=>{
 const fail={},f=fixture({'sq-muted':'0'},fail);overlap(f);fail.write=true;assert.doesNotThrow(()=>f.audio.setMuted(true));assert.deepEqual(f.tracks.map(el=>el.volume),[0,0]);assert.equal(f.store.get('sq-muted'),'0');f.audio.setMuted(false);assert.equal(f.tracks[0].volume,0);assert.equal(f.tracks[1].volume,.3);for(let i=0;i<30;i++)f.fade();assert.equal(f.tracks[0].paused,true);assert.notEqual(f.tracks[1].paused,true);assert.equal(f.activeFades(),0);
});
test('rapid music transitions remain bounded and never revive retired tracks',()=>{
 const f=fixture(),keys=['early','mid','late','boss','final'];for(let i=0;i<20;i++){f.audio.music(keys[i%keys.length]);f.fade();}assert.equal(f.tracks.length,20);f.audio.setMuted(true);assert.ok(f.tracks.every(el=>el.volume===0));for(let i=0;i<60;i++)f.fade();assert.ok(f.tracks.slice(0,-1).every(el=>el.paused===true));assert.notEqual(f.tracks.at(-1).paused,true);assert.equal(f.activeFades(),0);f.audio.setMuted(false);assert.equal(f.tracks.at(-1).volume,.3);assert.ok(f.tracks.slice(0,-1).every(el=>el.volume===0));
});

for(const language of ['tr','es','fil'])test(language+': music transition update translates',()=>{for(const message of ["Mute every music track", "Mute, music volume and pause now apply to outgoing music as well as the current song."])assert.notEqual(translateText(message,language),message);});

for(const[name,silence,restore]of [
 ['mute',f=>f.audio.setMuted(true),f=>f.audio.setMuted(false)],
 ['zero volume',f=>f.audio.setVolume('m',0),f=>f.audio.setVolume('m',60)],
 ['imported mute',f=>f.audio.applyPreferences({'sq-muted':'1'}),f=>f.audio.setMuted(false)],
 ['imported zero volume',f=>f.audio.applyPreferences({'sq-vol':'{"s":60,"m":0}'}),f=>f.audio.setVolume('m',60)]
])test('restoration cannot revive an interrupted outgoing fade-in: '+name,()=>{
 const f=fixture();f.audio.music('early');for(let i=0;i<5;i++)f.fade();f.audio.music('mid');f.fade();assert.equal(f.activeFades(),2);silence(f);restore(f);assert.equal(f.tracks[0].volume,0);assert.equal(f.tracks[1].volume,.3);for(let i=0;i<5;i++){f.fade();assert.equal(f.tracks[0].volume,0);assert.ok(f.tracks[1].volume>0&&f.tracks[1].volume<=.3);}
});
test('raising music volume never raises an outgoing element with an active earlier fade-in',()=>{
 const f=fixture();f.audio.music('early');for(let i=0;i<5;i++)f.fade();f.audio.music('mid');f.fade();const before=f.tracks[0].volume;f.audio.setVolume('m',100);f.fade();assert.ok(f.tracks[0].volume<=before);
});
