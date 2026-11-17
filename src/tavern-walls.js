import data from './tavern-wall-data.json' with {type:'json'};
import {groundHash} from './ground-pack.js';
const precise={bounds:data.bounds,walls:data.walls.map(w=>w.bounds)},cache=new WeakMap();
export function tavernGround(ground){
 if(!ground?.cell||ground.n!==512||!ground.fences)return ground;
 if(!cache.has(ground))cache.set(ground,groundHash(ground)===data.groundHash?{...ground,preciseWalls:precise}:ground);
 return cache.get(ground);
}
export function wallSegmentClear(precise,x0,z0,x1,z1,radius=0){
 if(!Number.isFinite(x0)||!Number.isFinite(z0)||!Number.isFinite(x1)||!Number.isFinite(z1)||!Number.isFinite(radius)||radius<0)return false;
 const b=precise.bounds;
 if(Math.max(x0,x1)<b[0]-radius||Math.min(x0,x1)>b[2]+radius||Math.max(z0,z1)<b[1]-radius||Math.min(z0,z1)>b[3]+radius)return true;
 for(const wall of precise.walls){
  const left=wall[0]-radius,back=wall[1]-radius,right=wall[2]+radius,front=wall[3]+radius;
  if(x0>=left&&x0<=right&&z0>=back&&z0<=front){
   // A body already overlapping a wall can leave, but cannot move farther into it.
   if(x1<left||x1>right||z1<back||z1>front||Math.min(x1-left,right-x1,z1-back,front-z1)<Math.min(x0-left,right-x0,z0-back,front-z0)-1e-12)continue;
   return false;
  }
  let lo=0,hi=1;
  for(const[a,c,min,max]of[[x0,x1,left,right],[z0,z1,back,front]]){
   const d=c-a;if(d===0){if(a<min||a>max){hi=-1;break;}}
   else{const t=(min-a)/d,u=(max-a)/d;lo=Math.max(lo,Math.min(t,u));hi=Math.min(hi,Math.max(t,u));if(lo>hi)break;}
  }
  if(lo<=hi)return false;
 }
 return true;
}
