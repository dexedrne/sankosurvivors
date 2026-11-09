import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translateText } from '../src/i18n.js';
const file=readFileSync(new URL('../src/audio.js',import.meta.url),'utf8'),source=file.slice(file.indexOf('const SFX =')).replace('export function createAudio','function createAudio');
function fixture(values={},fail={}){
 const store=new Map(Object.entries(values)),sources=[],allGains=[],musicGains=new Set(),tracks=[],fades=[],contexts=[],plays=[],fetches=[],resumes=[];let time=100;
 class AudioContext{
  state=fail.state||'running';destination={};constructor(){contexts.push(this);}get currentTime(){return time;}
  createGain(){const node={gain:{value:0},connect(next){this.next=next;}};allGains.push(node);return node;}
  createBufferSource(){const node={playbackRate:{value:0},connect(next){this.next=next;},start(){sources.push(this);}};return node;}
  createMediaElementSource(el){assert.equal(el.route,undefined,'one source node per reusable media element');return{connect(node){el.route=node;musicGains.add(node);}};}
  async decodeAudioData(value){return{fixture:value};}
  resume(){const attempt={};resumes.push(attempt);return new Promise((resolve,reject)=>{attempt.resolve=()=>{this.state='running';resolve();};attempt.reject=reject;if(!fail.deferResume&&(!fail.resumeNeedsGesture||fail.gesture))resumes.forEach(p=>p.resolve());});}
 }
 class Audio{
  constructor(url){this._src=url;this._volume=1;this.paused=true;this.assignments=[];tracks.push(this);}
  set src(value){this.assignments.push({src:value,crossOrigin:this.crossOrigin});this._src=value;}get src(){return this._src;}get url(){return this._src;}
  set volume(value){if(!fail.fixedVolume)this._volume=value;}get volume(){return fail.fixedVolume?1:this._volume;}
  get level(){return this.route?.gain.value??this.volume;}
  play(){const el=this,src=this.src,attempt={el,src};plays.push(attempt);return new Promise((resolve,reject)=>{attempt.resolve=resolve;attempt.reject=e=>reject(e||Error('fixture play rejected'));if(fail.rejectPlay||fail.failedHost&&src.startsWith(fail.failedHost))attempt.reject();else{this.paused=false;if(!fail.deferPlay)attempt.resolve();}});}
  pause(){this.paused=true;}
 }
 const storage={getItem:k=>{if(fail.read==='all'||fail.read===k)throw Error('fixture read denied');return store.get(k)??null;},setItem:(k,v)=>{if(fail.write)throw Error('fixture quota');store.set(k,String(v));}};
 const fetch=async url=>{fetches.push(url);if(fail.failedHost&&url.startsWith(fail.failedHost))throw Error('fixture CDN unavailable');if(fail.deferFetch)await new Promise(resolve=>(fail.fetchWaiters??=[]).push(resolve));return{ok:true,arrayBuffer:async()=>url};};
 const audio=Function('asset','window','Audio',fail.lookup?'unusedStorage':'localStorage','fetch','setInterval','clearInterval',source+';return createAudio();')(p=>(fail.host||'')+p,{AudioContext},Audio,storage,fetch,fn=>{fades.push(fn);return fades.length;},id=>{fades[id-1]=null;});
 return{audio,store,sources,get gains(){return allGains.filter(node=>!musicGains.has(node));},tracks,contexts,plays,fetches,resumes,settle:async()=>{for(let i=0;i<8;i++)await Promise.resolve();},tick:()=>{time+=1;},fade:()=>fades.forEach(fn=>fn?.()),activeFades:()=>fades.filter(Boolean).length};
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
 const f=fixture({'sq-vol':'{"s":0,"m":80}'});await f.audio.init();f.audio.music('early');await f.settle();f.audio.setVolume('m',80);assert.equal(f.tracks[0].url,'music/Fresh_Beginnings.mp3');assert.equal(f.tracks[0].level,0.4);f.audio.duck(true);assert.ok(Math.abs(f.tracks[0].level-0.4/3)<1e-12);f.audio.play('pickup');assert.equal(f.sources.length,0);f.audio.setMuted(true);assert.equal(f.tracks[0].level,0);
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
 const fail={},f=fixture({'sq-muted':'0','sq-vol':'{"s":30,"m":80}'},fail);await f.audio.init();f.audio.music('early');await f.settle();f.audio.setVolume('m',80);assert.equal(f.gains[0].gain.value,0.25);assert.equal(f.tracks[0].level,0.4);fail.write=true;
 let error;try{f.audio.setMuted(true);}catch(e){error=e;}
 assert.equal(f.gains[0].gain.value,0);assert.equal(f.tracks[0].level,0);assert.equal(error,undefined);assert.equal(f.audio.muted,true);f.audio.play('pickup');assert.equal(f.sources.length,0);assert.equal(f.store.get('sq-muted'),'0');
 fail.write=false;f.audio.setMuted(true);assert.equal(f.store.get('sq-muted'),'1');
});
test('failed unmute write restores sound with independent volume and ducking',async()=>{
 const fail={},f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'},fail);await f.audio.init();f.audio.music('early');await f.settle();f.audio.duck(true);fail.write=true;
 let error;try{f.audio.setMuted(false);}catch(e){error=e;}
 assert.equal(f.gains[0].gain.value,0.25);assert.ok(Math.abs(f.tracks[0].level-0.4/3)<1e-12);assert.equal(error,undefined);assert.equal(f.audio.muted,false);f.audio.play('pickup');assert.equal(f.sources.length,1);assert.equal(f.store.get('sq-muted'),'1');
});
test('failed preference writes before AudioContext init remain session controls',async()=>{
 const f=fixture({},{write:true});assert.doesNotThrow(()=>f.audio.setMuted(true));await f.audio.init();assert.equal(f.gains[0].gain.value,0);assert.equal(f.audio.volume('s'),60);assert.equal(f.store.has('sq-muted'),false);
});

