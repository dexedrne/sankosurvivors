import {coopReviveTarget,COOP_REVIVE_TICKS} from './coop-revive.js';
export function createCoopReviveUi(getContext){
 const $=id=>document.getElementById(id),panel=$('cooprevive'),button=$('cooprevivebtn'),message=$('cooprevivemessage'),name=$('cooprevivename'),progress=$('coopreviveprogress'),time=$('cooprevivetime');
 let keyboard=false,pointer=null,padHeld=false,padIdentity=null,lastMessage=null,lastName=null;
 function state(){
  const {run,mode,localId}=getContext(),sim=run?.sim;
  if(!sim?.coop||sim.ranked||sim.over||run.closed||run.held||mode!=='play'||document.hidden||document.hasFocus?.()===false||document.querySelector('.screen:not(.hidden),dialog[open]')||Object.keys(sim.pending).length)return null;
  const own=sim.players.find(p=>p.id===localId),other=sim.players.find(p=>p.id!==localId);
  if(!own||!other||own.alive&&other.alive||!own.alive&&!other.alive)return null;
  const target=own.alive?other:own,channel=sim.coopRevive,ticks=channel?.target===target.id?channel.ticks:0;
  return{own,other,ticks,canHelp:own.alive&&!!coopReviveTarget(sim,localId),message:own.alive?(ticks?'Keep holding to revive.':'Move closer and stand still.'):ticks?'Your teammate is reviving you.':'Your teammate can revive you.'};
 }
 function releasePointer(){const id=pointer;pointer=null;if(id!==null&&button.hasPointerCapture?.(id))button.releasePointerCapture(id);}
 function clear(){keyboard=padHeld=false;padIdentity=null;releasePointer();button.setAttribute('aria-pressed','false');panel.hidden=true;}
 function press(event){const s=state();if(!s?.canHelp||event.repeat||event.ctrlKey||event.metaKey||event.altKey)return false;keyboard=true;event.preventDefault?.();return true;}
 button.addEventListener('pointerdown',event=>{if(event.button!==0||pointer!==null||!state()?.canHelp)return;event.preventDefault();pointer=event.pointerId;button.setPointerCapture(event.pointerId);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{if(pointer===event.pointerId)releasePointer();});
 button.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&press(event))event.stopPropagation();});
 button.addEventListener('blur',()=>{keyboard=false;});
 button.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key)){keyboard=false;event.preventDefault();event.stopPropagation();}});
 function update(pad,edges={}){
  const s=state();if(!s){clear();return false;}panel.hidden=false;button.hidden=!s.own.alive;button.disabled=!s.canHelp;
  const identity=pad?`${pad.index}:${pad.id}`:null;if(identity!==padIdentity){padHeld=false;padIdentity=identity;}
  if(!pad?.buttons?.[1]?.pressed)padHeld=false;else if(edges.b&&s.canHelp)padHeld=true;
  if(!s.canHelp)releasePointer();
  const held=s.canHelp&&(keyboard||pointer!==null||padHeld);button.setAttribute('aria-pressed',String(held));
  const text=s.canHelp&&!s.ticks?'Hold for 3 seconds.':s.message;
  if(text!==lastMessage){message.textContent=text;lastMessage=text;}if(s.other.name!==lastName){name.textContent=s.other.name;lastName=s.other.name;}
  progress.value=s.ticks;const remaining=(Math.ceil(Math.max(0,COOP_REVIVE_TICKS-s.ticks)/3)/10).toFixed(1)+'s';if(time.textContent!==remaining)time.textContent=remaining;
  return held;
 }
 return{update,clear,keyDown:event=>event.key.toLowerCase()==='f'&&press(event),keyUp:key=>{if(key.toLowerCase()==='f')keyboard=false;}};
}
