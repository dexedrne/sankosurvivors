import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
function handler(clipboard){
 const start=main.indexOf('async function copyUpdate('),end=main.indexOf("$('updbtn').onclick",start);assert(start>=0&&end>start,'shared copy action exists');
 return Function('navigator',main.slice(start,end)+';return copyUpdate;')({clipboard});
}
function block(){
 const fields={'.updhead b':{textContent:'Başlık'},'.updhead span':{textContent:'6 Nov 2026 · v0.44.41'}},items=[{textContent:'Türkçe not'},{textContent:'Second line'}];let box=null;
 const row={querySelector:s=>s==='.updcopytext'?box:fields[s],querySelectorAll:()=>items,append:e=>box=e,ownerDocument:{createElement:()=>({focus(){this.focused=true;},select(){this.selected=true;}})}},button={closest:()=>row,textContent:'Copy'};
 return{button,box:()=>box};
}
test('copy uses the visible translated notes/version in plain text',async()=>{
 const row=block(),copies=[];await handler({writeText:async text=>copies.push(text)})(row.button);
 assert.deepEqual(copies,['Başlık\n6 Nov 2026 · v0.44.41\n\n- Türkçe not\n- Second line']);assert.equal(row.button.textContent,'Copied');assert.equal(row.box(),null);
});
for(const clipboard of[undefined,{writeText:async()=>{throw Error('denied');}}])test('unavailable clipboard offers selected text without claiming success',async()=>{
 const row=block();await handler(clipboard)(row.button);const box=row.box();assert(box);assert.equal(box.readOnly,true);assert.equal(box.focused,true);assert.equal(box.selected,true);assert.match(box.value,/Türkçe not/);assert.equal(row.button.textContent,'Select and copy');
 await handler(clipboard)(row.button);assert.equal(row.box(),box,'reuse the same fallback field');
});
