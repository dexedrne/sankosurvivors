import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const source=readFileSync(new URL('../src/render.js',import.meta.url),'utf8');
function fixture(){const start=source.indexOf('  function meleeTrail('),end=source.indexOf('\n  }',start),calls=[];assert(start>=0&&end>start,'time-based melee trail handler missing');const run=Function('meleeFx',source.slice(start,end+4)+';return meleeTrail;')({axe:(...a)=>calls.push(['axe',...a]),sword:(...a)=>calls.push(['sword',...a])});return{run,calls};}
for(const art of ['axe','sword'])test(`${art} wake uses sim-time cadence and ignores duplicate rendered snapshots`,()=>{
 const totals=[];for(const repeats of [1,6]){const {run,calls}=fixture(),o={userData:{}};for(let tick=0;tick<=30;tick++)for(let n=0;n<repeats;n++)run(o,art,2,3,.4,.7,true,tick/30);totals.push(calls.length);assert(calls.every(c=>c[0]===art));assert(calls.every(c=>c[1]===2&&c[2]===3));}assert.deepEqual(totals,[16,16]);
});
test('projectile trail recovers from a rewind without spawning while the sim clock is held',()=>{
 const {run,calls}=fixture(),o={userData:{}};run(o,'axe',2,3,0,1,false,10);for(let i=0;i<40;i++)run(o,'axe',2,3,0,1,false,10);assert.equal(calls.length,1);run(o,'axe',2,3,0,1,false,1);assert.equal(calls.length,2);run(o,'arrow',2,3,0,1,false,2);assert.equal(calls.length,2);
});
