import * as T from 'three';
export const GUARD_ARMOR=['Head/Clothing/Iron Helmet','Chest/Clothing/Iron Chestplate','Legs/Clothing/Iron Leggings','Feet/Clothing/Iron Boots'];
export const DRIVER_LOOKS={
 guard:{hair:'Shaggy',hairColor:0x996f5f,skin:0xbe8e60,armor:{head:'Iron Helmet',chest:'Iron Chestplate',legs:'Iron Leggings',feet:'Iron Boots'}},
 priest:{hair:'Short',hairColor:0xcfcfcf,skin:0xe2c4af,shirt:0xe8e0d0,pants:0x3a3530},
};
const vec=(x,y,z)=>new T.Vector3(x,y,z);
function point(b){return b.getWorldPosition(new T.Vector3());}
function aim(b,child,target){
 const q=b.getWorldQuaternion(new T.Quaternion());
 const from=point(child).sub(point(b)).normalize(),to=target.clone().sub(point(b)).normalize();
 const wanted=new T.Quaternion().setFromUnitVectors(from,to).multiply(q);
 b.quaternion.copy(b.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(wanted));
 b.updateWorldMatrix(false,true);
}
function limb(a,b,c,target,bend){
 const origin=point(a),l1=origin.distanceTo(point(b)),l2=point(b).distanceTo(point(c));
 const d=target.clone().sub(origin),distance=Math.min(d.length(),(l1+l2)*.995);d.normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const normal=bend.clone().sub(d.clone().multiplyScalar(bend.dot(d))).normalize();
 aim(a,b,origin.clone().addScaledVector(d,along).addScaledVector(normal,height));aim(b,c,target);
}
export function createDriver(kit,car,spec={hair:'Short',shirt:0x7aaf6c,pants:0x4e5265}){
 const actor=kit.build({h:1.55,...spec});
 actor.mixer.stopAllAction();
 car.add(actor.root);actor.root.updateMatrixWorld(true);
 const bones=new Map();actor.master.traverse(o=>{if(o.isBone)bones.set(o.name.replace('mixamorig_',''),o);});
 const hips=bones.get('Hips'),seat=car.getObjectByName('seat_driver');
 const seatPosition=seat?car.worldToLocal(point(seat)):vec(.395,.4,-.43);
 const current=car.worldToLocal(point(hips));actor.root.position.add(seatPosition.clone().sub(current)).y+=.065;
 actor.root.updateMatrixWorld(true);
 const world=(v)=>car.localToWorld(v);
 const spine=bones.get('Spine'),neck=bones.get('Neck');
 aim(spine,neck,world(seatPosition.clone().add(vec(0,.48,-.10))));
 for(const [side,sign]of [['Left',1],['Right',-1]]){
  const hip=bones.get(side+'UpLeg'),knee=bones.get(side+'Leg'),foot=bones.get(side+'Foot');
  limb(hip,knee,foot,world(seatPosition.clone().add(vec(sign*.09,-.29,.56))),vec(0,.7,1));
  const shoulder=bones.get(side+'Arm'),elbow=bones.get(side+'ForeArm'),hand=bones.get(side+'Hand');
  const grip=car.getObjectByName('hand_wheel_'+(sign===1?'L':'R'));
  limb(shoulder,elbow,hand,grip?point(grip):world(seatPosition.clone().add(vec(sign*.18,.37,.34))),vec(sign,-1,-.1));
 }
 actor.root.updateMatrixWorld(true);
 actor.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 return actor;
}
