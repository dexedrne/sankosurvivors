import test from 'node:test';
import assert from 'node:assert/strict';
test('health warning fades in below a quarter health and clears on heal, death, menus and missing state',async()=>{
 const {lowHealthOpacity}=await import('../src/health-warning.js');
 const p={alive:true,hp:100,maxHp:100};assert.equal(lowHealthOpacity(p,true),0);
 p.hp=25;assert.equal(lowHealthOpacity(p,true),0);p.hp=20;const low=lowHealthOpacity(p,true);assert(low>0&&low<.55);
 p.hp=1;assert(lowHealthOpacity(p,true)>low&&lowHealthOpacity(p,true)<=.55);
 assert.equal(lowHealthOpacity(p,false),0);p.alive=false;assert.equal(lowHealthOpacity(p,true),0);
 assert.equal(lowHealthOpacity(null,true),0);p.alive=true;p.maxHp=0;assert.equal(lowHealthOpacity(p,true),0);
 p.maxHp=100;p.hp=NaN;assert.equal(lowHealthOpacity(p,true),0);
});
test('actual animation loop refreshes the warning each frame, including healing and leaving play',async()=>{
 const {readFileSync}=await import('node:fs'),{lowHealthOpacity}=await import('../src/health-warning.js');
 const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),a=source.indexOf('function loop(ts) {'),b=source.indexOf('  enforceRankedDeadline();',a);assert(a>=0&&b>a);
 const body=source.slice(a+'function loop(ts) {'.length,b),player={id:'p1',alive:true,hp:10,maxHp:100};let opacity;
 const frame=mode=>Function('requestAnimationFrame','loop','$','lowHealthOpacity','sim','PLAYER','mode',body)(()=>{},()=>{},()=>({style:{setProperty:(key,value)=>{assert.equal(key,'--low-health');opacity=value;}}}),lowHealthOpacity,{players:[player]},'p1',mode);
 frame('play');assert(opacity>0);player.hp=100;frame('play');assert.equal(opacity,0);player.hp=10;frame('pause');assert.equal(opacity,0);frame('end');assert.equal(opacity,0);
});
