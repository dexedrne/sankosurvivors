// Bounded copied-body prediction adapts RunEscape MovementPrediction; see licenses/run-escape.txt.
import {walkPlayer,boundPlayer,playerStats,TICK} from './sim.js';
const TICK_MS=TICK*1000,LEAD_MS=300,STALE_MS=500,CORRECTION_MS=80,MAX_HISTORY=128;
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];

export function createMovementPrediction({sim,index,now}){
 let sequence=0,acknowledged=0,applied=[0,0],confirmed=false;
 let confirmedAt=now(),receivedAt=confirmedAt,renderedAt=confirmedAt,lastTick=sim.tick;
 let lastX=sim.players[index].x,lastZ=sim.players[index].z,pose=null,settling=false,inputExpired=false;
 let inputs=[{seq:0,at:confirmedAt,move:[0,0]}];
 // Collision caches belong to this view, never the authoritative simulation.
 const view={ground:sim.ground,map:sim.map,pace:sim.pace};
 function reset(){
  const time=now();inputs=[{seq:sequence,at:time,move:[0,0]}];applied=[0,0];
  confirmedAt=renderedAt=time;lastTick=sim.tick;
  lastX=sim.players[index].x;lastZ=sim.players[index].z;pose=null;settling=false;
 }
 function sample(move){
  const last=inputs.at(-1),time=now();
  if(!same(last.move,move)||(move[0]||move[1])&&time-last.at>=200){
   inputs.push({seq:++sequence,at:time,move:[...move]});
   if(inputs.length>MAX_HISTORY){inputs.shift();confirmedAt=Math.max(confirmedAt,inputs[0].at);}
  }
  return sequence;
 }
 function confirm(events){
  const time=now(),p=sim.players[index];receivedAt=time;confirmed=true;
  confirmedAt+=Math.max(0,sim.tick-lastTick)*TICK_MS;
  for(const event of events){
   if(event.hero!==index)continue;
   // An authority stop stays visible until a real input echo unlocks prediction.
   if(event.move&&!event.moveSeq&&!event.move[0]&&!event.move[1]){inputExpired=true;applied=[0,0];confirmedAt=time;continue;}
   if(!event.moveSeq||event.moveSeq<=acknowledged)continue;
   const input=inputs.find(i=>i.seq===event.moveSeq);if(!input)continue;inputExpired=false;
   const at=input.at+TICK_MS;
   // A coalesced tap may end on the old direction; its skipped samples still need retiring.
   if(!same(input.move,applied)||input.seq>acknowledged+1||Math.abs(at-confirmedAt)>2*TICK_MS)confirmedAt=at;
   acknowledged=input.seq;applied=input.move;
  }
  const pending=inputs.find(i=>i.seq>acknowledged&&!same(i.move,applied));
  if(!applied[0]&&!applied[1]&&!pending)confirmedAt=time;
  confirmedAt=Math.min(confirmedAt,pending?.at??time,time);
  while(inputs.length>1&&inputs[1].seq<=acknowledged&&inputs[1].at<=confirmedAt)inputs.shift();
  if(Math.hypot(p.x-lastX,p.z-lastZ)>1.5){reset();}
  lastTick=sim.tick;lastX=p.x;lastZ=p.z;
 }
 function move(body,input,ms,speed){
  let left=ms;
  do{const dt=Math.min(left,TICK_MS)/1000;walkPlayer(view,body,input.move[0]/127,input.move[1]/127,speed,dt);boundPlayer(view,body);left-=TICK_MS;}while(left>0);
 }
 function replay(body,from,to,speed){
  let input=inputs[0];
  for(const next of inputs){
   if(next.at<=from)input=next;
   else if(next.at<to){move(body,input,next.at-from,speed);from=next.at;input=next;}
   else break;
  }
  move(body,input,Math.max(0,to-from),speed);
 }
 function render(enabled){
  const time=now(),p=sim.players[index],dt=Math.max(0,time-renderedAt);
  if(!enabled||!p.alive||sim.over||Object.keys(sim.pending).length||p.rollT>1e-9||time<renderedAt){reset();return null;}
  if(!confirmed){confirmedAt=renderedAt=time;return null;}
  if(inputExpired){pose={x:p.x,z:p.z,face:p.face,moving:false};renderedAt=time;return publicPose();}
  const latest=inputs.at(-1),still=!latest.move[0]&&!latest.move[1];
  const capped=confirmedAt<time-LEAD_MS,halted=capped&&time-receivedAt>100;
  if(time-receivedAt>STALE_MS){renderedAt=time;if(pose)pose.moving=false;return publicPose();}
  const speed=playerStats(p).speed,target={x:p.x,z:p.z,face:p.face,moving:p.moving};
  replay(target,Math.max(confirmedAt,time-LEAD_MS),time,speed);
  if(!pose)pose={...target};
  else if(!halted){
   replay(pose,Math.max(renderedAt,time-LEAD_MS),time,speed);
   const dx=target.x-pose.x,dz=target.z-pose.z,error=Math.hypot(dx,dz),blend=1-Math.exp(-dt/CORRECTION_MS);
   const stopping=still&&latest.seq>acknowledged&&time-latest.at<2000;
   settling=still&&!stopping&&(error>=.1||settling&&error>.001);
   if(error>4){pose.x=target.x;pose.z=target.z;}
   else if(!still||settling){
    const x=pose.x,z=pose.z,face=pose.face;
    // Correction uses the same collision sweep, then snaps if a wall blocks the valid target.
    walkPlayer(view,pose,dx,dz,Math.max(1,error),blend);boundPlayer(view,pose);pose.face=face;
    if((pose.x-x)*dx+(pose.z-z)*dz+1e-12<(dx*dx+dz*dz)*blend*.5){pose.x=target.x;pose.z=target.z;}
   }
  }
  move(pose,latest,0,speed);pose.moving&&=!halted;renderedAt=time;
  return publicPose();
 }
 function publicPose(){return pose?{x:pose.x,z:pose.z,f:pose.face,mv:pose.moving}:null;}
 return {sample,confirm,render,reset};
}
