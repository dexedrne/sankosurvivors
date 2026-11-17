import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const input=source.slice(source.indexOf('// ---- input -----'),source.indexOf("addEventListener('keyup'"));
const navStart=source.indexOf("addEventListener('keydown'",source.indexOf('function navBack()')),navigation=source.slice(navStart,source.indexOf('// ---- minimap:',navStart));
const event=(key,modifier)=>({key,repeat:false,[modifier]:true,target:{matches:()=>false,closest:()=>null},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},stopPropagation(){this.stopped=true;}});
function handler(code,mode){const callbacks=[];const state=Function('addEventListener',`
 let mode=${JSON.stringify(mode)},navEl=null;const keys=new Set();let actions=0;
 const walletModalOpen=()=>false,$=()=>({disabled:false,classList:{contains:()=>true}}),coopReviveUi={keyDown:()=>false},doReroll=()=>actions++,navScreen=()=>({id:'guide',contains:()=>true}),navMove=()=>actions++;
 ${code}
 return ()=>({actions,keys:keys.size});`)((type,fn)=>callbacks.push(fn));assert.equal(callbacks.length,1);return {down:callbacks[0],state};}
for(const modifier of ['ctrlKey','metaKey','altKey']){
 test(`Survivors ${modifier} shortcuts cannot reroll or become held gameplay keys`,()=>{const f=handler(input,'levelup'),e=event('r',modifier);f.down(e);assert.deepEqual(f.state(),{actions:0,keys:0});assert(!e.prevented);});
 test(`Survivors ${modifier} arrows retain browser navigation`,()=>{const f=handler(navigation,'pause'),e=event('ArrowLeft',modifier);f.down(e);assert.deepEqual(f.state(),{actions:0,keys:0});assert(!e.prevented);assert(!e.stopped);});
}
test('ordinary and Shift-modified Survivors controls still work',()=>{for(const modifier of ['none','shiftKey']){const f=handler(input,'levelup');f.down(event('r',modifier));assert.deepEqual(f.state(),{actions:1,keys:1});const n=handler(navigation,'pause'),e=event('ArrowLeft',modifier);n.down(e);assert.equal(n.state().actions,1);assert(e.prevented);}});
test('Survivors menu focus traps preserve modifier shortcuts and plain Tab wrapping',()=>{
 const a=source.indexOf('function containMenuTab('),code=source.slice(a,source.indexOf('\n}',a)+2);
 for(const modifier of ['ctrlKey','metaKey','altKey','none','shiftKey']){let focus=0;const nodes=[{focus(){focus++;}},{focus(){focus++;}}],doc={activeElement:modifier==='shiftKey'?nodes[0]:nodes[1]},down=Function('document',code+';return containMenuTab;')(doc),e={...event('Tab',modifier),currentTarget:{querySelectorAll:()=>nodes}};nodes.forEach(n=>n.offsetParent={});down(e);const ordinary=['none','shiftKey'].includes(modifier);assert.equal(focus,Number(ordinary));assert.equal(!!e.prevented,ordinary);}
});
test('renderer roof, rotation and zoom handlers leave browser shortcuts alone',()=>{
 const lines=fs.readFileSync(new URL('../src/render.js',import.meta.url),'utf8').split('\n').filter(l=>l.includes("window.addEventListener('keydown'"));assert.equal(lines.length,3);
 for(const modifier of ['ctrlKey','metaKey','altKey']){const callbacks=[],state=Function('window','localStorage',`let roofsOff=false;const roofHidden=new Set(),rotKeys={q:false,e:false},cam={yaw:1,pitch:1,zoomT:1};${lines.join('\n')};return()=>({roofsOff,roofKeys:roofHidden.size,rotKeys,cam});`)({addEventListener:(type,fn)=>callbacks.push(fn)},{setItem(){throw Error('Modified shortcut wrote preferences');}});for(const key of ['t','q','e','Home','+','-'])for(const down of callbacks)down(event(key,modifier));assert.deepEqual(state(),{roofsOff:false,roofKeys:0,rotKeys:{q:false,e:false},cam:{yaw:1,pitch:1,zoomT:1}});}
});
test('preboot and recovery focus handlers preserve browser modifier shortcuts',()=>{
 const carry=fs.readFileSync(new URL('../src/carry-gate.js',import.meta.url),'utf8'),a=carry.indexOf('  function down(e){'),downCode=carry.slice(a,carry.indexOf('  function up(e)',a));
 const recovery=source.split('\n').find(l=>l.includes('screen.onkeydown = e =>'));
 for(const modifier of ['ctrlKey','metaKey','altKey','none']){let moved=0;const down=Function('focusStep','buttons',`let done=false,selected=null;const held=new Set();${downCode};return down;`)(()=>moved++,[]),e=event('Tab',modifier);down(e);assert.equal(moved,Number(modifier==='none'));assert.equal(!!e.prevented,modifier==='none');let focused=0;const screen={};Function('screen','retry',recovery)(screen,{focus(){focused++;}});const next=event('Tab',modifier);screen.onkeydown(next);assert.equal(focused,Number(modifier==='none'));assert.equal(!!next.prevented,modifier==='none');}
});
