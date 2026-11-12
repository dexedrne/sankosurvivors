import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const block=name=>{const at=source.indexOf(`function ${name}(`);assert(at>=0,name);const end=source.indexOf('\n}',at);assert(end>at);return source.slice(source.slice(at-6,at)==='async '?at-6:at,end+2);};
test('the map panel exposes all five run modes and an explicit native boss selector',()=>{
 for(const id of ['variantpick','runvariant','trialpick','trialboss','variantinfo','modeprogress'])assert.match(html,new RegExp('id="'+id+'"'));
 for(const mode of ['normal','boss','raid','fun','wizard'])assert(html.includes('data-variant="'+mode+'"'),mode);
});
test('a special-mode result refuses submission before reading a name, ticket or issuing any request',async()=>{
 const fn=Function('$','lastRun',`return ${block('submitScore')}`)(()=>{throw Error('must not read controls');},null);
 for(const variant of ['boss','raid','fun','wizard'])assert.deepEqual(await fn({variant}),{ok:false});
});
test('special-mode startup cannot request a campaign leaderboard ticket',()=>{
 let requests=0;const fn=Function('fetch','BASE',`return ${block('loadCasualTickets')}`)(()=>{requests++;throw Error('must not request ticket');},'/');
 for(const variant of ['boss','raid','fun','wizard'])fn({sim:{variant}});
 assert.equal(requests,0);
});
test('returning from special co-op re-enables mode controls and restores the fixed kit disclosure',()=>{
 const state=Function(`
 const nodes=new Map(),node=()=>({disabled:false,children:[],textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){}}),$=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 $('runvariant').children=['normal','boss','raid','fun','wizard'].map(variant=>({...node(),dataset:{variant}}));
 let coop={close(){}},selVariant='boss',mapLoading=false,runStarting=false,selMap='greentown',coopHomeMap='greentown',coopResult=null,merchantVisit=null,PLAYER='p2',rankedRun=null,rankedRec=null,rankedClock=null,casualRun=null,sim={},mode='end',waitingForMove=false,rewardWasShown=false;
 const BOSS_KIT={adv:'ranger',label:'Fixed Ranger kit'},ADVENTURER_BY_ID={ranger:{name:'Ranger'}},MODE_INFO={boss:'Practice'},window={},renderer={reset(){},setZoom(){},setShift(){}},rankedPlaying=()=>false,resetQuitConfirm=()=>{},applyDmt=()=>{},playTitleMusic=()=>{},buildAdventurers=()=>{$('ainfo').textContent='ordinary selection';},buildMaps=()=>{},showBest=()=>{},refreshPendingTitleProgress=()=>{};
 ${block('updateModePicker')}
 ${block('toMenu')}
 updateModePicker();const before=$('runvariant').children.map(b=>b.disabled);toMenu();
 return{before,after:$('runvariant').children.map(b=>b.disabled),trial:$('trialboss').disabled,kit:$('ainfo').textContent,coop};`)();
 assert.deepEqual(state.before,[true,true,true,true,true]);assert.equal(state.coop,null);assert.deepEqual(state.after,[false,false,false,false,false]);assert.equal(state.trial,false);assert.equal(state.kit,'Fixed Ranger kit');
});
