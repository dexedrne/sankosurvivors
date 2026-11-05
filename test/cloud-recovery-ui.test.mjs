import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),source=main.slice(main.indexOf('function showProgressRecovery('),main.indexOf("$('xferload').onclick ="));
function setup({wait=false,fail=false,modal=false}={}){
 const nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,textContent:'',focusCount:0,focus(){this.focusCount++;},classList:{remove(){}}});return nodes.get(id);};let reloads=0,recovered=0,allowed=true,release;const gate=new Promise(r=>{release=r;});
 const show=Function('$','location','withImportLock','recoverProgressImport','localStorage','walletModalOpen',`let mode='title';${source};return showProgressRecovery;`)($,{reload(){reloads++;}},async fn=>{if(wait)await gate;return fn();},()=>{recovered++;if(fail)throw Error('fixture storage denied');},{fixture:true},()=>modal);
 return{$,show,reloads:()=>reloads,recovered:()=>recovered,allowed:()=>allowed,busy:()=>{allowed=false;},ready:()=>{allowed=true;},release:()=>release()};
}
test('startup recovery works without any later wallet bindings initialized',async()=>{const f=setup();f.show();await f.$('progressretry').onclick();assert.equal(f.reloads(),1);assert.equal(f.recovered(),1);});
for(const kind of ['buy','connection','holder signature','ranked action'])test(`recovery Retry cannot reload over a pending ${kind}`,async()=>{
 const f=setup();f.busy();f.show(f.allowed);await f.$('progressretry').onclick();assert.equal(f.reloads(),0);assert.equal(f.recovered(),0);assert.equal(f.$('progressretry').disabled,false);
});
test('recovery rechecks wallet readiness after waiting for another tab',async()=>{
 const f=setup({wait:true});f.show(f.allowed);const restoring=f.$('progressretry').onclick();f.busy();f.release();await restoring;assert.equal(f.reloads(),0);assert.equal(f.$('progressretry').disabled,false);f.ready();await f.$('progressretry').onclick();assert.equal(f.reloads(),1);
});
test('duplicate recovery taps keep one restoration and reload',async()=>{const f=setup({wait:true});f.show(f.allowed);const a=f.$('progressretry').onclick(),b=f.$('progressretry').onclick();f.release();await Promise.all([a,b]);assert.equal(f.recovered(),1);assert.equal(f.reloads(),1);});
test('failed recovery remains retryable without reloading',async()=>{const f=setup({fail:true});f.show(f.allowed);await f.$('progressretry').onclick();assert.equal(f.reloads(),0);assert.equal(f.$('progressretry').disabled,false);assert.ok(f.$('progressrecoverystatus').textContent);});

test('recovery keeps WalletConnect completion controls focused and its own screen inert',()=>{const f=setup({modal:true});f.show(f.allowed);assert.equal(f.$('progressretry').focusCount,0);assert.equal(f.$('progressrecovery').inert,true);});
