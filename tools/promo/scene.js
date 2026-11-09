import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createCharacterKit } from '/source/character.js';
import { createDriver } from './driver.js';
const W=720,H=1280,FPS=24;
const q=window.__sq,r=q.renderer(),T=r.THREE;
const dc=new DRACOLoader();dc.setDecoderPath('/vendor/examples/jsm/libs/draco/gltf/');
const gl=new GLTFLoader();gl.setDRACOLoader(dc);
const load=url=>gl.loadAsync(url);
const [g,kit]=await Promise.all([load('/assets/racers/cars/miata.glb'),createCharacterKit(load,p=>'/assets/'+p)]);
const car=g.scene;car.traverse(o=>{if(/LOD2|_source|hardtop|popup_open|:open/.test(o.name)||/^softtop_(?!folded)/.test(o.name))o.visible=false;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});const driver=createDriver(kit,car);car.visible=false;r.debugScene().scene.add(car);
const wheels=[];car.traverse(o=>{if(/wheel_(FL|FR|RL|RR)_LOD1$/.test(o.name))wheels.push(o);});
const out=document.createElement('canvas');out.width=W;out.height=H;const ctx=out.getContext('2d');
await document.fonts.load('32px RSBold');await document.fonts.load('48px RSQuill8');
q.setAdv('wizard');await q.setMap('greentown');await q.startRun();q.god();q.pause(true);
window.__stopRAF=true;await new Promise(resolve=>setTimeout(resolve,100));
const style=document.createElement('style');style.textContent='body > :not(#c):not(script):not(style){visibility:hidden!important}';document.head.append(style);
r.applySettings({quality:'high',res:'1',fps:'30',shadows:true,shadowq:'medium',ao:false,dof:false,bloom:true,grade:true,shake:false,numbers:false,time:'day'});
let active=-1;
window.__promoBounds={};
function text(s,x,y,size=34,color='#ffff00',font='RSBold'){
 ctx.font=`${size}px ${font}`;const width=ctx.measureText(s).width;if(x-width/2<32||x+width/2>W-32||y<80||y>H-80)throw Error('Copy outside safe margins: '+s);const b=window.__promoBounds[s]||{left:W,right:0,top:H,bottom:0,font,size};b.left=Math.min(b.left,x-width/2);b.right=Math.max(b.right,x+width/2);b.top=Math.min(b.top,y-size);b.bottom=Math.max(b.bottom,y);window.__promoBounds[s]=b;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle='#17120a';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);
}
function head(s,x,z,height=2.1){const v=new T.Vector3(x,r.groundAt(x,z)+height,z).project(r.debugScene().camera);text(s,Math.max(240,Math.min(W-240,(v.x*.5+.5)*W)),Math.max(200,Math.min(H-200,(-v.y*.5+.5)*H)));}
function footer(top,bottom){ctx.fillStyle='rgba(20,15,10,.72)';ctx.fillRect(40,1000,640,150);text(top,360,1056,36,'#f9e3ab','RSQuill8');text(bottom,360,1110,31,'#fff0ce');}
function seed(type,n,d){q.spawn(type,n,d);}
async function setup(scene){
 const s=q.sim,p=s.players[0];s.enemies.length=s.proj.length=s.fx.length=s.gems.length=s.pickups.length=0;
 if(scene===0){p.x=374;p.z=318;p.face=-.5;r.setZoom(.34);r.setYaw(-.45);r.setPitch(.86);r.setLookY(.45);}
 else{
  if(active===0){await q.setMap('apache');await q.startRun();q.god();q.pause(true);}
  const s=q.sim,p=s.players[0];p.x=181;p.z=78;p.face=0;
  r.setZoom(scene===1?.64:.60);r.setYaw(scene===1?-.2:-.65);r.setPitch(scene===1?.95:.70);r.setLookY(.35);
  if(scene===1){seed('scorpion',9,5);seed('bandit',5,8);seed('camel',3,10);p.weapons[Object.keys(p.weapons)[0]]=5;}
 }
 r.reset();r.update(q.snapshot(q.sim),.1,q.sim.players[0].id);await new Promise(resolve=>setTimeout(resolve,900));for(let i=0;i<4;i++)r.update(q.snapshot(q.sim),.1,q.sim.players[0].id);
 active=scene;
}
window.__promoFrame=async(frame,copy=true)=>{
 const t=frame/FPS,scene=t<3.5?0:t<11?1:2;if(scene!==active)await setup(scene);
 const s=q.sim,p=s.players[0];
 if(scene===0){p.moving=t>2.5;p.face=-.5;}
 if(scene===1){q.warp(1/30,[Math.sin(t*1.7)*.45,Math.cos(t*1.2)*.45]);if(s.enemies.length<10)seed('scorpion',5,6);}
 if(scene===2){p.moving=false;p.face=-.5;car.visible=t>=11.4&&t<=16.6;const k=(t-11.4)/5.2;car.position.set(172+k*18,r.groundAt(181,80),80);car.rotation.y=Math.PI/2;for(const w of wheels)w.rotation.x=-t*6;}
 r.update(q.snapshot(s),1/FPS,p.id);
 ctx.clearRect(0,0,W,H);ctx.drawImage(document.getElementById('c'),0,0,W,H);
 const clean=out.toDataURL('image/jpeg',.96).split(',')[1];
 if(copy){
  if(t<1.8)head('One run.',p.x,p.z);
  else if(t<3.5)head('I can do one run.',p.x,p.z);
  else if(t<7.3)footer('SURVIVE THE HORDE','Grow stronger. Keep moving.');
  else if(t<11)footer('RANKED · APACHE DESERT','Standard · 1 DMT / run');
  else if(t<12.7)head('Wrong game?',p.x,p.z);
  else if(t<15.4)head('Just passing through.',car.position.x,car.position.z,2.2);
  else if(t<17)footer('EVERY KILL. EVERY SECOND.','Ranked score = kills + whole seconds');
  else{
   ctx.fillStyle=`rgba(14,12,8,${Math.min(.8,(t-17)*.7)})`;ctx.fillRect(0,0,W,H);
   text('SankoSurvivors',360,555,68,'#f5dda1','RSQuill8');text('sankosurvivors.quest',360,630,39,'#fff0ce');text('unofficial fan game',360,700,30,'#e4caa1');
  }
 }
 return {clean,copy:out.toDataURL('image/jpeg',.96).split(',')[1],t,scene,enemies:s.enemies.length,player:[p.x,p.z],car:[car.position.x,car.position.z],carVisible:car.visible};
};
window.__promoReady={native:[W,H],fps:FPS,driver:!!driver.root,car:g.scene.name,wheels:wheels.length};
