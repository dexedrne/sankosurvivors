import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {SavePass} from 'three/addons/postprocessing/SavePass.js';
import {STORM_CLEAR,STORM_FAR} from './weather.js';

const COLORS={rainstorm:[82,100,115],snowstorm:[217,230,242],blizzard:[217,230,242],sandstorm:[217,176,122]};
const active=s=>s&&typeof s.kind==='string'&&Object.hasOwn(COLORS,s.kind)&&Number.isFinite(s.intensity)&&s.intensity>0;
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=1e12;

export function createStormEffects(composer) {
  for(const target of composer?[composer.renderTarget1,composer.renderTarget2]:[])target.depthTexture=new THREE.DepthTexture(target.width,target.height,THREE.UnsignedIntType);
  const capture=new SavePass(new THREE.WebGLRenderTarget(1,1,{depthBuffer:false,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter}));
  // Preserve scene depth before later fullscreen passes overwrite the composer's ping-pong buffers.
  capture.material.fragmentShader='#include <packing>\nuniform sampler2D tDiffuse;varying vec2 vUv;void main(){gl_FragColor=packDepthToRGBA(texture2D(tDiffuse,vUv).r);}';
  capture.material.depthTest=capture.material.depthWrite=false;
  const saveDepth=capture.render.bind(capture);capture.render=(renderer,write,read)=>saveDepth(renderer,write,{texture:read.depthTexture});
  const pass=new ShaderPass({uniforms:{tDiffuse:{value:null},uDepth:{value:null},uStrength:{value:0},uTime:{value:0},uClear:{value:STORM_CLEAR},uFar:{value:STORM_FAR},uOrigin:{value:new THREE.Vector3()},uCameraWorld:{value:new THREE.Matrix4()},uInverseProjection:{value:new THREE.Matrix4()},uColor:{value:new THREE.Color()}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`#include <packing>
      uniform sampler2D tDiffuse,uDepth;uniform float uStrength,uTime,uClear,uFar;uniform vec3 uOrigin,uColor;uniform mat4 uCameraWorld,uInverseProjection;varying vec2 vUv;
      float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float cloudNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0)),f.x),f.y);}
      void main(){
        vec4 c=texture2D(tDiffuse,vUv);float depth=unpackRGBAToDepth(texture2D(uDepth,vUv));
        vec4 world=uCameraWorld*uInverseProjection*vec4(vUv*2.0-1.0,depth*2.0-1.0,1.0);
        vec3 surface=world.xyz/world.w;float mask=depth<1.0?smoothstep(uClear,uFar,length(surface.xz-uOrigin.xz)):1.0;vec2 p=surface.xz*.12;
        float clouds=.75+.20*cloudNoise(p-vec2(uTime*.07,uTime*.025));
        gl_FragColor=vec4(mix(c.rgb,uColor,clamp(mask*uStrength*clouds,0.0,.95)),c.a);
      }`,
  });
  pass.uniforms.uDepth.value=capture.renderTarget.texture;pass.enabled=capture.enabled=false;
  function reset(){pass.enabled=capture.enabled=false;pass.uniforms.uStrength.value=0;}
  function update(storm,time,camera,origin){
    if(!active(storm)||!finite(time)||!origin||![origin.x,origin.y,origin.z].every(finite)){reset();return;}
    camera.updateMatrixWorld(true);
    if(!camera.matrixWorld.elements.every(finite)||!camera.projectionMatrixInverse.elements.every(finite)){reset();return;}
    const u=pass.uniforms,c=COLORS[storm.kind];u.uStrength.value=Math.min(1,storm.intensity);u.uTime.value=time;
    u.uOrigin.value.copy(origin);u.uCameraWorld.value.copy(camera.matrixWorld);u.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    u.uColor.value.setRGB(c[0]/255,c[1]/255,c[2]/255);pass.enabled=capture.enabled=true;
  }
  return {pass,capture,update,reset};
}

export function drawStormMinimap(ctx,width,px,storm,time) {
  if(!active(storm)||!finite(width)||!finite(px)||!finite(time)||width<=0||px<=0)return;
  const r=width/2,clear=STORM_CLEAR*px,far=STORM_FAR*px;if(clear>=r-2)return;
  const color=COLORS[storm.kind].join(','),gradient=ctx.createRadialGradient(r,r,clear,r,r,far);
  gradient.addColorStop(0,`rgba(${color},0)`);gradient.addColorStop(.45,`rgba(${color},.6)`);gradient.addColorStop(1,`rgba(${color},.96)`);
  ctx.save();ctx.beginPath();ctx.arc(r,r,r-2,0,Math.PI*2);ctx.clip();ctx.globalAlpha=Math.min(1,storm.intensity);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,width);
  const size=Math.min(12,(r-clear)/3),orbit=(r+clear)/2;
  for(let i=0;i<4;i++){
    const angle=i*Math.PI/2+time*.035,x=r+Math.cos(angle)*orbit,y=r+Math.sin(angle)*orbit,g=ctx.createRadialGradient(x,y,0,x,y,size);
    g.addColorStop(0,`rgba(${color},.18)`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,width,width);
  }
  ctx.restore();
}
