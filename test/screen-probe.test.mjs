import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../public/screen-test/probe.js',import.meta.url),'utf8');
function fixture({canvas=true,vv=true}={}){
 const listeners=new Map(),copies=[],details={textContent:'',focus(){}},button={},status={},rect={width:875,height:675};
 const ctx={fillRect(){},strokeRect(){}},field={width:0,height:0,getContext:()=>canvas?ctx:null,getBoundingClientRect:()=>rect};
 const nodes={field,details,copy:button,status,safe:{}};
 const environment={document:{documentElement:{dataset:{variant:'B'}},fullscreenEnabled:false,getElementById:id=>nodes[id]},navigator:{standalone:true,clipboard:{writeText:async text=>copies.push(text)}},window:{visualViewport:vv?{width:875,height:675,scale:1,addEventListener(){}}:undefined},innerWidth:875,innerHeight:675,screen:{width:951,height:675},matchMedia:q=>({matches:q.includes('landscape')}),getComputedStyle:()=>({paddingTop:'0px',paddingRight:'80px',paddingBottom:'20px',paddingLeft:'0px'}),addEventListener:(name,fn)=>listeners.set(name,fn)};
 for(const name of ['localStorage','sessionStorage','fetch','ethereum','location'])Object.defineProperty(environment,name,{get(){throw Error('Diagnostic must not access '+name);}});
 vm.createContext(environment);vm.runInContext(code,environment);
 return{environment,rect,field,details,button,status,copies,listeners,report:()=>JSON.parse(details.textContent)};
}
test('screen probe reports only viewport data, updates on resize and copies that report',async()=>{
 const f=fixture();const r=f.report();assert.deepEqual(r.viewport,[875,675]);assert.deepEqual(r.screen,[951,675]);assert.deepEqual(r.canvas,[875,675]);assert.equal(r.installed,true);
 assert.deepEqual(Object.keys(r).sort(),['test','installed','viewport','visualViewport','screen','canvas','orientation','safeArea','fullscreenEnabled','elementFullscreen','prefixedFullscreen','canvasPainted'].sort());
 f.environment.innerWidth=669;f.environment.innerHeight=902;f.rect.width=669;f.rect.height=902;f.listeners.get('resize')();assert.deepEqual(f.report().viewport,[669,902]);assert.deepEqual([f.field.width,f.field.height],[669,902]);
 await f.button.onclick();assert.equal(f.copies.length,1);assert.deepEqual(JSON.parse(f.copies[0]),f.report());assert.equal(f.report().canvasPainted,true);
});
test('unavailable canvas, visual viewport and clipboard still leave usable screen details',async()=>{
 const f=fixture({canvas:false,vv:false});assert.deepEqual(f.report().viewport,[875,675]);assert.equal(f.report().visualViewport,null);assert.equal(f.report().canvasPainted,false);
 delete f.environment.navigator.clipboard;await f.button.onclick();assert.match(f.status.textContent,/Select the details/);assert.deepEqual(f.copies,[]);
 f.environment.navigator.clipboard={writeText:async()=>{throw Error('Denied');}};await f.button.onclick();assert.match(f.status.textContent,/Select the details/);assert.deepEqual(f.report().screen,[951,675]);
});
