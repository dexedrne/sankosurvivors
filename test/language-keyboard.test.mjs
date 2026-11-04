import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const input=source.slice(source.indexOf('// ---- input -----'),source.indexOf("addEventListener('keyup'"));
const navigation=source.slice(source.indexOf("addEventListener('keydown'",source.indexOf('function navBack()')),source.indexOf('// ---- minimap:'));
for(const [name,code] of [['input',input],['capture navigation',navigation]]) {
  test(`language selector keyboard input bypasses ${name} game shortcuts`,()=>{
    const callbacks=[];
    const state=Function('addEventListener',`
      const keys=new Set(),mode='title',navEl=null;
      let started=0,moved=0;
      const $=()=>({disabled:false,classList:{contains:()=>true}}),startRun=()=>started++,navMove=()=>moved++;
      ${code}
      return ()=>({started,moved,keys:keys.size});
    `)((event,callback)=>callbacks.push(callback));
    assert.equal(callbacks.length,1);
    for(const key of ['ArrowDown','Enter',' ']) {
      let prevented=false;
      callbacks[0]({key,repeat:false,target:{matches:s=>s==='[data-language]'||s.split(/[,\s]+/).includes('select')},preventDefault(){prevented=true;}});
      assert.equal(prevented,false,key+' must retain native select behavior');
    }
    assert.deepEqual(state(),{started:0,moved:0,keys:0});
  });
}

for(const [name,code] of [['input',input],['capture navigation',navigation]]) test(`payment and other text fields bypass ${name} game shortcuts`,()=>{
  for(const tag of ['input','textarea','summary']){
    const callbacks=[];
    const state=Function('addEventListener',`
      const keys=new Set(),mode='title',navEl=null;
      let started=0,moved=0;
      const $=()=>({disabled:false,classList:{contains:()=>true}}),startRun=()=>started++,navMove=()=>moved++;
      ${code}
      return ()=>({started,moved,keys:keys.size});
    `)((event,callback)=>callbacks.push(callback));
    for(const key of ['ArrowDown','Enter',' ']){
      let prevented=false;
      callbacks[0]({key,repeat:false,target:{matches:s=>s.split(/[,\s]+/).includes(tag)},preventDefault(){prevented=true;}});
      assert.equal(prevented,false);
    }
    assert.deepEqual(state(),{started:0,moved:0,keys:0});
  }
});
