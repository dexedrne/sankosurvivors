import * as THREE from 'three';

// Original weapon art stays in the renderer; this one reusable batch draws its motion and impact accents.
export function createMeleeVfx({group,camera,groundAt,colorOut,fxOnly}) {
  const CAP=64, geometry=new THREE.PlaneGeometry(2,2);
  const parameters=new THREE.InstancedBufferAttribute(new Float32Array(CAP*4),4).setUsage(THREE.DynamicDrawUsage);
  const tints=new THREE.InstancedBufferAttribute(new Float32Array(CAP*3),3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('aFx',parameters);geometry.setAttribute('aTint',tints);
  const material=new THREE.ShaderMaterial({
    vertexShader:`attribute vec4 aFx; attribute vec3 aTint; varying vec2 vUv; varying vec4 vFx; varying vec3 vTint;
      void main(){vUv=uv;vFx=aFx;vTint=aTint;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}`,
    fragmentShader:colorOut(`varying vec2 vUv; varying vec4 vFx; varying vec3 vTint;
      float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 p=vUv*2.0-1.0;float r=length(p),t=vFx.y,seed=vFx.w;float alpha=0.0;vec3 color=vTint;
        if(vFx.x<0.5){
          float along=(atan(p.y,p.x)+vFx.z*0.5)/vFx.z;
          float lead=mix(-0.03,1.18,t),behind=lead-along;
          float sweep=smoothstep(-0.025,0.025,behind)*(1.0-smoothstep(0.12,0.36,behind));
          float width=mix(0.025,0.10,clamp(1.0-behind/0.36,0.0,1.0));
          float blade=1.0-smoothstep(width*0.2,width,abs(r-0.88));
          float filament=1.0-smoothstep(0.006,0.018,abs(r-0.94));
          float taper=smoothstep(0.0,0.07,t)*pow(max(0.0,1.0-t),0.4);
          alpha=sweep*(blade*0.5+filament*0.8)*taper*step(0.0,along)*step(along,1.0);
          color*=1.0+filament*1.25;
        }else if(vFx.x<1.5){
          float a=atan(p.y,p.x),front=mix(0.06,0.95,sqrt(t));
          float dust=exp(-180.0*(r-front)*(r-front))*(0.55+0.45*noise(floor(p*27.0)+seed));
          float cracks=pow(max(0.0,cos(a*9.0+seed*6.28+floor(r*16.0)*0.12)),28.0);
          cracks*=smoothstep(0.08,0.25,r)*(1.0-smoothstep(0.55,0.94,r));
          alpha=(dust*0.34+cracks*0.55)*(1.0-t)*(1.0-smoothstep(0.96,1.0,r));
          color=mix(vTint,vec3(0.085,0.05,0.025),cracks);
        }else if(vFx.x<2.5){
          float a=atan(p.y,p.x),tail=pow(max(0.0,0.5+0.5*sin(a*2.0)),3.0);
          float edge=1.0-smoothstep(0.025,0.14,abs(r-0.78));
          alpha=edge*tail*pow(1.0-t,1.4)*0.65;
          color*=1.25;
        }else if(vFx.x<3.5){
          float back=-p.x;
          alpha=smoothstep(0.0,0.09,back)*(1.0-smoothstep(0.12,1.0,back));
          alpha*=(1.0-smoothstep(0.03,0.8,abs(p.y)))*pow(1.0-t,1.5)*0.7;
        }else if(vFx.x<4.5){
          float cloud=pow(max(0.0,1.0-r),1.5)*(0.55+0.45*noise(floor(p*17.0)+seed));
          alpha=cloud*sin(3.14159265*t)*0.42;
        }else{
          float streak=exp(-abs(p.y)*21.0-abs(p.x)*3.5);
          float cross=exp(-abs(p.x)*25.0-abs(p.y)*4.0);
          alpha=max(streak,cross*0.65)*pow(1.0-t,1.6);
          color*=1.4;
        }
        if(alpha<0.004)discard;
        gl_FragColor=vec4(color,clamp(alpha,0.0,0.92));
      }`),
    transparent:true,depthWrite:false,blending:THREE.NormalBlending,side:THREE.DoubleSide,
  });
  const mesh=new THREE.InstancedMesh(geometry,material,CAP);
  mesh.name='melee-vfx';mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=-1;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fxOnly(mesh);group.add(mesh);
  const slots=Array.from({length:CAP},()=>({life:0}));
  const dummy=new THREE.Object3D(),flat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1),turn=new THREE.Quaternion(),tint=new THREE.Color();
  let clock=null,limit=CAP,sequence=0,live=0,lowEmitted=0;
  function victim(priority=2){
    let found=null;for(const s of slots)if(s.life>0&&s.priority<=priority&&(!found||s.priority<found.priority||s.priority===found.priority&&s.sequence<found.sequence))found=s;
    return found;
  }
  function add(kind,x,z,angle,radius,arc,color,life,priority,width=radius){
    if(clock===null||![x,z,angle,radius,arc,color].every(Number.isFinite)||Math.abs(x)>1e6||Math.abs(z)>1e6||Math.abs(angle)>1e12||radius<1e-4||radius>1000||arc<1e-4||color<0||color>0xffffff)return;
    const floor=groundAt(x,z);if(!Number.isFinite(floor)||Math.abs(floor)>1e6)return;
    if(priority===0){if(lowEmitted>=(limit===CAP?16:4))return;lowEmitted++;}
    let s;if(live<limit){s=slots.find(s=>s.life<=0);live++;}else{s=victim(priority);if(!s)return;}
    const serial=++sequence,seed=(serial*0.61803398875)%1;
    Object.assign(s,{kind,x,z,angle,radius,width,arc,color,life,total:life,priority,sequence:serial,seed,
      y:floor+(kind===0?0.9:kind===1?0.08:kind===4?0.3:1),floor});
    return true;
  }
  function reset(){for(const s of slots)s.life=0;clock=null;live=0;sequence=0;lowEmitted=0;mesh.count=0;}
  function begin(time,reduced=false){
    if(!Number.isFinite(time)||time<0){reset();return;}
    if(clock!==null&&time<clock)reset();const dt=clock===null?0:time-clock;clock=time;limit=reduced?24:CAP;lowEmitted=0;
    live=0;for(const s of slots)if(s.life>0){s.life-=dt;if(s.life>0)live++;}
    while(live>limit){victim().life=0;live--;}
  }
  function flush(){
    let count=0;for(const s of slots){if(s.life<=0)continue;const age=s.total-s.life,progress=Math.max(0,Math.min(1,age/s.total));
      const billboard=s.kind>=4,drift=billboard?age*(s.kind===4?0.35:1.2):0;
      dummy.position.set(s.x+Math.cos(s.seed*6.283)*drift,s.y+(billboard?age*(s.kind===4?0.9:1.6)-age*age:0),s.z+Math.sin(s.seed*6.283)*drift);
      if(billboard){turn.setFromAxisAngle(forward,s.seed*6.283);dummy.quaternion.copy(camera.quaternion).multiply(turn);}
      else dummy.quaternion.setFromAxisAngle(up,s.angle-Math.PI/2).multiply(flat);
      const grow=s.kind===4?1+progress*0.7:1;dummy.scale.set(s.radius*grow,s.width*grow,1);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);
      parameters.setXYZW(count,s.kind,progress,s.arc,s.seed);tint.setHex(s.color).multiplyScalar(1.15);tints.setXYZ(count,tint.r,tint.g,tint.b);count++;
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;parameters.needsUpdate=true;tints.needsUpdate=true;
  }
  return {mesh,begin,flush,reset,
    sweep(x,z,a,range,arcDeg,color=0xe5e9dd){if(!Number.isFinite(arcDeg)||arcDeg<=0)return;add(0,x,z,a,range,Math.min(Math.PI*2,arcDeg*Math.PI/180),color,.24,2);},
    quake(x,z,radius){if(!add(1,x,z,0,radius,Math.PI*2,0xb89d7c,.5,2))return;for(let i=0,n=limit===CAP?3:1;i<n;i++){const a=(i+sequence*.37)*2.4;add(4,x+Math.cos(a)*radius*.28,z+Math.sin(a)*radius*.28,0,Math.min(.8,.3+radius*.12),1,0xa58c6c,.5,0);}},
    hit(x,z,critical=false){add(5,x,z,0,critical ? .24 : .16,1,critical?0xffcf68:0xf3ebcf,.16,0);if(critical)add(5,x+.05,z-.05,0,.13,1,0xffdf9a,.12,0);},
    axe(x,z,spin,evolved=false){add(2,x,z,spin,.55,Math.PI*2,evolved?0x9bddf2:0xe6c697,.14,1);},
    sword(x,z,a,evolved=false){add(3,x,z,a,1,1,evolved?0x9bddf2:0xe9e4d5,.12,1,.1);},
  };
}
