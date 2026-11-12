import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('function cardImage('),source.indexOf('function endRun()'));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const nodes=new Map(),requests=[],timers=new Map(),drawn=[],downloads=[],shared=[],languageListeners=[];let serial=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',innerHTML:'',classList:{hidden:false,add(){this.hidden=true;},toggle(_,on){this.hidden=on;}}});return nodes.get(id);};
 const build={name:'Player',map:'Greentown',t:61,sections:[{title:'Weapons',rows:[{name:'Bronze Sword',icon:'sword.png',details:['Level: 1']}]}],stats:[]},result={map:'green',points:600};
 let blobCallback;const context={finishedBuilds:new WeakMap([[result,build]]),cardImages:new Map(),readyRunCard:null,cardGeneration:0,lastRun:result,mode:'end',Image:class{set src(value){this.url=value;if(value)requests.push(this);}},File,Blob,location:{host:'local.test'},$:node,asset:x=>x,esc:s=>String(s).replaceAll('<','&lt;'),translateText:(s,lang)=>lang+':'+s,drawRunCard:(_,b,images,translate)=>drawn.push({build:b,images,language:translate('test')}),document:{documentElement:{lang:'en'},fonts:{ready:Promise.resolve()},querySelectorAll:()=>[{addEventListener:(_,f)=>languageListeners.push(f)}],createElement:tag=>tag==='canvas'?{toBlob:callback=>{blobCallback=callback;}}:{click(){downloads.push(this);},remove(){}},body:{appendChild(){}}},navigator:{canShare:()=>true,share:async payload=>shared.push(payload)},URL:{createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}},setTimeout:f=>{timers.set(++serial,f);return serial;},clearTimeout:id=>timers.delete(id)};
 vm.runInNewContext(helpers+'\nglobalThis.prepare=prepareEndCard;globalThis.render=renderEndBuild;',context);
 return{context,node,build,result,requests,timers,drawn,downloads,shared,languageListeners,async load(){for(const img of requests.splice(0))img.onload?.();await settle();},finish(blob=new Blob(['png'],{type:'image/png'})){blobCallback(blob);},get hasBlobCallback(){return!!blobCallback;}};
}
test('card export is user initiated and never changes the score payload',async()=>{
 const f=fixture(),before=JSON.stringify(f.result),pending=f.context.prepare(f.result);assert.equal(f.node('savecard').disabled,true);await f.load();f.finish();await pending;
 assert.equal(f.context.readyRunCard.result,f.result);assert.equal(f.drawn[0].build.points,600);assert.equal(f.node('savecard').disabled,false);assert.equal(f.downloads.length,0);assert.equal(f.shared.length,0);assert.equal(JSON.stringify(f.result),before);
 f.node('savecard').onclick();assert.equal(f.downloads.length,1);assert.match(f.downloads[0].download,/SankoSurvivors-green-61s\.png/);await f.node('sharecard').onclick();assert.equal(f.shared.length,1);assert.equal(f.shared[0].files[0].type,'image/png');assert.equal(f.shared[0].files[0].name,f.downloads[0].download);
});
test('failed image exports retain the text build and allow retry with a fresh request',async()=>{
 const f=fixture();f.context.render(f.result);assert.match(f.node('endbuildbody').innerHTML,/Bronze Sword/);f.requests[0].onerror();await settle();assert.equal(f.node('savecard').disabled,false);assert.equal(f.node('savecard').textContent,'Retry build card');assert.equal(f.context.readyRunCard,null);assert.match(f.node('endbuildbody').innerHTML,/Bronze Sword/);
 await f.load();const pending=f.context.prepare(f.result);await f.load();f.finish();await pending;assert(f.context.readyRunCard);assert.equal(f.timers.size,0);
});
test('an old image or PNG completion cannot replace a newer run or an Endless continuation',async()=>{
 for(const stage of ['images','blob']){const f=fixture(),pending=f.context.prepare(f.result);if(stage==='blob')await f.load();f.context.mode='play';f.context.lastRun={map:'apache'};if(stage==='images')await f.load();else f.finish();await pending;assert.equal(f.context.readyRunCard,null);assert.equal(f.downloads.length,0);assert.equal(f.shared.length,0);}
});
test('a language change supersedes an in-flight image and share cancellation leaves download available',async()=>{
 const f=fixture(),first=f.context.prepare(f.result);await f.load();f.context.document.documentElement.lang='tr';f.finish();await first;assert.equal(f.context.readyRunCard,null);
 const next=f.context.prepare(f.result);await settle();f.finish();await next;assert.equal(f.drawn.at(-1).language,'tr:test');f.context.navigator.share=async()=>{throw Object.assign(Error('cancelled'),{name:'AbortError'});};const status=f.node('cardstatus').textContent;await f.node('sharecard').onclick();assert.equal(f.node('cardstatus').textContent,status);assert.equal(f.node('savecard').disabled,false);
});
test('unavailable PNG export is recoverable and a missing snapshot clears an older card',async()=>{
 const f=fixture(),pending=f.context.prepare(f.result);await f.load();f.finish(null);await pending;assert.equal(f.node('savecard').textContent,'Retry build card');assert.equal(f.node('savecard').disabled,false);
 f.context.readyRunCard={result:f.result};f.context.render({map:'other'});assert.equal(f.context.readyRunCard,null);assert.equal(f.node('savecard').disabled,true);assert.equal(f.node('sharecard').classList.hidden,true);assert.match(f.node('endbuildbody').textContent,/run result is kept/);
});