for(const language of ['tr','es','fil'])test(language+': audio storage update translates',()=>{for(const message of ["Reliable sound controls", "Fixed a loading failure when sound settings could not be read. Mute and unmute now work even when preferences cannot be saved."])assert.notEqual(translateText(message,language),message);});

test('imported sound preferences update the live graph/media without rewriting raw data',async()=>{
 const f=fixture({'sq-muted':'1','sq-vol':'{"s":30,"m":80}'});await f.audio.init();f.audio.music('early');await f.settle();f.audio.duck(true);const before=[...f.store],data=Object.freeze({'sq-muted':'0','sq-vol':'{"s":60.5,"m":40}'});f.audio.applyPreferences(data);assert.equal(f.audio.muted,false);assert.equal(f.audio.volume('s'),60.5);assert.equal(f.audio.volume('m'),40);assert.ok(Math.abs(f.gains[0].gain.value-.5*60.5/60)<1e-12);assert.ok(Math.abs(f.tracks[0].level-.2/3)<1e-12);assert.deepEqual([...f.store],before);
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

async function overlap(f){await f.audio.init();f.audio.music('early');await f.settle();for(let i=0;i<20;i++)f.fade();f.audio.music('mid');await f.settle();f.fade();assert.ok(f.tracks[0].level>0);assert.ok(f.tracks[1].level>0);}
test('an early gesture survives a later CDN fallback for the same menu song and effects',async()=>{
 const fail={host:'https://failed.test/',failedHost:'https://failed.test/'},f=fixture({},fail);
 f.audio.music('mid');await f.audio.init();await f.settle();
 assert.equal(f.sources.length,0);assert(f.tracks.every(s=>s.level===0));
 fail.host='/assets/';f.audio.music('mid');await f.audio.init();await f.settle();f.fade();
 assert.equal(f.tracks.length,2,'reuse the two gesture-primed streams');
 assert(f.tracks.some(s=>s.src==='/assets/music/Adobe_Fantasy.mp3'&&!s.paused&&s.level>0));
 f.audio.play('pickup');assert.equal(f.sources.length,1);assert.equal(f.sources[0].buffer.fixture,'/assets/sound/soundEffects/PickUp_item.mp3');
 const plays=f.plays.length,fetches=f.fetches.length;
 for(let i=0;i<10;i++)f.audio.music('mid');
 assert.equal(f.plays.length,plays);assert.equal(f.fetches.length,fetches,'same host/song does not retry each frame');
});
test('normal music crossfade keeps its existing steps and retires only the outgoing track',async()=>{
 const f=fixture();await overlap(f);assert.ok(Math.abs(f.tracks[0].level-.27)<1e-12);assert.equal(f.tracks[1].level,.02);for(let i=0;i<30;i++)f.fade();assert.equal(f.tracks[0].level,0);assert.equal(f.tracks[0].paused,true);assert.equal(f.tracks[1].level,.3);assert.notEqual(f.tracks[1].paused,true);assert.equal(f.activeFades(),0);
});
for(const [name,control]of [['mute',f=>f.audio.setMuted(true)],['zero music',f=>f.audio.setVolume('m',0)],['imported mute',f=>f.audio.applyPreferences({'sq-muted':'1'})],['imported zero music',f=>f.audio.applyPreferences({'sq-vol':'{"s":60,"m":0}'})]])test('every playing music element obeys '+name+' immediately during a crossfade',async()=>{
 const f=fixture();await overlap(f);control(f);assert.deepEqual(f.tracks.map(el=>el.level),[0,0]);f.fade();assert.deepEqual(f.tracks.map(el=>el.level),[0,0]);
});
test('lower music volume and ducking cap outgoing tracks without changing effects volume',async()=>{
 const f=fixture();await f.audio.init();await overlap(f);f.audio.setVolume('m',20);assert.ok(f.tracks.every(el=>el.level<=.1+1e-12));assert.equal(f.gains[0].gain.value,.5);f.audio.duck(true);assert.ok(f.tracks.every(el=>el.level<=.1/3+1e-12));assert.equal(f.gains[0].gain.value,.5);f.audio.setVolume('s',0);assert.equal(f.gains[0].gain.value,0);assert.ok(f.tracks[1].level>0);
});
test('failed mute persistence silences overlapping music and unmute restores only the current target',async()=>{
 const fail={},f=fixture({'sq-muted':'0'},fail);await overlap(f);fail.write=true;assert.doesNotThrow(()=>f.audio.setMuted(true));assert.deepEqual(f.tracks.map(el=>el.level),[0,0]);assert.equal(f.store.get('sq-muted'),'0');f.audio.setMuted(false);assert.equal(f.tracks[0].level,0);assert.equal(f.tracks[1].level,.3);for(let i=0;i<30;i++)f.fade();assert.equal(f.tracks[0].paused,true);assert.notEqual(f.tracks[1].paused,true);assert.equal(f.activeFades(),0);
});
test('rapid music transitions remain bounded and never revive retired tracks',async()=>{
 const f=fixture(),keys=['early','mid','late','boss','final'];await f.audio.init();for(let i=0;i<20;i++){f.audio.music(keys[i%keys.length]);await f.settle();f.fade();}assert.equal(f.tracks.length,2);assert.ok(f.activeFades()<=1);f.audio.setMuted(true);assert.ok(f.tracks.every(el=>el.level===0));for(let i=0;i<60;i++)f.fade();const current=f.tracks.find(el=>el.src==='music/grotto1.mp3');assert.equal(current.paused,false);assert.equal(f.activeFades(),0);f.audio.setMuted(false);assert.equal(current.level,.3);assert.ok(f.tracks.filter(el=>el!==current).every(el=>el.level===0&&el.paused));
});

for(const language of ['tr','es','fil'])test(language+': music transition update translates',()=>{for(const message of ["Mute every music track", "Mute, music volume and pause now apply to outgoing music as well as the current song."])assert.notEqual(translateText(message,language),message);});

for(const[name,silence,restore]of [
 ['mute',f=>f.audio.setMuted(true),f=>f.audio.setMuted(false)],
 ['zero volume',f=>f.audio.setVolume('m',0),f=>f.audio.setVolume('m',60)],
 ['imported mute',f=>f.audio.applyPreferences({'sq-muted':'1'}),f=>f.audio.setMuted(false)],
 ['imported zero volume',f=>f.audio.applyPreferences({'sq-vol':'{"s":60,"m":0}'}),f=>f.audio.setVolume('m',60)]
])test('restoration cannot revive an interrupted outgoing fade-in: '+name,async()=>{
 const f=fixture();await f.audio.init();f.audio.music('early');await f.settle();for(let i=0;i<5;i++)f.fade();f.audio.music('mid');await f.settle();f.fade();assert.ok(f.activeFades()<=1);silence(f);restore(f);assert.equal(f.tracks[0].level,0);assert.equal(f.tracks[1].level,.3);for(let i=0;i<5;i++){f.fade();assert.equal(f.tracks[0].level,0);assert.ok(f.tracks[1].level>0&&f.tracks[1].level<=.3);}
});
test('raising music volume never raises an outgoing element with an active earlier fade-in',async()=>{
 const f=fixture();await f.audio.init();f.audio.music('early');await f.settle();for(let i=0;i<5;i++)f.fade();f.audio.music('mid');await f.settle();f.fade();const before=f.tracks[0].level;f.audio.setVolume('m',100);f.fade();assert.ok(f.tracks[0].level<=before);
});


test('queued music primes two CORS-clean streaming routes synchronously before optional effects load',async()=>{
 const fail={deferFetch:true,fixedVolume:true},f=fixture({},fail);f.audio.music('early');assert.equal(f.tracks.length,0);const ready=f.audio.init();assert.equal(f.plays.length,2);assert.equal(f.tracks.length,2);assert.equal(f.contexts.length,1);assert.ok(f.tracks.every(el=>el.route&&el.volume===1));assert.ok(f.tracks.every(el=>el.assignments.every(a=>a.crossOrigin==='anonymous')));assert.ok(f.tracks.every(el=>el.level===0));fail.fetchWaiters.forEach(resolve=>resolve());await ready;await f.settle();assert.equal(f.tracks[0].paused,false);assert.equal(f.tracks[1].paused,true);
});
test('a gesture before title readiness primes valid sources and later music reuses them',async()=>{
 const f=fixture();await f.audio.init();await f.settle();assert.equal(f.tracks.length,2);assert.ok(f.plays.every(p=>p.src==='music/Fresh_Beginnings.mp3'));assert.ok(f.tracks.every(el=>el.paused&&el.level===0));f.audio.music('mid');await f.settle();assert.equal(f.tracks.length,2);assert.ok(f.tracks.some(el=>el.src==='music/Adobe_Fantasy.mp3'&&!el.paused));
});
test('rejected desired playback retries only at the next init and coalesces in-flight attempts',async()=>{
 const fail={rejectPlay:true},f=fixture({},fail);f.audio.music('early');await f.audio.init();await f.settle();const before=f.plays.length;for(let i=0;i<100;i++)f.audio.music('early');assert.equal(f.plays.length,before);fail.rejectPlay=false;fail.deferPlay=true;const a=f.audio.init(),b=f.audio.init();assert.equal(f.plays.filter(p=>p.el===f.tracks[0]).length,2);f.plays.slice(before).forEach(p=>p.resolve());await Promise.all([a,b]);await f.settle();assert.equal(f.tracks[0].paused,false);
});
for(const state of ['suspended','interrupted'])test('init awaits '+state+' resume and shares pending effect readiness',async()=>{
 const fail={state,deferResume:true,deferFetch:true},f=fixture({},fail);f.audio.music('early');let settled=false;const a=f.audio.init().then(()=>settled=true),b=f.audio.init();const fetchCount=f.fetches.length;assert.equal(f.plays.length,2);assert.equal(f.contexts.length,1);assert.equal(f.resumes.length,1);fail.fetchWaiters.forEach(resolve=>resolve());await f.settle();assert.equal(settled,false);assert.equal(f.fetches.length,fetchCount);f.resumes.forEach(p=>p.resolve());await Promise.all([a,b]);assert.equal(settled,true);assert.equal(f.contexts[0].state,'running');
});
test('a failed context resume does not poison the next gesture or re-fetch decoded effects',async()=>{
 const fail={state:'suspended',deferResume:true},f=fixture({},fail);const first=f.audio.init();const rejected=assert.rejects(first,/resume denied/);f.resumes[0].reject(Error('resume denied'));await rejected;const count=f.fetches.length;fail.deferResume=false;await f.audio.init();assert.equal(f.contexts[0].state,'running');assert.equal(f.fetches.length,count);
});
for(const state of ['suspended','interrupted'])test('a trusted menu tap retries an earlier blocked '+state+' resume',async()=>{
 const fail={state,resumeNeedsGesture:true},f=fixture({'sq-vol':'{"s":30,"m":80}'},fail),main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),a=main.indexOf('function unlockAudio('),b=main.indexOf('// ---- version, leaderboard',a);
 const unlock=Function('audio','addEventListener','playTitleMusic','globalThis',main.slice(a,b)+';return unlockAudio;')(f.audio,()=>{},()=>f.audio.music('mid'),{navigator:{userActivation:{hasBeenActive:true}}});
 await f.settle();assert.equal(f.contexts[0].state,state);assert.equal(f.resumes.length,1);const fetchCount=f.fetches.length,ready=f.audio.init();
 unlock({isTrusted:false});await f.settle();assert.equal(f.resumes.length,1,'ordinary init and synthetic events do not retry pending work');
 fail.gesture=true;unlock({isTrusted:true});await f.settle();assert.equal(f.contexts[0].state,'running','the next activating tap must reach resume despite the pending earlier promise');await ready;
 assert.equal(f.resumes.length,2);assert.equal(f.contexts.length,1);assert.equal(f.tracks.length,2);assert.equal(f.fetches.length,fetchCount);
 for(let i=0;i<30;i++)f.fade();assert.equal(f.tracks[0].src,'music/Adobe_Fantasy.mp3');assert.equal(f.tracks[0].paused,false);assert.equal(f.tracks[0].level,.4);assert.equal(f.gains[0].gain.value,.25);assert.equal(f.plays.length,2,'resume recovery keeps the existing music streams');
});
for(const outcome of ['resolve','reject'])test('an older resume '+outcome+' cannot clear a newer gesture retry',async()=>{
 const f=fixture({},{state:'suspended',deferResume:true}),first=f.audio.init(),firstSettled=outcome==='reject'?assert.rejects(first,/old resume failed/):first,second=f.audio.init(true);
 assert.equal(f.resumes.length,2);f.resumes[0][outcome](Error('old resume failed'));await firstSettled;f.contexts[0].state='interrupted';
 const ordinary=f.audio.init();assert.equal(f.resumes.length,2,'older settlement must not release the current pending guard');f.resumes[1].resolve();await Promise.all([second,ordinary]);assert.equal(f.contexts[0].state,'running');
});
test('a stale spare-prime completion cannot pause its newly promoted source',async()=>{
 const f=fixture({},{deferPlay:true});f.audio.music('early');await f.audio.init();const prime=f.plays[1];f.audio.music('mid');const current=f.plays.at(-1);assert.equal(current.el,prime.el);assert.notEqual(current.src,prime.src);prime.resolve();await f.settle();assert.equal(current.el.paused,false);current.resolve();f.plays[0].resolve();await f.settle();for(let i=0;i<30;i++)f.fade();assert.equal(current.el.level,.3);
});
test('rapid source reassignment ignores old rejection and finally without blocking newer play',async()=>{
 const f=fixture({},{deferPlay:true});f.audio.music('early');await f.audio.init();const old=f.plays[0];f.audio.music('mid');f.audio.music('late');const current=f.plays.at(-1);assert.equal(current.el,old.el);assert.equal(current.src,'music/snowdrift_mix.mp3');old.reject();await f.settle();const before=f.plays.filter(p=>p.el===current.el).length;await f.audio.init();assert.equal(f.plays.filter(p=>p.el===current.el).length,before);current.resolve();await f.settle();for(let i=0;i<30;i++)f.fade();assert.equal(current.el.paused,false);assert.equal(current.el.level,.3);assert.equal(f.tracks.length,2);assert.ok(f.activeFades()<=1);
});
test('outgoing healthy music holds until incoming playback succeeds',async()=>{
 const fail={},f=fixture({},fail);f.audio.music('early');await f.audio.init();await f.settle();for(let i=0;i<30;i++)f.fade();const old=f.tracks[0];fail.deferPlay=true;f.audio.music('mid');for(let i=0;i<20;i++)f.fade();assert.equal(old.level,.3);assert.equal(old.paused,false);f.plays.at(-1).resolve();await f.settle();f.fade();assert.ok(Math.abs(old.level-.27)<1e-12);assert.equal(f.tracks[1].level,.02);
});
test('immutable media volume still permits immediate music controls and bounded retirement',async()=>{
 const f=fixture({},{fixedVolume:true});await overlap(f);f.audio.setMuted(true);assert.ok(f.tracks.every(el=>el.level===0&&el.volume===1));f.fade();assert.equal(f.tracks[0].paused,true);assert.equal(f.activeFades(),0);f.audio.setMuted(false);assert.equal(f.tracks[1].level,.3);assert.equal(f.tracks[0].level,0);
});

test('a newer pending transition reuses the pending incoming slot and preserves healthy outgoing audio',async()=>{
 const fail={},f=fixture({},fail);f.audio.music('early');await f.audio.init();await f.settle();for(let i=0;i<30;i++)f.fade();const healthy=f.tracks[0];fail.deferPlay=true;f.audio.music('mid');const superseded=f.plays.at(-1);f.audio.music('late');const latest=f.plays.at(-1);assert.equal(latest.el,superseded.el);assert.equal(healthy.src,'music/Fresh_Beginnings.mp3');assert.equal(healthy.paused,false);assert.equal(healthy.level,.3);superseded.resolve();await f.settle();for(let i=0;i<20;i++)f.fade();assert.equal(healthy.level,.3);assert.equal(latest.el.level,0);latest.resolve();await f.settle();f.fade();assert.ok(Math.abs(healthy.level-.27)<1e-12);assert.equal(latest.el.level,.02);for(let i=0;i<30;i++)f.fade();assert.equal(healthy.paused,true);assert.equal(latest.el.level,.3);assert.equal(f.tracks.length,2);assert.equal(f.activeFades(),0);
});

test('trusted input during asset-host probing recovers music and effects without another gesture',async()=>{
 const fail={host:'cdn/',failedHost:'cdn/'},f=fixture({},fail),main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),a=main.indexOf('function unlockAudio('),b=main.indexOf('// ---- version, leaderboard',a);
 const gate=Function('audio','addEventListener','playTitleMusic',`let renderer=null;${main.slice(a,b)};return unlockAudio;`)(f.audio,()=>{},()=>f.audio.music('early'));
 gate({isTrusted:true});await f.settle();assert.equal(f.tracks.length,2,'first gesture unlocks during loading');
 fail.host='local/';f.audio.music('early');await f.audio.init();await f.settle();f.fade();f.audio.play('pickup',{minGap:0});
 assert.equal(f.tracks.length,2);assert.ok(f.tracks.some(el=>el.url==='local/music/Fresh_Beginnings.mp3'&&!el.paused&&el.level>0));assert.equal(f.sources.length,1);
});

test('current runs select Snowdrift on actual winter arrival, not the old5:30 timer',async()=>{
 const f=fixture();await f.audio.init();f.audio.onFx([],{t:330,snowWave:false},'early');await f.settle();
 assert(f.tracks.some(s=>s.src==='music/Adobe_Fantasy.mp3'&&!s.paused));
 f.audio.onFx([],{t:360,snowWave:true},'early');await f.settle();assert(f.tracks.some(s=>s.src==='music/snowdrift_mix.mp3'&&!s.paused));
 f.audio.onFx([],{t:900,snowWave:true},'early');await f.settle();assert(f.tracks.some(s=>s.src==='music/snowdrift_mix.mp3'&&!s.paused));
 f.audio.onFx([],{t:0,snowWave:false},'early');await f.settle();assert(f.tracks.some(s=>s.src==='music/Fresh_Beginnings.mp3'&&!s.paused));
});
test('legacy runs retain their original music schedule',async()=>{
 const f=fixture();await f.audio.init();f.audio.onFx([],{t:330},'early');await f.settle();assert(f.tracks.some(s=>s.src==='music/snowdrift_mix.mp3'&&!s.paused));
});
