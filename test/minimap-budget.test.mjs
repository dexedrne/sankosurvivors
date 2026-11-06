import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),a=main.indexOf('  hudT += dt;'),b=main.indexOf('\n}',a);assert.ok(a>=0&&b>a);
function fixture(){let hud=0,map=0;const rows=[[1,'goblin',1,1],[2,'skeleton',2,2]],view={fx:[],enemies:rows};const frame=Function('updateHud','drawMinimap',`let hudT=0;return(dt,view)=>{${main.slice(a,b)}}`)(v=>{assert.equal(v,view);hud++;},v=>{assert.equal(v.enemies,rows);map++;});return{view,frame,counts:()=>({hud,map})};}
test('busy combat keeps every immediate HUD event without bypassing minimap refresh budget',()=>{
 const h=fixture();for(let i=0;i<60;i++){h.view.fx=[{k:i%2?'boss':'get'}];h.frame(1/60,h.view);}assert.equal(h.counts().hud,60);assert.ok(h.counts().map>=10&&h.counts().map<=13,JSON.stringify(h.counts()));assert.equal(h.view.enemies.length,2);
});
test('quiet and already slow frames keep both HUD and complete minimap current',()=>{
 const h=fixture();for(let i=0;i<60;i++)h.frame(1/60,h.view);assert.deepEqual(h.counts(),{hud:12,map:12});
 const slow=fixture();for(let i=0;i<10;i++){slow.view.fx=[{k:'boss'}];slow.frame(.1,slow.view);}assert.deepEqual(slow.counts(),{hud:10,map:10});
});