test('a stalled font download reaches a retry state instead of disabling export forever',async()=>{
 const f=fixture();f.context.document.fonts.ready=new Promise(()=>{});const pending=f.context.prepare(f.result);await f.load();assert.equal(f.timers.size,1,'font wait must have a deadline');for(const callback of [...f.timers.values()])callback();await pending;assert.equal(f.node('savecard').disabled,false);assert.equal(f.node('savecard').textContent,'Retry build card');assert.equal(f.timers.size,0);
});

test('copy writes the prepared PNG only after a click and confirms after clipboard resolution',async()=>{
 const f=fixture(),writes=[];let complete;
 f.context.ClipboardItem=class{constructor(data){this.data=data;}};
 f.context.navigator.clipboard={write:items=>{writes.push(items);return new Promise(resolve=>{complete=resolve;});}};
 const pending=f.context.prepare(f.result);assert.equal(f.node('copycard').disabled,true);await f.load();f.finish();await pending;assert.equal(writes.length,0);
 assert.equal(f.node('copycard').disabled,false);assert.equal(typeof f.node('copycard').onclick,'function');const copied=f.node('copycard').onclick();assert.equal(writes.length,1);assert.equal(writes[0][0].data['image/png'],f.context.readyRunCard.blob);assert.doesNotMatch(f.node('cardstatus').textContent,/copied/i);complete();await copied;assert.match(f.node('cardstatus').textContent,/copied/i);
});
test('unsupported or denied image clipboard keeps Save available and never claims success',async()=>{
 for(const supported of [false,true]){const f=fixture();f.context.ClipboardItem=class{constructor(data){this.data=data;}};if(supported)f.context.navigator.clipboard={write:async()=>{throw Error('NotAllowedError');}};
 const pending=f.context.prepare(f.result);await f.load();f.finish();await pending;assert.equal(typeof f.node('copycard').onclick,'function');await f.node('copycard').onclick();assert.match(f.node('cardstatus').textContent,/save/i);assert.doesNotMatch(f.node('cardstatus').textContent,/copied/i);assert.equal(f.node('savecard').disabled,false);}
});
test('a stale clipboard completion cannot change the next run status',async()=>{
 const f=fixture();let complete;f.context.ClipboardItem=class{};f.context.navigator.clipboard={write:()=>new Promise(resolve=>{complete=resolve;})};const pending=f.context.prepare(f.result);await f.load();f.finish();await pending;assert.equal(typeof f.node('copycard').onclick,'function');const copied=f.node('copycard').onclick();f.context.lastRun={map:'apache'};f.node('cardstatus').textContent='Next run';complete();await copied;assert.equal(f.node('cardstatus').textContent,'Next run');
});
