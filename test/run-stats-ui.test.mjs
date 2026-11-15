import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('late tickets stay with their completed run and never replace the new run active ticket',async()=>{
 const a={sim:{map:{id:'greentown'},players:[{id:'p1',adv:'ranger'}],hard:false,endless:false},phase:'playing'},b={sim:{map:{id:'apache'},players:[{id:'p1',adv:'wizard'}],hard:false,endless:false},phase:'playing'},pending=[],urls=[];
 const c={casualRun:a,sim:a.sim,runTicket:null,PLAYER:'p1',BASE:'/',URLSearchParams,fetch:url=>{urls.push(url);return new Promise(r=>pending.push(r));}};vm.createContext(c);
 const start=main.indexOf('function loadCasualTickets('),end=main.indexOf('function runGround()',start);assert(start>0&&end>start);vm.runInContext(main.slice(start,end),c);
 c.loadCasualTickets(a);c.casualRun=b;c.sim=b.sim;c.loadCasualTickets(b);pending[1]({ok:true,json:async()=>({ticket:'new-score',statsTicket:'new-stats'})});await b.tickets;pending[0]({ok:true,json:async()=>({ticket:'old-score',statsTicket:'old-stats'})});await a.tickets;
 assert.equal(c.runTicket,'new-score');assert.equal(a.statsTicket,'old-stats');assert.equal(b.statsTicket,'new-stats');assert(urls.every(u=>u.includes('stats=1')&&u.includes('kind=casual')));
});
