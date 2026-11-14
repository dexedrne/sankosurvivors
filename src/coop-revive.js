import {clearPath} from './sim.js';
import {dhypot} from './dmath.js';
export const COOP_REVIVE_TICKS=90,COOP_REVIVE_RANGE=2.5;
const reset=state=>{state.helper=null;state.target=null;state.ticks=0;};
export function coopReviveTarget(sim,helperId){
 if(!sim.coop||sim.ranked||sim.over||Object.keys(sim.pending).length)return null;
 const helper=sim.players.find(p=>p.id===helperId);
 if(!helper?.alive||helper.hp<=0||helper.moving||helper.rollT>1e-9)return null;
 return sim.players.find(p=>p.id!==helperId&&!p.alive&&p.hp===0&&dhypot(p.x-helper.x,p.z-helper.z)<=COOP_REVIVE_RANGE&&clearPath(sim,helper.x,helper.z,p.x,p.z))||null;
}
export function stepCoopRevive(sim,state,advanced,hurtIds=[]){
 if(!sim.coop||sim.ranked||sim.over||!state.held.some(Boolean)){reset(state);return;}
 if(!advanced)return;
 let helper=null,target=null;
 for(let i=0;i<sim.players.length;i++)if(state.held[i]&&!hurtIds.includes(sim.players[i].id)){
  target=coopReviveTarget(sim,sim.players[i].id);if(target){helper=sim.players[i];break;}
 }
 if(!helper||!target){reset(state);return;}
 if(state.helper!==helper.id||state.target!==target.id){reset(state);state.helper=helper.id;state.target=target.id;}
 if(++state.ticks<COOP_REVIVE_TICKS)return;
 target.alive=true;target.hp=target.maxHp*.3;target.inv=2;target.hurt=0;target.moving=false;target.rollT=0;
 sim.fx.push({k:'revive',id:target.id,x:target.x,z:target.z});reset(state);
}
