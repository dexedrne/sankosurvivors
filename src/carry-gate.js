// Migration runs before main while this page owns the browser profile.
import {carryProgress,requireCarryReady} from './carry-progress.js';
import {recoverProgressImport,recoverRunProgress} from './progress-import.js';
import {translateText} from './i18n.js';
const $=id=>document.getElementById(id),text=s=>translateText(s,document.documentElement.lang);
const readout=s=>s.unreadable?text('This save has unreadable data. Keep a backup before replacing it.'):text(`${s.coins.toLocaleString()} coins · ${s.maps} maps cleared · ${s.ranks} skill ranks · ${s.gear} collected pieces`);
function prompt({old,device,changed=false,error=null}){
 const gate=$('profilegate'),retry=$('profiletry'),keep=$('carrydevice'),use=$('carryold'),choices=$('carrychoice'),hint=$('carryhint'),priorRetry=retry.onclick;
 const canKeep=(error?.carryInvalid||error?.carryCanKeep)&&location.origin==='https://sankosurvivors.quest',buttons=error?(canKeep?[keep,retry]:[retry]):[keep,use];
 $('game').inert=true;gate.classList.remove('hidden');choices.classList[error&&!canKeep?'add':'remove']('hidden');keep.hidden=!!error&&!canKeep;use.hidden=!!error;retry.hidden=!error;retry.disabled=false;
 $('profiletitle').textContent=text(error?error.recovery?'Restore progress before playing':error.carryCommitted?'Finish moving progress':'Could not move progress':'Which progress?');
 $('profilemessage').textContent=text(error?error.recovery?'Saved progress must recover before moving saves.':error.carryCommitted?'The old save is stored on this device. Try again to finish opening it.':error.carryInvalid?error.message:'This browser could not finish moving progress. Keep this app installed and try again.':'Choose one whole save. Choosing the old save replaces this device’s progress and settings. Cloud save will need sign-in again. The old address keeps its copy.');
 $('carrydevlabel').textContent=text('Keep this device’s save');$('carryoldlabel').textContent=text('Use the old save');$('carrydevsum').textContent=device?readout(device):'';$('carryoldsum').textContent=old?readout(old):'';
 retry.textContent=text(error?.recovery?error.runRecovery?'Retry saving run':'Restore previous progress':'Try again');hint.textContent=changed?text('This device’s progress changed. Review both saves and choose again.'):'';
 buttons[0].focus();
 return new Promise(resolve=>{
  let done=false,selected=null,raf=0,previous=null,previousDir=null;const held=new Set();
  const pad=()=>{try{return [...(navigator.getGamepads?.()||[])].find(Boolean)||null}catch{return null}};
  const finish=()=>{
   if(done||!selected||held.size||pad()?.buttons.some((b,i)=>(i===0||i===9)&&b.pressed))return;
   done=true;cancelAnimationFrame(raf);gate.classList.add('hidden');choices.classList.add('hidden');document.removeEventListener('keydown',down,true);document.removeEventListener('keyup',up,true);keep.onclick=use.onclick=null;retry.onclick=priorRetry;retry.hidden=false;retry.disabled=false;resolve(selected);
  };
  const select=value=>{if(done||selected)return;selected=value;for(const b of buttons)b.disabled=true;hint.textContent=text('Release the button to continue.');finish()};
  keep.onclick=buttons.includes(keep)?()=>select('device'):null;use.onclick=buttons.includes(use)?()=>select('old'):null;retry.onclick=buttons.includes(retry)?()=>select('retry'):null;for(const b of buttons)b.disabled=false;
  const focusStep=step=>{const i=buttons.indexOf(document.activeElement);buttons[(Math.max(0,i)+step+buttons.length)%buttons.length].focus()};
  function down(e){
   if(done)return;
   if(e.key==='Enter'||e.key===' '){held.add(e.key);if(e.repeat||selected)e.preventDefault();return;}
   if(e.key==='Tab'||/^Arrow/.test(e.key)){e.preventDefault();if(!selected)focusStep(e.key==='Tab'?(e.shiftKey?-1:1):['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);}
   else if(e.key==='Escape'){e.preventDefault();if(!selected)buttons[0].focus();}
  }
  function up(e){if(e.key==='Enter'||e.key===' '){held.delete(e.key);if(selected)e.preventDefault();finish()}}
  document.addEventListener('keydown',down,true);document.addEventListener('keyup',up,true);
  function poll(){
   if(done)return;const p=pad(),now=p?.buttons.map(b=>b.pressed)||[],dir=Math.abs(p?.axes?.[0]||0)>.6?(p.axes[0]>0?1:-1):Math.abs(p?.axes?.[1]||0)>.6?(p.axes[1]>0?1:-1):0,edge=i=>now[i]&&!previous?.[i];
   if(previous&&!selected){if(edge(1))buttons[0].focus();else{if(edge(12)||edge(14)||dir<0&&dir!==previousDir)focusStep(-1);if(edge(13)||edge(15)||dir>0&&dir!==previousDir)focusStep(1);if(edge(0))(buttons.includes(document.activeElement)?document.activeElement:buttons[0]).click();}}
   previous=now;previousDir=dir;finish();if(!done)raf=requestAnimationFrame(poll);
  }
  raf=requestAnimationFrame(poll);
 });
}
export async function carryGate(){
 let failure=null;
 for(;;)try{
  if(failure){
   const action=await prompt({error:failure});
   if(action==='device'){requireCarryReady();history.replaceState(null,'',location.pathname+location.search);}
   else if(failure.recovery){if(failure.runRecovery)recoverRunProgress(localStorage);else recoverProgressImport(localStorage);}
   failure=null;
  }
  return await carryProgress((old,device,changed)=>prompt({old,device,changed}));
 }catch(error){if(failure?.recovery&&!error.recovery)Object.assign(error,{recovery:true,runRecovery:failure.runRecovery});failure=error;}
}
