(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const Mp=[{version:"0.44.83",date:"10 Nov 2026",title:"Feel the road",items:["Original map materials now affect grip: firmer stone, looser dirt, grass and sand, and wooden bridge decks. Changes blend smoothly; every vehicle uses the same handling online and offline.","The speed display names the surface. Time trial starts a separate record for the new handling, preserving your previous best in Controls & credits.","Private races stop queuing controls when a connection stalls, then resume with current input."]},{version:"0.44.82",date:"10 Nov 2026",title:"Meet on the road",items:["Sanko Racers has a public driving hub for up to 16 drivers, with public text chat. Private invite races stay separate.","The garage previews your real kart and driver. Choose Casual, Iron Guard or Priest; driver view shows native arms and hands. Middle mouse rotates the camera.","Racers now has native music, grouped graphics settings, its own Updates log and standard controller controls.","Desert bridge collision follows the visible planks; extra building-wall padding is removed."]},{version:"0.44.81",date:"9 Nov 2026",title:"Race your friends",items:["Private World Circuit races for 2–4 players: create a room, share the invite, ready up and start together.","Non-blocking cars use the same handling. Online results stay separate from solo records.","V switches chase and driver-eye cameras; C recentres. Building-floor collision flags and the centre of the desert bridge crossing were corrected."]},{version:"0.44.80",date:"9 Nov 2026",title:"CrashOut Karts arrive",items:["Choose from 14 original CrashOut stock karts, with Tuner as the default. The Miata stays available.","Every vehicle uses the same handling. The Guard and Priest now race in karts too."]},{version:"0.44.79",date:"9 Nov 2026",title:"An open road in Apache",items:["The Apache starting area moves out of its fenced enclosure onto the open road. Restart uses the same safe start."]},{version:"0.44.78",date:"9 Nov 2026",title:"Drive the whole world",items:["Free Drive opens the whole native SankoQuest world, with four starting areas and a longer World Circuit.","Hold Space or Drift to use the handbrake. Original SankoQuest fonts, frames and stone buttons bring the menus home."]},{version:"0.44.73",date:"9 Nov 2026",title:"Race the Guard and Priest",items:["NPC races have a shared countdown, ten checkpoints, live positions and finish times.","The Guard and Priest follow the roads and obey the same solid walls. Their cars do not block yours. Time trial keeps a separate solo record."]},{version:"0.44.72",date:"9 Nov 2026",title:"A clearer view",items:["The chase camera moves closer when nearby walls or roofs obstruct the kart, then eases back when the view clears."]},{version:"0.44.71",date:"9 Nov 2026",title:"More countryside",items:["The first countryside expansion removed the old invisible map boundary. A larger minimap and ground outline show the driving area.","Driving Survivors starts outside Greentown: ram the horde at speed and keep your car alive."]}];function Sp(r=document){let e=r.getElementById("updates-dialog");if(!e){e=r.createElement("dialog"),e.id="updates-dialog",e.setAttribute("aria-labelledby","updates-title");const t=r.createElement("div");t.className="updates-head";const n=r.createElement("h2");n.id="updates-title",n.textContent="Sanko Racers · Updates";const i=r.createElement("button");i.textContent="Close",i.onclick=()=>e.close(),t.append(n,i);const s=r.createElement("div");s.className="updates-history";for(const a of Mp){const o=r.createElement("article"),l=r.createElement("h3"),c=r.createElement("p"),u=r.createElement("ul");l.textContent=a.title,c.className="update-date",c.textContent=a.date+" · Survivors "+a.version;for(const h of a.items){const d=r.createElement("li");d.textContent=h,u.append(d)}o.append(l,c,u),s.append(o)}e.append(t,s),r.body.append(e)}e.open||e.showModal()}const zn=[[!0,"On"],[!1,"Off"]],Ad=[{head:"Display"},{id:"quality",name:"Quality",opts:[["auto","Auto"],["low","Low"],["medium","Medium"],["high","High"]]},{id:"res",name:"Resolution",opts:[["auto","Auto"],["0.5","50%"],["0.75","75%"],["1","100%"],["2","Sharp"]]},{id:"fps",name:"Frame rate cap",opts:[["30","30"],["60","60"],["max","Max"]]},{id:"aa",name:"Anti-aliasing",opts:zn},{head:"Lighting"},{id:"shadows",name:"Shadows",opts:zn},{id:"shadowq",name:"Shadow detail",opts:[["auto","Auto"],["low","Low"],["medium","Medium"],["high","High"]]},{id:"bloom",name:"Bloom (glow)",opts:zn},{id:"ao",name:"Ambient occlusion",opts:zn},{id:"grade",name:"Colour grading",opts:zn},{id:"dof",name:"Depth of field",opts:zn},{id:"time",name:"Time of day",opts:[["day","Day"],["dusk","Dusk"],["night","Night"]]},{head:"World"},{id:"view",name:"Draw distance",opts:[["near","Near"],["normal","Normal"],["far","Far"],["max","Max"]]},{id:"water",name:"Water reflections",opts:zn,disabled:!0,note:"Unavailable: this Racer world has no reflective water surface."},{id:"foliage",name:"Grass and flowers",opts:zn},{id:"rain",name:"Rain",opts:zn},{id:"roofs",name:"Roofs",opts:[["off","Off"],["auto","On, lift when inside"]]},{head:"Sound"},{id:"sound",name:"All audio",opts:zn},{vol:"m",name:"Music"},{head:"Game"},{id:"fx",name:"Effects",opts:[["full","Full"],["reduced","Reduced"]]}];function bp(r,e){let t=document.getElementById("settings-dialog");if(!t){t=document.createElement("dialog"),t.id="settings-dialog",t.className="native-dialog",t.setAttribute("aria-labelledby","settings-title");const n=document.createElement("div");n.className="updates-head";const i=document.createElement("h2");i.id="settings-title",i.textContent="Settings";const s=document.createElement("button");s.textContent="Close",s.onclick=()=>t.close(),n.append(i,s),t.append(n);let a;for(const o of Ad){if(o.head){a=document.createElement("details"),a.className="settings-group",a.open=o.head==="Display";const u=document.createElement("summary");u.textContent=o.head,a.append(u),t.append(a);continue}const l=document.createElement("div");l.className="settings-row";const c=document.createElement("span");if(c.textContent=o.name,l.append(c),o.vol){const u=document.createElement("input");u.type="range",u.min="0",u.max="100",u.value=e.volume(),u.setAttribute("aria-label",o.name+" volume");const h=document.createElement("output");h.textContent=u.value+"%",u.oninput=()=>{e.setVolume(Number(u.value)),h.textContent=u.value+"%"},l.append(u,h)}if(o.opts){const u=document.createElement("div");u.className="settings-options",u.setAttribute("role","group"),u.setAttribute("aria-label",o.name);for(const[h,d]of o.opts){const f=document.createElement("button");f.textContent=d,f.disabled=!!o.disabled,f.dataset.option=o.id,f.setAttribute("aria-pressed",String(h===(o.id==="sound"?!e.muted:r.getSettings()[o.id]))),f.onclick=()=>{o.id==="sound"?e.setMuted(!h):r.apply({[o.id]:h});for(const p of u.children)p.setAttribute("aria-pressed",String(p===f))},u.append(f)}l.append(u)}if(o.note){const u=document.createElement("small");u.textContent=o.note,l.append(u)}a.append(l)}document.body.append(t)}t.open||t.showModal()}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Nc="170",Tp=0,Iu=1,Ep=2,Cd=1,Rd=2,ui=3,_i=0,un=1,bn=2,Jt=0,kr=1,Pl=2,Du=3,Lu=4,Pd=5,pi=100,wp=101,Ap=102,Cp=103,Rp=104,Il=200,Pp=201,Ip=202,Dp=203,Dl=204,Ll=205,Id=206,Lp=207,Dd=208,Up=209,Np=210,Fp=211,Op=212,Bp=213,kp=214,Ul=0,Nl=1,Fl=2,Xr=3,Ol=4,Bl=5,kl=6,zl=7,_o=0,zp=1,Vp=2,Ui=0,Ld=1,Ud=2,Nd=3,Fc=4,Hp=5,Fd=6,Od=7,Uu="attached",Gp="detached",Bd=300,jr=301,qr=302,io=303,Vl=304,yo=306,Rn=1e3,jn=1001,ro=1002,kt=1003,kd=1004,vs=1005,en=1006,Ya=1007,qn=1008,yi=1009,zd=1010,Vd=1011,Is=1012,Oc=1013,er=1014,wn=1015,Cn=1016,Bc=1017,kc=1018,tr=1020,Hd=35902,Gd=1021,Wd=1022,An=1023,Xd=1024,jd=1025,zr=1026,nr=1027,Mo=1028,zc=1029,qd=1030,Vc=1031,Hc=1033,Ka=33776,Za=33777,$a=33778,Ja=33779,Hl=35840,Gl=35841,Wl=35842,Xl=35843,jl=36196,ql=37492,Yl=37496,Kl=37808,Zl=37809,$l=37810,Jl=37811,Ql=37812,ec=37813,tc=37814,nc=37815,ic=37816,rc=37817,sc=37818,ac=37819,oc=37820,lc=37821,Qa=36492,cc=36494,uc=36495,Yd=36283,hc=36284,dc=36285,fc=36286,Kd=2200,Wp=2201,Xp=2202,Ds=2300,Ls=2301,Lo=2302,Ur=2400,Nr=2401,so=2402,Gc=2500,jp=2501,qp=0,Zd=1,pc=2,Yp=3200,$d=3201,Xs=0,Kp=1,mi="",at="srgb",nn="srgb-linear",So="linear",gt="srgb",hr=7680,Nu=519,Zp=512,$p=513,Jp=514,Jd=515,Qp=516,em=517,tm=518,nm=519,mc=35044,sa=35048,Fu="300 es",gi=2e3,ao=2001;class cr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const s=i.indexOf(t);s!==-1&&i.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let s=0,a=i.length;s<a;s++)i[s].call(this,e);e.target=null}}}const Zt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Ou=1234567;const bs=Math.PI/180,Yr=180/Math.PI;function Bn(){const r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Zt[r&255]+Zt[r>>8&255]+Zt[r>>16&255]+Zt[r>>24&255]+"-"+Zt[e&255]+Zt[e>>8&255]+"-"+Zt[e>>16&15|64]+Zt[e>>24&255]+"-"+Zt[t&63|128]+Zt[t>>8&255]+"-"+Zt[t>>16&255]+Zt[t>>24&255]+Zt[n&255]+Zt[n>>8&255]+Zt[n>>16&255]+Zt[n>>24&255]).toLowerCase()}function Wt(r,e,t){return Math.max(e,Math.min(t,r))}function Wc(r,e){return(r%e+e)%e}function im(r,e,t,n,i){return n+(r-e)*(i-n)/(t-e)}function rm(r,e,t){return r!==e?(t-r)/(e-r):0}function Ts(r,e,t){return(1-t)*r+t*e}function sm(r,e,t,n){return Ts(r,e,1-Math.exp(-t*n))}function am(r,e=1){return e-Math.abs(Wc(r,e*2)-e)}function om(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*(3-2*r))}function lm(r,e,t){return r<=e?0:r>=t?1:(r=(r-e)/(t-e),r*r*r*(r*(r*6-15)+10))}function cm(r,e){return r+Math.floor(Math.random()*(e-r+1))}function um(r,e){return r+Math.random()*(e-r)}function hm(r){return r*(.5-Math.random())}function dm(r){r!==void 0&&(Ou=r);let e=Ou+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function fm(r){return r*bs}function pm(r){return r*Yr}function mm(r){return(r&r-1)===0&&r!==0}function gm(r){return Math.pow(2,Math.ceil(Math.log(r)/Math.LN2))}function vm(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function xm(r,e,t,n,i){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),u=a((e+n)/2),h=s((e-n)/2),d=a((e-n)/2),f=s((n-e)/2),p=a((n-e)/2);switch(i){case"XYX":r.set(o*u,l*h,l*d,o*c);break;case"YZY":r.set(l*d,o*u,l*h,o*c);break;case"ZXZ":r.set(l*h,l*d,o*u,o*c);break;case"XZX":r.set(o*u,l*p,l*f,o*c);break;case"YXY":r.set(l*f,o*u,l*p,o*c);break;case"ZYZ":r.set(l*p,l*f,o*u,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function On(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function vt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}const jt={DEG2RAD:bs,RAD2DEG:Yr,generateUUID:Bn,clamp:Wt,euclideanModulo:Wc,mapLinear:im,inverseLerp:rm,lerp:Ts,damp:sm,pingpong:am,smoothstep:om,smootherstep:lm,randInt:cm,randFloat:um,randFloatSpread:hm,seededRandom:dm,degToRad:fm,radToDeg:pm,isPowerOfTwo:mm,ceilPowerOfTwo:gm,floorPowerOfTwo:vm,setQuaternionFromProperEuler:xm,normalize:vt,denormalize:On};class Ue{constructor(e=0,t=0){Ue.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Wt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*i+e.x,this.y=s*i+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class qe{constructor(e,t,n,i,s,a,o,l,c){qe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,a,o,l,c)}set(e,t,n,i,s,a,o,l,c){const u=this.elements;return u[0]=e,u[1]=i,u[2]=o,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],f=n[5],p=n[8],v=i[0],g=i[3],m=i[6],S=i[1],y=i[4],x=i[7],P=i[2],R=i[5],A=i[8];return s[0]=a*v+o*S+l*P,s[3]=a*g+o*y+l*R,s[6]=a*m+o*x+l*A,s[1]=c*v+u*S+h*P,s[4]=c*g+u*y+h*R,s[7]=c*m+u*x+h*A,s[2]=d*v+f*S+p*P,s[5]=d*g+f*y+p*R,s[8]=d*m+f*x+p*A,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*s*u+n*o*l+i*s*c-i*a*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=u*a-o*c,d=o*l-u*s,f=c*s-a*l,p=t*h+n*d+i*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/p;return e[0]=h*v,e[1]=(i*c-u*n)*v,e[2]=(o*n-i*a)*v,e[3]=d*v,e[4]=(u*t-i*l)*v,e[5]=(i*s-o*t)*v,e[6]=f*v,e[7]=(n*l-c*t)*v,e[8]=(a*t-n*s)*v,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-i*c,i*l,-i*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(Uo.makeScale(e,t)),this}rotate(e){return this.premultiply(Uo.makeRotation(-e)),this}translate(e,t){return this.premultiply(Uo.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Uo=new qe;function Qd(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Us(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function _m(){const r=Us("canvas");return r.style.display="block",r}const Bu={};function xs(r){r in Bu||(Bu[r]=!0,console.warn(r))}function ym(r,e,t){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}function Mm(r){const e=r.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function Sm(r){const e=r.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const Xe={enabled:!0,workingColorSpace:nn,spaces:{},convert:function(r,e,t){return this.enabled===!1||e===t||!e||!t||(this.spaces[e].transfer===gt&&(r.r=xi(r.r),r.g=xi(r.g),r.b=xi(r.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(r.applyMatrix3(this.spaces[e].toXYZ),r.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===gt&&(r.r=Vr(r.r),r.g=Vr(r.g),r.b=Vr(r.b))),r},fromWorkingColorSpace:function(r,e){return this.convert(r,this.workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===mi?So:this.spaces[r].transfer},getLuminanceCoefficients:function(r,e=this.workingColorSpace){return r.fromArray(this.spaces[e].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,e,t){return r.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function xi(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Vr(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}const ku=[.64,.33,.3,.6,.15,.06],zu=[.2126,.7152,.0722],Vu=[.3127,.329],Hu=new qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Gu=new qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Xe.define({[nn]:{primaries:ku,whitePoint:Vu,transfer:So,toXYZ:Hu,fromXYZ:Gu,luminanceCoefficients:zu,workingColorSpaceConfig:{unpackColorSpace:at},outputColorSpaceConfig:{drawingBufferColorSpace:at}},[at]:{primaries:ku,whitePoint:Vu,transfer:gt,toXYZ:Hu,fromXYZ:Gu,luminanceCoefficients:zu,outputColorSpaceConfig:{drawingBufferColorSpace:at}}});let dr;class bm{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{dr===void 0&&(dr=Us("canvas")),dr.width=e.width,dr.height=e.height;const n=dr.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=dr}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Us("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),s=i.data;for(let a=0;a<s.length;a++)s[a]=xi(s[a]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(xi(t[n]/255)*255):t[n]=xi(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Tm=0;class ef{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Tm++}),this.uuid=Bn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?s.push(No(i[a].image)):s.push(No(i[a]))}else s=No(i);n.url=s}return t||(e.images[this.uuid]=n),n}}function No(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?bm.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Em=0;class Pt extends cr{constructor(e=Pt.DEFAULT_IMAGE,t=Pt.DEFAULT_MAPPING,n=jn,i=jn,s=en,a=qn,o=An,l=yi,c=Pt.DEFAULT_ANISOTROPY,u=mi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Em++}),this.uuid=Bn(),this.name="",this.source=new ef(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ue(0,0),this.repeat=new Ue(1,1),this.center=new Ue(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Bd)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Rn:e.x=e.x-Math.floor(e.x);break;case jn:e.x=e.x<0?0:1;break;case ro:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Rn:e.y=e.y-Math.floor(e.y);break;case jn:e.y=e.y<0?0:1;break;case ro:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Pt.DEFAULT_IMAGE=null;Pt.DEFAULT_MAPPING=Bd;Pt.DEFAULT_ANISOTROPY=1;class rt{constructor(e=0,t=0,n=0,i=1){rt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*i+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*i+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*i+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,s;const l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],f=l[5],p=l[9],v=l[2],g=l[6],m=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-v)<.01&&Math.abs(p-g)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+v)<.1&&Math.abs(p+g)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const y=(c+1)/2,x=(f+1)/2,P=(m+1)/2,R=(u+d)/4,A=(h+v)/4,I=(p+g)/4;return y>x&&y>P?y<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(y),i=R/n,s=A/n):x>P?x<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(x),n=R/i,s=I/i):P<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(P),n=A/s,i=I/s),this.set(n,i,s,t),this}let S=Math.sqrt((g-p)*(g-p)+(h-v)*(h-v)+(d-u)*(d-u));return Math.abs(S)<.001&&(S=1),this.x=(g-p)/S,this.y=(h-v)/S,this.z=(d-u)/S,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class wm extends cr{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new rt(0,0,e,t),this.scissorTest=!1,this.viewport=new rt(0,0,e,t);const i={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:en,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Pt(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,i=e.textures.length;n<i;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new ef(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class hn extends wm{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Xc extends Pt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=kt,this.minFilter=kt,this.wrapR=jn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Am extends Pt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=kt,this.minFilter=kt,this.wrapR=jn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ht{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,s,a,o){let l=n[i+0],c=n[i+1],u=n[i+2],h=n[i+3];const d=s[a+0],f=s[a+1],p=s[a+2],v=s[a+3];if(o===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(o===1){e[t+0]=d,e[t+1]=f,e[t+2]=p,e[t+3]=v;return}if(h!==v||l!==d||c!==f||u!==p){let g=1-o;const m=l*d+c*f+u*p+h*v,S=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){const P=Math.sqrt(y),R=Math.atan2(P,m*S);g=Math.sin(g*R)/P,o=Math.sin(o*R)/P}const x=o*S;if(l=l*g+d*x,c=c*g+f*x,u=u*g+p*x,h=h*g+v*x,g===1-o){const P=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=P,c*=P,u*=P,h*=P}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,s,a){const o=n[i],l=n[i+1],c=n[i+2],u=n[i+3],h=s[a],d=s[a+1],f=s[a+2],p=s[a+3];return e[t]=o*p+u*h+l*f-c*d,e[t+1]=l*p+u*d+c*h-o*f,e[t+2]=c*p+u*f+o*d-l*h,e[t+3]=u*p-o*h-l*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(i/2),h=o(s/2),d=l(n/2),f=l(i/2),p=l(s/2);switch(a){case"XYZ":this._x=d*u*h+c*f*p,this._y=c*f*h-d*u*p,this._z=c*u*p+d*f*h,this._w=c*u*h-d*f*p;break;case"YXZ":this._x=d*u*h+c*f*p,this._y=c*f*h-d*u*p,this._z=c*u*p-d*f*h,this._w=c*u*h+d*f*p;break;case"ZXY":this._x=d*u*h-c*f*p,this._y=c*f*h+d*u*p,this._z=c*u*p+d*f*h,this._w=c*u*h-d*f*p;break;case"ZYX":this._x=d*u*h-c*f*p,this._y=c*f*h+d*u*p,this._z=c*u*p-d*f*h,this._w=c*u*h+d*f*p;break;case"YZX":this._x=d*u*h+c*f*p,this._y=c*f*h+d*u*p,this._z=c*u*p-d*f*h,this._w=c*u*h-d*f*p;break;case"XZY":this._x=d*u*h-c*f*p,this._y=c*f*h-d*u*p,this._z=c*u*p+d*f*h,this._w=c*u*h+d*f*p;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=n+o+h;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-l)*f,this._y=(s-c)*f,this._z=(a-i)*f}else if(n>o&&n>h){const f=2*Math.sqrt(1+n-o-h);this._w=(u-l)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(s+c)/f}else if(o>h){const f=2*Math.sqrt(1+o-n-h);this._w=(s-c)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(l+u)/f}else{const f=2*Math.sqrt(1+h-n-o);this._w=(a-i)/f,this._x=(s+c)/f,this._y=(l+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Wt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+i*c-s*l,this._y=i*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-i*o,this._w=a*u-n*o-i*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,s=this._z,a=this._w;let o=a*e._w+n*e._x+i*e._y+s*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=i,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const f=1-t;return this._w=f*a+t*this._w,this._x=f*n+t*this._x,this._y=f*i+t*this._y,this._z=f*s+t*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),h=Math.sin((1-t)*u)/c,d=Math.sin(t*u)/c;return this._w=a*h+this._w*d,this._x=n*h+this._x*d,this._y=i*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class C{constructor(e=0,t=0,n=0){C.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Wu.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Wu.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*i,this.y=s[1]*t+s[4]*n+s[7]*i,this.z=s[2]*t+s[5]*n+s[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*i+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*i+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*i+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*i-o*n),u=2*(o*t-s*i),h=2*(s*n-a*t);return this.x=t+l*c+a*h-o*u,this.y=n+l*u+o*c-s*h,this.z=i+l*h+s*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i,this.y=s[1]*t+s[5]*n+s[9]*i,this.z=s[2]*t+s[6]*n+s[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=i*l-s*o,this.y=s*a-n*l,this.z=n*o-i*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Fo.copy(this).projectOnVector(e),this.sub(Fo)}reflect(e){return this.sub(Fo.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Wt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Fo=new C,Wu=new ht;class Xt{constructor(e=new C(1/0,1/0,1/0),t=new C(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Dn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Dn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Dn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Dn):Dn.fromBufferAttribute(s,a),Dn.applyMatrix4(e.matrixWorld),this.expandByPoint(Dn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),aa.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),aa.copy(n.boundingBox)),aa.applyMatrix4(e.matrixWorld),this.union(aa)}const i=e.children;for(let s=0,a=i.length;s<a;s++)this.expandByObject(i[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Dn),Dn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ss),oa.subVectors(this.max,ss),fr.subVectors(e.a,ss),pr.subVectors(e.b,ss),mr.subVectors(e.c,ss),Ti.subVectors(pr,fr),Ei.subVectors(mr,pr),Hi.subVectors(fr,mr);let t=[0,-Ti.z,Ti.y,0,-Ei.z,Ei.y,0,-Hi.z,Hi.y,Ti.z,0,-Ti.x,Ei.z,0,-Ei.x,Hi.z,0,-Hi.x,-Ti.y,Ti.x,0,-Ei.y,Ei.x,0,-Hi.y,Hi.x,0];return!Oo(t,fr,pr,mr,oa)||(t=[1,0,0,0,1,0,0,0,1],!Oo(t,fr,pr,mr,oa))?!1:(la.crossVectors(Ti,Ei),t=[la.x,la.y,la.z],Oo(t,fr,pr,mr,oa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Dn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Dn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ri[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ri[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ri[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ri[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ri[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ri[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ri[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ri[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ri),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const ri=[new C,new C,new C,new C,new C,new C,new C,new C],Dn=new C,aa=new Xt,fr=new C,pr=new C,mr=new C,Ti=new C,Ei=new C,Hi=new C,ss=new C,oa=new C,la=new C,Gi=new C;function Oo(r,e,t,n,i){for(let s=0,a=r.length-3;s<=a;s+=3){Gi.fromArray(r,s);const o=i.x*Math.abs(Gi.x)+i.y*Math.abs(Gi.y)+i.z*Math.abs(Gi.z),l=e.dot(Gi),c=t.dot(Gi),u=n.dot(Gi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Cm=new Xt,as=new C,Bo=new C;class Qn{constructor(e=new C,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Cm.setFromPoints(e).getCenter(n);let i=0;for(let s=0,a=e.length;s<a;s++)i=Math.max(i,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;as.subVectors(e,this.center);const t=as.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(as,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Bo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(as.copy(e.center).add(Bo)),this.expandByPoint(as.copy(e.center).sub(Bo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const si=new C,ko=new C,ca=new C,wi=new C,zo=new C,ua=new C,Vo=new C;class js{constructor(e=new C,t=new C(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(si.copy(this.origin).addScaledVector(this.direction,t),si.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){ko.copy(e).add(t).multiplyScalar(.5),ca.copy(t).sub(e).normalize(),wi.copy(this.origin).sub(ko);const s=e.distanceTo(t)*.5,a=-this.direction.dot(ca),o=wi.dot(this.direction),l=-wi.dot(ca),c=wi.lengthSq(),u=Math.abs(1-a*a);let h,d,f,p;if(u>0)if(h=a*l-o,d=a*o-l,p=s*u,h>=0)if(d>=-p)if(d<=p){const v=1/u;h*=v,d*=v,f=h*(h+a*d+2*o)+d*(a*h+d+2*l)+c}else d=s,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*l)+c;else d=-s,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*l)+c;else d<=-p?(h=Math.max(0,-(-a*s+o)),d=h>0?-s:Math.min(Math.max(-s,-l),s),f=-h*h+d*(d+2*l)+c):d<=p?(h=0,d=Math.min(Math.max(-s,-l),s),f=d*(d+2*l)+c):(h=Math.max(0,-(a*s+o)),d=h>0?s:Math.min(Math.max(-s,-l),s),f=-h*h+d*(d+2*l)+c);else d=a>0?-s:s,h=Math.max(0,-(a*d+o)),f=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(ko).addScaledVector(ca,d),f}intersectSphere(e,t){si.subVectors(e.center,this.origin);const n=si.dot(this.direction),i=si.dot(si)-n*n,s=e.radius*e.radius;if(i>s)return null;const a=Math.sqrt(s-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,s,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),u>=0?(s=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),n>a||s>i||((s>n||isNaN(n))&&(n=s),(a<i||isNaN(i))&&(i=a),h>=0?(o=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(o=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,si)!==null}intersectTriangle(e,t,n,i,s){zo.subVectors(t,e),ua.subVectors(n,e),Vo.crossVectors(zo,ua);let a=this.direction.dot(Vo),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;wi.subVectors(this.origin,e);const l=o*this.direction.dot(ua.crossVectors(wi,ua));if(l<0)return null;const c=o*this.direction.dot(zo.cross(wi));if(c<0||l+c>a)return null;const u=-o*wi.dot(Vo);return u<0?null:this.at(u/a,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class me{constructor(e,t,n,i,s,a,o,l,c,u,h,d,f,p,v,g){me.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,s,a,o,l,c,u,h,d,f,p,v,g)}set(e,t,n,i,s,a,o,l,c,u,h,d,f,p,v,g){const m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=i,m[1]=s,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=u,m[10]=h,m[14]=d,m[3]=f,m[7]=p,m[11]=v,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new me().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/gr.setFromMatrixColumn(e,0).length(),s=1/gr.setFromMatrixColumn(e,1).length(),a=1/gr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const d=a*u,f=a*h,p=o*u,v=o*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=f+p*c,t[5]=d-v*c,t[9]=-o*l,t[2]=v-d*c,t[6]=p+f*c,t[10]=a*l}else if(e.order==="YXZ"){const d=l*u,f=l*h,p=c*u,v=c*h;t[0]=d+v*o,t[4]=p*o-f,t[8]=a*c,t[1]=a*h,t[5]=a*u,t[9]=-o,t[2]=f*o-p,t[6]=v+d*o,t[10]=a*l}else if(e.order==="ZXY"){const d=l*u,f=l*h,p=c*u,v=c*h;t[0]=d-v*o,t[4]=-a*h,t[8]=p+f*o,t[1]=f+p*o,t[5]=a*u,t[9]=v-d*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const d=a*u,f=a*h,p=o*u,v=o*h;t[0]=l*u,t[4]=p*c-f,t[8]=d*c+v,t[1]=l*h,t[5]=v*c+d,t[9]=f*c-p,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const d=a*l,f=a*c,p=o*l,v=o*c;t[0]=l*u,t[4]=v-d*h,t[8]=p*h+f,t[1]=h,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=f*h+p,t[10]=d-v*h}else if(e.order==="XZY"){const d=a*l,f=a*c,p=o*l,v=o*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+v,t[5]=a*u,t[9]=f*h-p,t[2]=p*h-f,t[6]=o*u,t[10]=v*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Rm,e,Pm)}lookAt(e,t,n){const i=this.elements;return pn.subVectors(e,t),pn.lengthSq()===0&&(pn.z=1),pn.normalize(),Ai.crossVectors(n,pn),Ai.lengthSq()===0&&(Math.abs(n.z)===1?pn.x+=1e-4:pn.z+=1e-4,pn.normalize(),Ai.crossVectors(n,pn)),Ai.normalize(),ha.crossVectors(pn,Ai),i[0]=Ai.x,i[4]=ha.x,i[8]=pn.x,i[1]=Ai.y,i[5]=ha.y,i[9]=pn.y,i[2]=Ai.z,i[6]=ha.z,i[10]=pn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],f=n[13],p=n[2],v=n[6],g=n[10],m=n[14],S=n[3],y=n[7],x=n[11],P=n[15],R=i[0],A=i[4],I=i[8],T=i[12],_=i[1],M=i[5],L=i[9],U=i[13],N=i[2],F=i[6],k=i[10],W=i[14],V=i[3],K=i[7],$=i[11],J=i[15];return s[0]=a*R+o*_+l*N+c*V,s[4]=a*A+o*M+l*F+c*K,s[8]=a*I+o*L+l*k+c*$,s[12]=a*T+o*U+l*W+c*J,s[1]=u*R+h*_+d*N+f*V,s[5]=u*A+h*M+d*F+f*K,s[9]=u*I+h*L+d*k+f*$,s[13]=u*T+h*U+d*W+f*J,s[2]=p*R+v*_+g*N+m*V,s[6]=p*A+v*M+g*F+m*K,s[10]=p*I+v*L+g*k+m*$,s[14]=p*T+v*U+g*W+m*J,s[3]=S*R+y*_+x*N+P*V,s[7]=S*A+y*M+x*F+P*K,s[11]=S*I+y*L+x*k+P*$,s[15]=S*T+y*U+x*W+P*J,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],f=e[14],p=e[3],v=e[7],g=e[11],m=e[15];return p*(+s*l*h-i*c*h-s*o*d+n*c*d+i*o*f-n*l*f)+v*(+t*l*f-t*c*d+s*a*d-i*a*f+i*c*u-s*l*u)+g*(+t*c*h-t*o*f-s*a*h+n*a*f+s*o*u-n*c*u)+m*(-i*o*u-t*l*h+t*o*d+i*a*h-n*a*d+n*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],f=e[11],p=e[12],v=e[13],g=e[14],m=e[15],S=h*g*c-v*d*c+v*l*f-o*g*f-h*l*m+o*d*m,y=p*d*c-u*g*c-p*l*f+a*g*f+u*l*m-a*d*m,x=u*v*c-p*h*c+p*o*f-a*v*f-u*o*m+a*h*m,P=p*h*l-u*v*l-p*o*d+a*v*d+u*o*g-a*h*g,R=t*S+n*y+i*x+s*P;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/R;return e[0]=S*A,e[1]=(v*d*s-h*g*s-v*i*f+n*g*f+h*i*m-n*d*m)*A,e[2]=(o*g*s-v*l*s+v*i*c-n*g*c-o*i*m+n*l*m)*A,e[3]=(h*l*s-o*d*s-h*i*c+n*d*c+o*i*f-n*l*f)*A,e[4]=y*A,e[5]=(u*g*s-p*d*s+p*i*f-t*g*f-u*i*m+t*d*m)*A,e[6]=(p*l*s-a*g*s-p*i*c+t*g*c+a*i*m-t*l*m)*A,e[7]=(a*d*s-u*l*s+u*i*c-t*d*c-a*i*f+t*l*f)*A,e[8]=x*A,e[9]=(p*h*s-u*v*s-p*n*f+t*v*f+u*n*m-t*h*m)*A,e[10]=(a*v*s-p*o*s+p*n*c-t*v*c-a*n*m+t*o*m)*A,e[11]=(u*o*s-a*h*s-u*n*c+t*h*c+a*n*f-t*o*f)*A,e[12]=P*A,e[13]=(u*v*i-p*h*i+p*n*d-t*v*d-u*n*g+t*h*g)*A,e[14]=(p*o*i-a*v*i-p*n*l+t*v*l+a*n*g-t*o*g)*A,e[15]=(a*h*i-u*o*i+u*n*l-t*h*l-a*n*d+t*o*d)*A,this}scale(e){const t=this.elements,n=e.x,i=e.y,s=e.z;return t[0]*=n,t[4]*=i,t[8]*=s,t[1]*=n,t[5]*=i,t[9]*=s,t[2]*=n,t[6]*=i,t[10]*=s,t[3]*=n,t[7]*=i,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,u*o+n,u*l-i*a,0,c*l-i*o,u*l+i*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,s,a){return this.set(1,n,s,0,e,1,a,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,u=a+a,h=o+o,d=s*c,f=s*u,p=s*h,v=a*u,g=a*h,m=o*h,S=l*c,y=l*u,x=l*h,P=n.x,R=n.y,A=n.z;return i[0]=(1-(v+m))*P,i[1]=(f+x)*P,i[2]=(p-y)*P,i[3]=0,i[4]=(f-x)*R,i[5]=(1-(d+m))*R,i[6]=(g+S)*R,i[7]=0,i[8]=(p+y)*A,i[9]=(g-S)*A,i[10]=(1-(d+v))*A,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let s=gr.set(i[0],i[1],i[2]).length();const a=gr.set(i[4],i[5],i[6]).length(),o=gr.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),e.x=i[12],e.y=i[13],e.z=i[14],Ln.copy(this);const c=1/s,u=1/a,h=1/o;return Ln.elements[0]*=c,Ln.elements[1]*=c,Ln.elements[2]*=c,Ln.elements[4]*=u,Ln.elements[5]*=u,Ln.elements[6]*=u,Ln.elements[8]*=h,Ln.elements[9]*=h,Ln.elements[10]*=h,t.setFromRotationMatrix(Ln),n.x=s,n.y=a,n.z=o,this}makePerspective(e,t,n,i,s,a,o=gi){const l=this.elements,c=2*s/(t-e),u=2*s/(n-i),h=(t+e)/(t-e),d=(n+i)/(n-i);let f,p;if(o===gi)f=-(a+s)/(a-s),p=-2*a*s/(a-s);else if(o===ao)f=-a/(a-s),p=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=u,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=p,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,i,s,a,o=gi){const l=this.elements,c=1/(t-e),u=1/(n-i),h=1/(a-s),d=(t+e)*c,f=(n+i)*u;let p,v;if(o===gi)p=(a+s)*h,v=-2*h;else if(o===ao)p=s*h,v=-1*h;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=v,l[14]=-p,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const gr=new C,Ln=new me,Rm=new C(0,0,0),Pm=new C(1,1,1),Ai=new C,ha=new C,pn=new C,Xu=new me,ju=new ht;class Bt{constructor(e=0,t=0,n=0,i=Bt.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,s=i[0],a=i[4],o=i[8],l=i[1],c=i[5],u=i[9],h=i[2],d=i[6],f=i[10];switch(t){case"XYZ":this._y=Math.asin(Wt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Wt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(Wt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Wt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Wt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Wt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Xu.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Xu,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ju.setFromEuler(this),this.setFromQuaternion(ju,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Bt.DEFAULT_ORDER="XYZ";class jc{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Im=0;const qu=new C,vr=new ht,ai=new me,da=new C,os=new C,Dm=new C,Lm=new ht,Yu=new C(1,0,0),Ku=new C(0,1,0),Zu=new C(0,0,1),$u={type:"added"},Um={type:"removed"},xr={type:"childadded",child:null},Ho={type:"childremoved",child:null};class dt extends cr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Im++}),this.uuid=Bn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=dt.DEFAULT_UP.clone();const e=new C,t=new Bt,n=new ht,i=new C(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new me},normalMatrix:{value:new qe}}),this.matrix=new me,this.matrixWorld=new me,this.matrixAutoUpdate=dt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new jc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return vr.setFromAxisAngle(e,t),this.quaternion.multiply(vr),this}rotateOnWorldAxis(e,t){return vr.setFromAxisAngle(e,t),this.quaternion.premultiply(vr),this}rotateX(e){return this.rotateOnAxis(Yu,e)}rotateY(e){return this.rotateOnAxis(Ku,e)}rotateZ(e){return this.rotateOnAxis(Zu,e)}translateOnAxis(e,t){return qu.copy(e).applyQuaternion(this.quaternion),this.position.add(qu.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Yu,e)}translateY(e){return this.translateOnAxis(Ku,e)}translateZ(e){return this.translateOnAxis(Zu,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ai.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?da.copy(e):da.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ai.lookAt(os,da,this.up):ai.lookAt(da,os,this.up),this.quaternion.setFromRotationMatrix(ai),i&&(ai.extractRotation(i.matrixWorld),vr.setFromRotationMatrix(ai),this.quaternion.premultiply(vr.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent($u),xr.child=e,this.dispatchEvent(xr),xr.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Um),Ho.child=e,this.dispatchEvent(Ho),Ho.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ai.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ai.multiply(e.parent.matrixWorld)),e.applyMatrix4(ai),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent($u),xr.child=e,this.dispatchEvent(xr),xr.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,e,Dm),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,Lm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));i.material=o}else i.material=s(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),h=a(e.shapes),d=a(e.skeletons),f=a(e.animations),p=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=i,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}dt.DEFAULT_UP=new C(0,1,0);dt.DEFAULT_MATRIX_AUTO_UPDATE=!0;dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Un=new C,oi=new C,Go=new C,li=new C,_r=new C,yr=new C,Ju=new C,Wo=new C,Xo=new C,jo=new C,qo=new rt,Yo=new rt,Ko=new rt;class Tn{constructor(e=new C,t=new C,n=new C){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Un.subVectors(e,t),i.cross(Un);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(e,t,n,i,s){Un.subVectors(i,t),oi.subVectors(n,t),Go.subVectors(e,t);const a=Un.dot(Un),o=Un.dot(oi),l=Un.dot(Go),c=oi.dot(oi),u=oi.dot(Go),h=a*c-o*o;if(h===0)return s.set(0,0,0),null;const d=1/h,f=(c*l-o*u)*d,p=(a*u-o*l)*d;return s.set(1-f-p,p,f)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,li)===null?!1:li.x>=0&&li.y>=0&&li.x+li.y<=1}static getInterpolation(e,t,n,i,s,a,o,l){return this.getBarycoord(e,t,n,i,li)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,li.x),l.addScaledVector(a,li.y),l.addScaledVector(o,li.z),l)}static getInterpolatedAttribute(e,t,n,i,s,a){return qo.setScalar(0),Yo.setScalar(0),Ko.setScalar(0),qo.fromBufferAttribute(e,t),Yo.fromBufferAttribute(e,n),Ko.fromBufferAttribute(e,i),a.setScalar(0),a.addScaledVector(qo,s.x),a.addScaledVector(Yo,s.y),a.addScaledVector(Ko,s.z),a}static isFrontFacing(e,t,n,i){return Un.subVectors(n,t),oi.subVectors(e,t),Un.cross(oi).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Un.subVectors(this.c,this.b),oi.subVectors(this.a,this.b),Un.cross(oi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Tn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Tn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,s){return Tn.getInterpolation(e,this.a,this.b,this.c,t,n,i,s)}containsPoint(e){return Tn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Tn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,s=this.c;let a,o;_r.subVectors(i,n),yr.subVectors(s,n),Wo.subVectors(e,n);const l=_r.dot(Wo),c=yr.dot(Wo);if(l<=0&&c<=0)return t.copy(n);Xo.subVectors(e,i);const u=_r.dot(Xo),h=yr.dot(Xo);if(u>=0&&h<=u)return t.copy(i);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(_r,a);jo.subVectors(e,s);const f=_r.dot(jo),p=yr.dot(jo);if(p>=0&&f<=p)return t.copy(s);const v=f*c-l*p;if(v<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(yr,o);const g=u*p-f*h;if(g<=0&&h-u>=0&&f-p>=0)return Ju.subVectors(s,i),o=(h-u)/(h-u+(f-p)),t.copy(i).addScaledVector(Ju,o);const m=1/(g+v+d);return a=v*m,o=d*m,t.copy(n).addScaledVector(_r,a).addScaledVector(yr,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const tf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ci={h:0,s:0,l:0},fa={h:0,s:0,l:0};function Zo(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}class Ae{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=at){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Xe.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=Xe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Xe.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=Xe.workingColorSpace){if(e=Wc(e,1),t=Wt(t,0,1),n=Wt(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=Zo(a,s,e+1/3),this.g=Zo(a,s,e),this.b=Zo(a,s,e-1/3)}return Xe.toWorkingColorSpace(this,i),this}setStyle(e,t=at){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=i[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=at){const n=tf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=xi(e.r),this.g=xi(e.g),this.b=xi(e.b),this}copyLinearToSRGB(e){return this.r=Vr(e.r),this.g=Vr(e.g),this.b=Vr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=at){return Xe.fromWorkingColorSpace($t.copy(this),e),Math.round(Wt($t.r*255,0,255))*65536+Math.round(Wt($t.g*255,0,255))*256+Math.round(Wt($t.b*255,0,255))}getHexString(e=at){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Xe.workingColorSpace){Xe.fromWorkingColorSpace($t.copy(this),t);const n=$t.r,i=$t.g,s=$t.b,a=Math.max(n,i,s),o=Math.min(n,i,s);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const h=a-o;switch(c=u<=.5?h/(a+o):h/(2-a-o),a){case n:l=(i-s)/h+(i<s?6:0);break;case i:l=(s-n)/h+2;break;case s:l=(n-i)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=Xe.workingColorSpace){return Xe.fromWorkingColorSpace($t.copy(this),t),e.r=$t.r,e.g=$t.g,e.b=$t.b,e}getStyle(e=at){Xe.fromWorkingColorSpace($t.copy(this),e);const t=$t.r,n=$t.g,i=$t.b;return e!==at?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Ci),this.setHSL(Ci.h+e,Ci.s+t,Ci.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ci),e.getHSL(fa);const n=Ts(Ci.h,fa.h,t),i=Ts(Ci.s,fa.s,t),s=Ts(Ci.l,fa.l,t);return this.setHSL(n,i,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*i,this.g=s[1]*t+s[4]*n+s[7]*i,this.b=s[2]*t+s[5]*n+s[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const $t=new Ae;Ae.NAMES=tf;let Nm=0;class dn extends cr{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nm++}),this.uuid=Bn(),this.name="",this.blending=kr,this.side=_i,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Dl,this.blendDst=Ll,this.blendEquation=pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ae(0,0,0),this.blendAlpha=0,this.depthFunc=Xr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Nu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=hr,this.stencilZFail=hr,this.stencilZPass=hr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==kr&&(n.blending=this.blending),this.side!==_i&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Dl&&(n.blendSrc=this.blendSrc),this.blendDst!==Ll&&(n.blendDst=this.blendDst),this.blendEquation!==pi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Xr&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Nu&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==hr&&(n.stencilFail=this.stencilFail),this.stencilZFail!==hr&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==hr&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=i(e.textures),a=i(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class vi extends dn{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bt,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Dt=new C,pa=new Ue;class wt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=mc,this.updateRanges=[],this.gpuType=wn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)pa.fromBufferAttribute(this,t),pa.applyMatrix3(e),this.setXY(t,pa.x,pa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix3(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.applyMatrix4(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.applyNormalMatrix(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Dt.fromBufferAttribute(this,t),Dt.transformDirection(e),this.setXYZ(t,Dt.x,Dt.y,Dt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=On(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=vt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=On(t,this.array)),t}setX(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=On(t,this.array)),t}setY(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=On(t,this.array)),t}setZ(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=On(t,this.array)),t}setW(e,t){return this.normalized&&(t=vt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),i=vt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e*=this.itemSize,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),i=vt(i,this.array),s=vt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==mc&&(e.usage=this.usage),e}}class qc extends wt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class nf extends wt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Ut extends wt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Fm=0;const _n=new me,$o=new dt,Mr=new C,mn=new Xt,ls=new Xt,Ht=new C;class It extends cr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Fm++}),this.uuid=Bn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Qd(e)?nf:qc)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new qe().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return _n.makeRotationFromQuaternion(e),this.applyMatrix4(_n),this}rotateX(e){return _n.makeRotationX(e),this.applyMatrix4(_n),this}rotateY(e){return _n.makeRotationY(e),this.applyMatrix4(_n),this}rotateZ(e){return _n.makeRotationZ(e),this.applyMatrix4(_n),this}translate(e,t,n){return _n.makeTranslation(e,t,n),this.applyMatrix4(_n),this}scale(e,t,n){return _n.makeScale(e,t,n),this.applyMatrix4(_n),this}lookAt(e){return $o.lookAt(e),$o.updateMatrix(),this.applyMatrix4($o.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Mr).negate(),this.translate(Mr.x,Mr.y,Mr.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let i=0,s=e.length;i<s;i++){const a=e[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ut(n,3))}else{for(let n=0,i=t.count;n<i;n++){const s=e[n];t.setXYZ(n,s.x,s.y,s.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Xt);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new C(-1/0,-1/0,-1/0),new C(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const s=t[n];mn.setFromBufferAttribute(s),this.morphTargetsRelative?(Ht.addVectors(this.boundingBox.min,mn.min),this.boundingBox.expandByPoint(Ht),Ht.addVectors(this.boundingBox.max,mn.max),this.boundingBox.expandByPoint(Ht)):(this.boundingBox.expandByPoint(mn.min),this.boundingBox.expandByPoint(mn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qn);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new C,1/0);return}if(e){const n=this.boundingSphere.center;if(mn.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];ls.setFromBufferAttribute(o),this.morphTargetsRelative?(Ht.addVectors(mn.min,ls.min),mn.expandByPoint(Ht),Ht.addVectors(mn.max,ls.max),mn.expandByPoint(Ht)):(mn.expandByPoint(ls.min),mn.expandByPoint(ls.max))}mn.getCenter(n);let i=0;for(let s=0,a=e.count;s<a;s++)Ht.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(Ht));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Ht.fromBufferAttribute(o,c),l&&(Mr.fromBufferAttribute(e,c),Ht.add(Mr)),i=Math.max(i,n.distanceToSquared(Ht))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,i=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new wt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let I=0;I<n.count;I++)o[I]=new C,l[I]=new C;const c=new C,u=new C,h=new C,d=new Ue,f=new Ue,p=new Ue,v=new C,g=new C;function m(I,T,_){c.fromBufferAttribute(n,I),u.fromBufferAttribute(n,T),h.fromBufferAttribute(n,_),d.fromBufferAttribute(s,I),f.fromBufferAttribute(s,T),p.fromBufferAttribute(s,_),u.sub(c),h.sub(c),f.sub(d),p.sub(d);const M=1/(f.x*p.y-p.x*f.y);isFinite(M)&&(v.copy(u).multiplyScalar(p.y).addScaledVector(h,-f.y).multiplyScalar(M),g.copy(h).multiplyScalar(f.x).addScaledVector(u,-p.x).multiplyScalar(M),o[I].add(v),o[T].add(v),o[_].add(v),l[I].add(g),l[T].add(g),l[_].add(g))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let I=0,T=S.length;I<T;++I){const _=S[I],M=_.start,L=_.count;for(let U=M,N=M+L;U<N;U+=3)m(e.getX(U+0),e.getX(U+1),e.getX(U+2))}const y=new C,x=new C,P=new C,R=new C;function A(I){P.fromBufferAttribute(i,I),R.copy(P);const T=o[I];y.copy(T),y.sub(P.multiplyScalar(P.dot(T))).normalize(),x.crossVectors(R,T);const M=x.dot(l[I])<0?-1:1;a.setXYZW(I,y.x,y.y,y.z,M)}for(let I=0,T=S.length;I<T;++I){const _=S[I],M=_.start,L=_.count;for(let U=M,N=M+L;U<N;U+=3)A(e.getX(U+0)),A(e.getX(U+1)),A(e.getX(U+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new wt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new C,s=new C,a=new C,o=new C,l=new C,c=new C,u=new C,h=new C;if(e)for(let d=0,f=e.count;d<f;d+=3){const p=e.getX(d+0),v=e.getX(d+1),g=e.getX(d+2);i.fromBufferAttribute(t,p),s.fromBufferAttribute(t,v),a.fromBufferAttribute(t,g),u.subVectors(a,s),h.subVectors(i,s),u.cross(h),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,g),o.add(u),l.add(u),c.add(u),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let d=0,f=t.count;d<f;d+=3)i.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,s),h.subVectors(i,s),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ht.fromBufferAttribute(e,t),Ht.normalize(),e.setXYZ(t,Ht.x,Ht.y,Ht.z)}toNonIndexed(){function e(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let f=0,p=0;for(let v=0,g=l.length;v<g;v++){o.isInterleavedBufferAttribute?f=l[v]*o.data.stride+o.offset:f=l[v]*u;for(let m=0;m<u;m++)d[p++]=c[f++]}return new wt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new It,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=e(l,n);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],f=e(d,n);l.push(f)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const f=c[h];u.push(f.toJSON(e.data))}u.length>0&&(i[l]=u,s=!0)}s&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const c in i){const u=i[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],h=s[c];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,u=a.length;c<u;c++){const h=a[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Qu=new me,Wi=new js,ma=new Qn,eh=new C,ga=new C,va=new C,xa=new C,Jo=new C,_a=new C,th=new C,ya=new C;class Ft extends dt{constructor(e=new It,t=new vi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(s&&o){_a.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=o[l],h=s[l];u!==0&&(Jo.fromBufferAttribute(h,e),a?_a.addScaledVector(Jo,u):_a.addScaledVector(Jo.sub(t),u))}t.add(_a)}return t}raycast(e,t){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ma.copy(n.boundingSphere),ma.applyMatrix4(s),Wi.copy(e.ray).recast(e.near),!(ma.containsPoint(Wi.origin)===!1&&(Wi.intersectSphere(ma,eh)===null||Wi.origin.distanceToSquared(eh)>(e.far-e.near)**2))&&(Qu.copy(s).invert(),Wi.copy(e.ray).applyMatrix4(Qu),!(n.boundingBox!==null&&Wi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Wi)))}_computeIntersections(e,t,n){let i;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,v=d.length;p<v;p++){const g=d[p],m=a[g.materialIndex],S=Math.max(g.start,f.start),y=Math.min(o.count,Math.min(g.start+g.count,f.start+f.count));for(let x=S,P=y;x<P;x+=3){const R=o.getX(x),A=o.getX(x+1),I=o.getX(x+2);i=Ma(this,m,e,n,c,u,h,R,A,I),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=g.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),v=Math.min(o.count,f.start+f.count);for(let g=p,m=v;g<m;g+=3){const S=o.getX(g),y=o.getX(g+1),x=o.getX(g+2);i=Ma(this,a,e,n,c,u,h,S,y,x),i&&(i.faceIndex=Math.floor(g/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,v=d.length;p<v;p++){const g=d[p],m=a[g.materialIndex],S=Math.max(g.start,f.start),y=Math.min(l.count,Math.min(g.start+g.count,f.start+f.count));for(let x=S,P=y;x<P;x+=3){const R=x,A=x+1,I=x+2;i=Ma(this,m,e,n,c,u,h,R,A,I),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=g.materialIndex,t.push(i))}}else{const p=Math.max(0,f.start),v=Math.min(l.count,f.start+f.count);for(let g=p,m=v;g<m;g+=3){const S=g,y=g+1,x=g+2;i=Ma(this,a,e,n,c,u,h,S,y,x),i&&(i.faceIndex=Math.floor(g/3),t.push(i))}}}}function Om(r,e,t,n,i,s,a,o){let l;if(e.side===un?l=n.intersectTriangle(a,s,i,!0,o):l=n.intersectTriangle(i,s,a,e.side===_i,o),l===null)return null;ya.copy(o),ya.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(ya);return c<t.near||c>t.far?null:{distance:c,point:ya.clone(),object:r}}function Ma(r,e,t,n,i,s,a,o,l,c){r.getVertexPosition(o,ga),r.getVertexPosition(l,va),r.getVertexPosition(c,xa);const u=Om(r,e,t,n,ga,va,xa,th);if(u){const h=new C;Tn.getBarycoord(th,ga,va,xa,h),i&&(u.uv=Tn.getInterpolatedAttribute(i,o,l,c,h,new Ue)),s&&(u.uv1=Tn.getInterpolatedAttribute(s,o,l,c,h,new Ue)),a&&(u.normal=Tn.getInterpolatedAttribute(a,o,l,c,h,new C),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new C,materialIndex:0};Tn.getNormal(ga,va,xa,d.normal),u.face=d,u.barycoord=h}return u}class Jr extends It{constructor(e=1,t=1,n=1,i=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:s,depthSegments:a};const o=this;i=Math.floor(i),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],u=[],h=[];let d=0,f=0;p("z","y","x",-1,-1,n,t,e,a,s,0),p("z","y","x",1,-1,n,t,-e,a,s,1),p("x","z","y",1,1,e,n,t,i,a,2),p("x","z","y",1,-1,e,n,-t,i,a,3),p("x","y","z",1,-1,e,t,n,i,s,4),p("x","y","z",-1,-1,e,t,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new Ut(c,3)),this.setAttribute("normal",new Ut(u,3)),this.setAttribute("uv",new Ut(h,2));function p(v,g,m,S,y,x,P,R,A,I,T){const _=x/A,M=P/I,L=x/2,U=P/2,N=R/2,F=A+1,k=I+1;let W=0,V=0;const K=new C;for(let $=0;$<k;$++){const J=$*M-U;for(let oe=0;oe<F;oe++){const Re=oe*_-L;K[v]=Re*S,K[g]=J*y,K[m]=N,c.push(K.x,K.y,K.z),K[v]=0,K[g]=0,K[m]=R>0?1:-1,u.push(K.x,K.y,K.z),h.push(oe/A),h.push(1-$/I),W+=1}}for(let $=0;$<I;$++)for(let J=0;J<A;J++){const oe=d+J+F*$,Re=d+J+F*($+1),j=d+(J+1)+F*($+1),ne=d+(J+1)+F*$;l.push(oe,Re,ne),l.push(Re,j,ne),V+=6}o.addGroup(f,V,T),f+=V,d+=W}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Jr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Kr(r){const e={};for(const t in r){e[t]={};for(const n in r[t]){const i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function sn(r){const e={};for(let t=0;t<r.length;t++){const n=Kr(r[t]);for(const i in n)e[i]=n[i]}return e}function Bm(r){const e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function rf(r){const e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Xe.workingColorSpace}const Yn={clone:Kr,merge:sn};var km=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,zm=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class At extends dn{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=km,this.fragmentShader=zm,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Kr(e.uniforms),this.uniformsGroups=Bm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?t.uniforms[i]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[i]={type:"m4",value:a.toArray()}:t.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class sf extends dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new me,this.projectionMatrix=new me,this.projectionMatrixInverse=new me,this.coordinateSystem=gi}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Ri=new C,nh=new Ue,ih=new Ue;class Qt extends sf{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Yr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(bs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Yr*2*Math.atan(Math.tan(bs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Ri.x,Ri.y).multiplyScalar(-e/Ri.z),Ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ri.x,Ri.y).multiplyScalar(-e/Ri.z)}getViewSize(e,t){return this.getViewBounds(e,nh,ih),t.subVectors(ih,nh)}setViewOffset(e,t,n,i,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(bs*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,s=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*i/l,t-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Sr=-90,br=1;class Vm extends dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new Qt(Sr,br,e,t);i.layers=this.layers,this.add(i);const s=new Qt(Sr,br,e,t);s.layers=this.layers,this.add(s);const a=new Qt(Sr,br,e,t);a.layers=this.layers,this.add(a);const o=new Qt(Sr,br,e,t);o.layers=this.layers,this.add(o);const l=new Qt(Sr,br,e,t);l.layers=this.layers,this.add(l);const c=new Qt(Sr,br,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===gi)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ao)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,i),e.render(t,s),e.setRenderTarget(n,1,i),e.render(t,a),e.setRenderTarget(n,2,i),e.render(t,o),e.setRenderTarget(n,3,i),e.render(t,l),e.setRenderTarget(n,4,i),e.render(t,c),n.texture.generateMipmaps=v,e.setRenderTarget(n,5,i),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}}class af extends Pt{constructor(e,t,n,i,s,a,o,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:jr,super(e,t,n,i,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Hm extends hn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new af(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:en}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Jr(5,5,5),s=new At({name:"CubemapFromEquirect",uniforms:Kr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:un,blending:Jt});s.uniforms.tEquirect.value=t;const a=new Ft(i,s),o=t.minFilter;return t.minFilter===qn&&(t.minFilter=en),new Vm(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,i){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,i);e.setRenderTarget(s)}}const Qo=new C,Gm=new C,Wm=new qe;class Ki{constructor(e=new C(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=Qo.subVectors(n,t).cross(Gm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Qo),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Wm.getNormalMatrix(e),i=this.coplanarPoint(Qo).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Xi=new Qn,Sa=new C;class Yc{constructor(e=new Ki,t=new Ki,n=new Ki,i=new Ki,s=new Ki,a=new Ki){this.planes=[e,t,n,i,s,a]}set(e,t,n,i,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=gi){const n=this.planes,i=e.elements,s=i[0],a=i[1],o=i[2],l=i[3],c=i[4],u=i[5],h=i[6],d=i[7],f=i[8],p=i[9],v=i[10],g=i[11],m=i[12],S=i[13],y=i[14],x=i[15];if(n[0].setComponents(l-s,d-c,g-f,x-m).normalize(),n[1].setComponents(l+s,d+c,g+f,x+m).normalize(),n[2].setComponents(l+a,d+u,g+p,x+S).normalize(),n[3].setComponents(l-a,d-u,g-p,x-S).normalize(),n[4].setComponents(l-o,d-h,g-v,x-y).normalize(),t===gi)n[5].setComponents(l+o,d+h,g+v,x+y).normalize();else if(t===ao)n[5].setComponents(o,h,v,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Xi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Xi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Xi)}intersectsSprite(e){return Xi.center.set(0,0,0),Xi.radius=.7071067811865476,Xi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Xi)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(Sa.x=i.normal.x>0?e.max.x:e.min.x,Sa.y=i.normal.y>0?e.max.y:e.min.y,Sa.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(Sa)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function of(){let r=null,e=!1,t=null,n=null;function i(s,a){t(s,a),n=r.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(i),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function Xm(r){const e=new WeakMap;function t(o,l){const c=o.array,u=o.usage,h=c.byteLength,d=r.createBuffer();r.bindBuffer(l,d),r.bufferData(l,c,u),o.onUploadCallback();let f;if(c instanceof Float32Array)f=r.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=r.SHORT;else if(c instanceof Uint32Array)f=r.UNSIGNED_INT;else if(c instanceof Int32Array)f=r.INT;else if(c instanceof Int8Array)f=r.BYTE;else if(c instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:h}}function n(o,l,c){const u=l.array,h=l.updateRanges;if(r.bindBuffer(c,o),h.length===0)r.bufferSubData(c,0,u);else{h.sort((f,p)=>f.start-p.start);let d=0;for(let f=1;f<h.length;f++){const p=h[d],v=h[f];v.start<=p.start+p.count+1?p.count=Math.max(p.count,v.start+v.count-p.start):(++d,h[d]=v)}h.length=d+1;for(let f=0,p=h.length;f<p;f++){const v=h[f];r.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(r.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:s,update:a}}class qs extends It{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,u=l+1,h=e/o,d=t/l,f=[],p=[],v=[],g=[];for(let m=0;m<u;m++){const S=m*d-a;for(let y=0;y<c;y++){const x=y*h-s;p.push(x,-S,0),v.push(0,0,1),g.push(y/o),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let S=0;S<o;S++){const y=S+c*m,x=S+c*(m+1),P=S+1+c*(m+1),R=S+1+c*m;f.push(y,x,R),f.push(x,P,R)}this.setIndex(f),this.setAttribute("position",new Ut(p,3)),this.setAttribute("normal",new Ut(v,3)),this.setAttribute("uv",new Ut(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new qs(e.width,e.height,e.widthSegments,e.heightSegments)}}var jm=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ym=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Km=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$m=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Jm=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,eg=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,tg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ng=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ig=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rg=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,sg=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ag=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,og=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,lg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,cg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ug=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,dg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,fg=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,pg=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,mg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,gg=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,vg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,xg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_g=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,yg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Mg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Sg="gl_FragColor = linearToOutputTexel( gl_FragColor );",bg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Tg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Eg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,wg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ag=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Rg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Pg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ig=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Dg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ug=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ng=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Fg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Og=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Bg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,kg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,zg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Vg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Hg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Gg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Wg=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Xg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,jg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,qg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Yg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Kg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$g=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,e0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,t0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,n0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,i0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,r0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,s0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,a0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,o0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,l0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,c0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,u0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,h0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,d0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,f0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,p0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,m0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,g0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,v0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,x0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,y0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,M0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,S0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,b0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,T0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,E0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,w0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,A0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,C0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,R0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,P0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,I0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,D0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,L0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,U0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,N0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,F0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,O0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,B0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,k0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,z0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,V0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,H0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,G0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,W0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const X0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,j0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,q0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Y0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,K0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Z0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,J0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Q0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ev=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,tv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,nv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,iv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,av=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ov=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,lv=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,uv=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,dv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,fv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,pv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,gv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vv=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_v=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,yv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,bv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Tv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$e={alphahash_fragment:jm,alphahash_pars_fragment:qm,alphamap_fragment:Ym,alphamap_pars_fragment:Km,alphatest_fragment:Zm,alphatest_pars_fragment:$m,aomap_fragment:Jm,aomap_pars_fragment:Qm,batching_pars_vertex:eg,batching_vertex:tg,begin_vertex:ng,beginnormal_vertex:ig,bsdfs:rg,iridescence_fragment:sg,bumpmap_pars_fragment:ag,clipping_planes_fragment:og,clipping_planes_pars_fragment:lg,clipping_planes_pars_vertex:cg,clipping_planes_vertex:ug,color_fragment:hg,color_pars_fragment:dg,color_pars_vertex:fg,color_vertex:pg,common:mg,cube_uv_reflection_fragment:gg,defaultnormal_vertex:vg,displacementmap_pars_vertex:xg,displacementmap_vertex:_g,emissivemap_fragment:yg,emissivemap_pars_fragment:Mg,colorspace_fragment:Sg,colorspace_pars_fragment:bg,envmap_fragment:Tg,envmap_common_pars_fragment:Eg,envmap_pars_fragment:wg,envmap_pars_vertex:Ag,envmap_physical_pars_fragment:Bg,envmap_vertex:Cg,fog_vertex:Rg,fog_pars_vertex:Pg,fog_fragment:Ig,fog_pars_fragment:Dg,gradientmap_pars_fragment:Lg,lightmap_pars_fragment:Ug,lights_lambert_fragment:Ng,lights_lambert_pars_fragment:Fg,lights_pars_begin:Og,lights_toon_fragment:kg,lights_toon_pars_fragment:zg,lights_phong_fragment:Vg,lights_phong_pars_fragment:Hg,lights_physical_fragment:Gg,lights_physical_pars_fragment:Wg,lights_fragment_begin:Xg,lights_fragment_maps:jg,lights_fragment_end:qg,logdepthbuf_fragment:Yg,logdepthbuf_pars_fragment:Kg,logdepthbuf_pars_vertex:Zg,logdepthbuf_vertex:$g,map_fragment:Jg,map_pars_fragment:Qg,map_particle_fragment:e0,map_particle_pars_fragment:t0,metalnessmap_fragment:n0,metalnessmap_pars_fragment:i0,morphinstance_vertex:r0,morphcolor_vertex:s0,morphnormal_vertex:a0,morphtarget_pars_vertex:o0,morphtarget_vertex:l0,normal_fragment_begin:c0,normal_fragment_maps:u0,normal_pars_fragment:h0,normal_pars_vertex:d0,normal_vertex:f0,normalmap_pars_fragment:p0,clearcoat_normal_fragment_begin:m0,clearcoat_normal_fragment_maps:g0,clearcoat_pars_fragment:v0,iridescence_pars_fragment:x0,opaque_fragment:_0,packing:y0,premultiplied_alpha_fragment:M0,project_vertex:S0,dithering_fragment:b0,dithering_pars_fragment:T0,roughnessmap_fragment:E0,roughnessmap_pars_fragment:w0,shadowmap_pars_fragment:A0,shadowmap_pars_vertex:C0,shadowmap_vertex:R0,shadowmask_pars_fragment:P0,skinbase_vertex:I0,skinning_pars_vertex:D0,skinning_vertex:L0,skinnormal_vertex:U0,specularmap_fragment:N0,specularmap_pars_fragment:F0,tonemapping_fragment:O0,tonemapping_pars_fragment:B0,transmission_fragment:k0,transmission_pars_fragment:z0,uv_pars_fragment:V0,uv_pars_vertex:H0,uv_vertex:G0,worldpos_vertex:W0,background_vert:X0,background_frag:j0,backgroundCube_vert:q0,backgroundCube_frag:Y0,cube_vert:K0,cube_frag:Z0,depth_vert:$0,depth_frag:J0,distanceRGBA_vert:Q0,distanceRGBA_frag:ev,equirect_vert:tv,equirect_frag:nv,linedashed_vert:iv,linedashed_frag:rv,meshbasic_vert:sv,meshbasic_frag:av,meshlambert_vert:ov,meshlambert_frag:lv,meshmatcap_vert:cv,meshmatcap_frag:uv,meshnormal_vert:hv,meshnormal_frag:dv,meshphong_vert:fv,meshphong_frag:pv,meshphysical_vert:mv,meshphysical_frag:gv,meshtoon_vert:vv,meshtoon_frag:xv,points_vert:_v,points_frag:yv,shadow_vert:Mv,shadow_frag:Sv,sprite_vert:bv,sprite_frag:Tv},Me={common:{diffuse:{value:new Ae(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qe}},envmap:{envMap:{value:null},envMapRotation:{value:new qe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qe},normalScale:{value:new Ue(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ae(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ae(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0},uvTransform:{value:new qe}},sprite:{diffuse:{value:new Ae(16777215)},opacity:{value:1},center:{value:new Ue(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}}},Gn={basic:{uniforms:sn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:$e.meshbasic_vert,fragmentShader:$e.meshbasic_frag},lambert:{uniforms:sn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ae(0)}}]),vertexShader:$e.meshlambert_vert,fragmentShader:$e.meshlambert_frag},phong:{uniforms:sn([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ae(0)},specular:{value:new Ae(1118481)},shininess:{value:30}}]),vertexShader:$e.meshphong_vert,fragmentShader:$e.meshphong_frag},standard:{uniforms:sn([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new Ae(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag},toon:{uniforms:sn([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new Ae(0)}}]),vertexShader:$e.meshtoon_vert,fragmentShader:$e.meshtoon_frag},matcap:{uniforms:sn([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:$e.meshmatcap_vert,fragmentShader:$e.meshmatcap_frag},points:{uniforms:sn([Me.points,Me.fog]),vertexShader:$e.points_vert,fragmentShader:$e.points_frag},dashed:{uniforms:sn([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$e.linedashed_vert,fragmentShader:$e.linedashed_frag},depth:{uniforms:sn([Me.common,Me.displacementmap]),vertexShader:$e.depth_vert,fragmentShader:$e.depth_frag},normal:{uniforms:sn([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:$e.meshnormal_vert,fragmentShader:$e.meshnormal_frag},sprite:{uniforms:sn([Me.sprite,Me.fog]),vertexShader:$e.sprite_vert,fragmentShader:$e.sprite_frag},background:{uniforms:{uvTransform:{value:new qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$e.background_vert,fragmentShader:$e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qe}},vertexShader:$e.backgroundCube_vert,fragmentShader:$e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$e.cube_vert,fragmentShader:$e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$e.equirect_vert,fragmentShader:$e.equirect_frag},distanceRGBA:{uniforms:sn([Me.common,Me.displacementmap,{referencePosition:{value:new C},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$e.distanceRGBA_vert,fragmentShader:$e.distanceRGBA_frag},shadow:{uniforms:sn([Me.lights,Me.fog,{color:{value:new Ae(0)},opacity:{value:1}}]),vertexShader:$e.shadow_vert,fragmentShader:$e.shadow_frag}};Gn.physical={uniforms:sn([Gn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qe},clearcoatNormalScale:{value:new Ue(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qe},sheen:{value:0},sheenColor:{value:new Ae(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qe},transmissionSamplerSize:{value:new Ue},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qe},attenuationDistance:{value:0},attenuationColor:{value:new Ae(0)},specularColor:{value:new Ae(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qe},anisotropyVector:{value:new Ue},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qe}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag};const ba={r:0,b:0,g:0},ji=new Bt,Ev=new me;function wv(r,e,t,n,i,s,a){const o=new Ae(0);let l=s===!0?0:1,c,u,h=null,d=0,f=null;function p(S){let y=S.isScene===!0?S.background:null;return y&&y.isTexture&&(y=(S.backgroundBlurriness>0?t:e).get(y)),y}function v(S){let y=!1;const x=p(S);x===null?m(o,l):x&&x.isColor&&(m(x,1),y=!0);const P=r.xr.getEnvironmentBlendMode();P==="additive"?n.buffers.color.setClear(0,0,0,1,a):P==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(r.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function g(S,y){const x=p(y);x&&(x.isCubeTexture||x.mapping===yo)?(u===void 0&&(u=new Ft(new Jr(1,1,1),new At({name:"BackgroundCubeMaterial",uniforms:Kr(Gn.backgroundCube.uniforms),vertexShader:Gn.backgroundCube.vertexShader,fragmentShader:Gn.backgroundCube.fragmentShader,side:un,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(P,R,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),ji.copy(y.backgroundRotation),ji.x*=-1,ji.y*=-1,ji.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(ji.y*=-1,ji.z*=-1),u.material.uniforms.envMap.value=x,u.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Ev.makeRotationFromEuler(ji)),u.material.toneMapped=Xe.getTransfer(x.colorSpace)!==gt,(h!==x||d!==x.version||f!==r.toneMapping)&&(u.material.needsUpdate=!0,h=x,d=x.version,f=r.toneMapping),u.layers.enableAll(),S.unshift(u,u.geometry,u.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Ft(new qs(2,2),new At({name:"BackgroundMaterial",uniforms:Kr(Gn.background.uniforms),vertexShader:Gn.background.vertexShader,fragmentShader:Gn.background.fragmentShader,side:_i,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Xe.getTransfer(x.colorSpace)!==gt,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||f!==r.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,f=r.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function m(S,y){S.getRGB(ba,rf(r)),n.buffers.color.setClear(ba.r,ba.g,ba.b,y,a)}return{getClearColor:function(){return o},setClearColor:function(S,y=1){o.set(S),l=y,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(S){l=S,m(o,l)},render:v,addToRenderList:g}}function Av(r,e){const t=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null);let s=i,a=!1;function o(_,M,L,U,N){let F=!1;const k=h(U,L,M);s!==k&&(s=k,c(s.object)),F=f(_,U,L,N),F&&p(_,U,L,N),N!==null&&e.update(N,r.ELEMENT_ARRAY_BUFFER),(F||a)&&(a=!1,x(_,M,L,U),N!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(N).buffer))}function l(){return r.createVertexArray()}function c(_){return r.bindVertexArray(_)}function u(_){return r.deleteVertexArray(_)}function h(_,M,L){const U=L.wireframe===!0;let N=n[_.id];N===void 0&&(N={},n[_.id]=N);let F=N[M.id];F===void 0&&(F={},N[M.id]=F);let k=F[U];return k===void 0&&(k=d(l()),F[U]=k),k}function d(_){const M=[],L=[],U=[];for(let N=0;N<t;N++)M[N]=0,L[N]=0,U[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:M,enabledAttributes:L,attributeDivisors:U,object:_,attributes:{},index:null}}function f(_,M,L,U){const N=s.attributes,F=M.attributes;let k=0;const W=L.getAttributes();for(const V in W)if(W[V].location>=0){const $=N[V];let J=F[V];if(J===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&(J=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&(J=_.instanceColor)),$===void 0||$.attribute!==J||J&&$.data!==J.data)return!0;k++}return s.attributesNum!==k||s.index!==U}function p(_,M,L,U){const N={},F=M.attributes;let k=0;const W=L.getAttributes();for(const V in W)if(W[V].location>=0){let $=F[V];$===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&($=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&($=_.instanceColor));const J={};J.attribute=$,$&&$.data&&(J.data=$.data),N[V]=J,k++}s.attributes=N,s.attributesNum=k,s.index=U}function v(){const _=s.newAttributes;for(let M=0,L=_.length;M<L;M++)_[M]=0}function g(_){m(_,0)}function m(_,M){const L=s.newAttributes,U=s.enabledAttributes,N=s.attributeDivisors;L[_]=1,U[_]===0&&(r.enableVertexAttribArray(_),U[_]=1),N[_]!==M&&(r.vertexAttribDivisor(_,M),N[_]=M)}function S(){const _=s.newAttributes,M=s.enabledAttributes;for(let L=0,U=M.length;L<U;L++)M[L]!==_[L]&&(r.disableVertexAttribArray(L),M[L]=0)}function y(_,M,L,U,N,F,k){k===!0?r.vertexAttribIPointer(_,M,L,N,F):r.vertexAttribPointer(_,M,L,U,N,F)}function x(_,M,L,U){v();const N=U.attributes,F=L.getAttributes(),k=M.defaultAttributeValues;for(const W in F){const V=F[W];if(V.location>=0){let K=N[W];if(K===void 0&&(W==="instanceMatrix"&&_.instanceMatrix&&(K=_.instanceMatrix),W==="instanceColor"&&_.instanceColor&&(K=_.instanceColor)),K!==void 0){const $=K.normalized,J=K.itemSize,oe=e.get(K);if(oe===void 0)continue;const Re=oe.buffer,j=oe.type,ne=oe.bytesPerElement,ue=j===r.INT||j===r.UNSIGNED_INT||K.gpuType===Oc;if(K.isInterleavedBufferAttribute){const ee=K.data,ve=ee.stride,Te=K.offset;if(ee.isInstancedInterleavedBuffer){for(let X=0;X<V.locationSize;X++)m(V.location+X,ee.meshPerAttribute);_.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let X=0;X<V.locationSize;X++)g(V.location+X);r.bindBuffer(r.ARRAY_BUFFER,Re);for(let X=0;X<V.locationSize;X++)y(V.location+X,J/V.locationSize,j,$,ve*ne,(Te+J/V.locationSize*X)*ne,ue)}else{if(K.isInstancedBufferAttribute){for(let ee=0;ee<V.locationSize;ee++)m(V.location+ee,K.meshPerAttribute);_.isInstancedMesh!==!0&&U._maxInstanceCount===void 0&&(U._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let ee=0;ee<V.locationSize;ee++)g(V.location+ee);r.bindBuffer(r.ARRAY_BUFFER,Re);for(let ee=0;ee<V.locationSize;ee++)y(V.location+ee,J/V.locationSize,j,$,J*ne,J/V.locationSize*ee*ne,ue)}}else if(k!==void 0){const $=k[W];if($!==void 0)switch($.length){case 2:r.vertexAttrib2fv(V.location,$);break;case 3:r.vertexAttrib3fv(V.location,$);break;case 4:r.vertexAttrib4fv(V.location,$);break;default:r.vertexAttrib1fv(V.location,$)}}}}S()}function P(){I();for(const _ in n){const M=n[_];for(const L in M){const U=M[L];for(const N in U)u(U[N].object),delete U[N];delete M[L]}delete n[_]}}function R(_){if(n[_.id]===void 0)return;const M=n[_.id];for(const L in M){const U=M[L];for(const N in U)u(U[N].object),delete U[N];delete M[L]}delete n[_.id]}function A(_){for(const M in n){const L=n[M];if(L[_.id]===void 0)continue;const U=L[_.id];for(const N in U)u(U[N].object),delete U[N];delete L[_.id]}}function I(){T(),a=!0,s!==i&&(s=i,c(s.object))}function T(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:I,resetDefaultState:T,dispose:P,releaseStatesOfGeometry:R,releaseStatesOfProgram:A,initAttributes:v,enableAttribute:g,disableUnusedAttributes:S}}function Cv(r,e,t){let n;function i(c){n=c}function s(c,u){r.drawArrays(n,c,u),t.update(u,n,1)}function a(c,u,h){h!==0&&(r.drawArraysInstanced(n,c,u,h),t.update(u,n,h))}function o(c,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let f=0;for(let p=0;p<h;p++)f+=u[p];t.update(f,n,1)}function l(c,u,h,d){if(h===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let p=0;p<c.length;p++)a(c[p],u[p],d[p]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let p=0;for(let v=0;v<h;v++)p+=u[v]*d[v];t.update(p,n,1)}}this.setMode=i,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Rv(r,e,t,n){let i;function s(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const A=e.get("EXT_texture_filter_anisotropic");i=r.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(A){return!(A!==An&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){const I=A===Cn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(A!==yi&&n.convert(A)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==wn&&!I)}function l(A){if(A==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),f=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),p=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=r.getParameter(r.MAX_TEXTURE_SIZE),g=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),m=r.getParameter(r.MAX_VERTEX_ATTRIBS),S=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),y=r.getParameter(r.MAX_VARYING_VECTORS),x=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),P=p>0,R=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:p,maxTextureSize:v,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:S,maxVaryings:y,maxFragmentUniforms:x,vertexTextures:P,maxSamples:R}}function Pv(r){const e=this;let t=null,n=0,i=!1,s=!1;const a=new Ki,o=new qe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const f=h.length!==0||d||n!==0||i;return i=d,n=h.length,f},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){const p=h.clippingPlanes,v=h.clipIntersection,g=h.clipShadows,m=r.get(h);if(!i||p===null||p.length===0||s&&!g)s?u(null):c();else{const S=s?0:n,y=S*4;let x=m.clippingState||null;l.value=x,x=u(p,d,y,f);for(let P=0;P!==y;++P)x[P]=t[P];m.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=S}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,f,p){const v=h!==null?h.length:0;let g=null;if(v!==0){if(g=l.value,p!==!0||g===null){const m=f+v*4,S=d.matrixWorldInverse;o.getNormalMatrix(S),(g===null||g.length<m)&&(g=new Float32Array(m));for(let y=0,x=f;y!==v;++y,x+=4)a.copy(h[y]).applyMatrix4(S,o),a.normal.toArray(g,x),g[x+3]=a.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,g}}function Iv(r){let e=new WeakMap;function t(a,o){return o===io?a.mapping=jr:o===Vl&&(a.mapping=qr),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===io||o===Vl)if(e.has(a)){const l=e.get(a).texture;return t(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Hm(l.height);return c.fromEquirectangularTexture(r,a),e.set(a,c),a.addEventListener("dispose",i),t(c.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const l=e.get(o);l!==void 0&&(e.delete(o),l.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}class bo extends sf{constructor(e=-1,t=1,n=1,i=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Fr=4,rh=[.125,.215,.35,.446,.526,.582],$i=20,el=new bo,sh=new Ae;let tl=null,nl=0,il=0,rl=!1;const Zi=(1+Math.sqrt(5))/2,Tr=1/Zi,ah=[new C(-Zi,Tr,0),new C(Zi,Tr,0),new C(-Tr,0,Zi),new C(Tr,0,Zi),new C(0,Zi,-Tr),new C(0,Zi,Tr),new C(-1,1,-1),new C(1,1,-1),new C(-1,1,1),new C(1,1,1)];class oh{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,i,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=uh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ch(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(tl,nl,il),this._renderer.xr.enabled=rl,e.scissorTest=!1,Ta(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===jr||e.mapping===qr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),tl=this._renderer.getRenderTarget(),nl=this._renderer.getActiveCubeFace(),il=this._renderer.getActiveMipmapLevel(),rl=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:en,minFilter:en,generateMipmaps:!1,type:Cn,format:An,colorSpace:nn,depthBuffer:!1},i=lh(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=lh(e,t,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Dv(s)),this._blurMaterial=Lv(s,e,t)}return i}_compileMaterial(e){const t=new Ft(this._lodPlanes[0],e);this._renderer.compile(t,el)}_sceneToCubeUV(e,t,n,i){const o=new Qt(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(sh),u.toneMapping=Ui,u.autoClear=!1;const f=new vi({name:"PMREM.Background",side:un,depthWrite:!1,depthTest:!1}),p=new Ft(new Jr,f);let v=!1;const g=e.background;g?g.isColor&&(f.color.copy(g),e.background=null,v=!0):(f.color.copy(sh),v=!0);for(let m=0;m<6;m++){const S=m%3;S===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):S===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));const y=this._cubeSize;Ta(i,S*y,m>2?y:0,y,y),u.setRenderTarget(i),v&&u.render(p,o),u.render(e,o)}p.geometry.dispose(),p.material.dispose(),u.toneMapping=d,u.autoClear=h,e.background=g}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===jr||e.mapping===qr;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=uh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ch());const s=i?this._cubemapMaterial:this._equirectMaterial,a=new Ft(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Ta(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,el)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=ah[(i-s-1)%ah.length];this._blur(e,s-1,s,a,o)}t.autoClear=n}_blur(e,t,n,i,s){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,i,"latitudinal",s),this._halfBlur(a,e,n,n,i,"longitudinal",s)}_halfBlur(e,t,n,i,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new Ft(this._lodPlanes[i],c),d=c.uniforms,f=this._sizeLods[n]-1,p=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*$i-1),v=s/p,g=isFinite(s)?1+Math.floor(u*v):$i;g>$i&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${$i}`);const m=[];let S=0;for(let A=0;A<$i;++A){const I=A/v,T=Math.exp(-I*I/2);m.push(T),A===0?S+=T:A<g&&(S+=2*T)}for(let A=0;A<m.length;A++)m[A]=m[A]/S;d.envMap.value=e.texture,d.samples.value=g,d.weights.value=m,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:y}=this;d.dTheta.value=p,d.mipInt.value=y-n;const x=this._sizeLods[i],P=3*x*(i>y-Fr?i-y+Fr:0),R=4*(this._cubeSize-x);Ta(t,P,R,3*x,2*x),l.setRenderTarget(t),l.render(h,el)}}function Dv(r){const e=[],t=[],n=[];let i=r;const s=r-Fr+1+rh.length;for(let a=0;a<s;a++){const o=Math.pow(2,i);t.push(o);let l=1/o;a>r-Fr?l=rh[a-r+Fr-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],f=6,p=6,v=3,g=2,m=1,S=new Float32Array(v*p*f),y=new Float32Array(g*p*f),x=new Float32Array(m*p*f);for(let R=0;R<f;R++){const A=R%3*2/3-1,I=R>2?0:-1,T=[A,I,0,A+2/3,I,0,A+2/3,I+1,0,A,I,0,A+2/3,I+1,0,A,I+1,0];S.set(T,v*p*R),y.set(d,g*p*R);const _=[R,R,R,R,R,R];x.set(_,m*p*R)}const P=new It;P.setAttribute("position",new wt(S,v)),P.setAttribute("uv",new wt(y,g)),P.setAttribute("faceIndex",new wt(x,m)),e.push(P),i>Fr&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function lh(r,e,t){const n=new hn(r,e,t);return n.texture.mapping=yo,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ta(r,e,t,n,i){r.viewport.set(e,t,n,i),r.scissor.set(e,t,n,i)}function Lv(r,e,t){const n=new Float32Array($i),i=new C(0,1,0);return new At({name:"SphericalGaussianBlur",defines:{n:$i,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Kc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Jt,depthTest:!1,depthWrite:!1})}function ch(){return new At({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Kc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Jt,depthTest:!1,depthWrite:!1})}function uh(){return new At({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Kc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Jt,depthTest:!1,depthWrite:!1})}function Kc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Uv(r){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===io||l===Vl,u=l===jr||l===qr;if(c||u){let h=e.get(o);const d=h!==void 0?h.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return t===null&&(t=new oh(r)),h=c?t.fromEquirectangular(o,h):t.fromCubemap(o,h),h.texture.pmremVersion=o.pmremVersion,e.set(o,h),h.texture;if(h!==void 0)return h.texture;{const f=o.image;return c&&f&&f.height>0||u&&f&&i(f)?(t===null&&(t=new oh(r)),h=c?t.fromEquirectangular(o):t.fromCubemap(o),h.texture.pmremVersion=o.pmremVersion,e.set(o,h),o.addEventListener("dispose",s),h.texture):null}}}return o}function i(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function Nv(r){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const i=t(n);return i===null&&xs("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Fv(r,e,t,n){const i={},s=new WeakMap;function a(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const p in d.attributes)e.remove(d.attributes[p]);for(const p in d.morphAttributes){const v=d.morphAttributes[p];for(let g=0,m=v.length;g<m;g++)e.remove(v[g])}d.removeEventListener("dispose",a),delete i[d.id];const f=s.get(d);f&&(e.remove(f),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(h,d){return i[d.id]===!0||(d.addEventListener("dispose",a),i[d.id]=!0,t.memory.geometries++),d}function l(h){const d=h.attributes;for(const p in d)e.update(d[p],r.ARRAY_BUFFER);const f=h.morphAttributes;for(const p in f){const v=f[p];for(let g=0,m=v.length;g<m;g++)e.update(v[g],r.ARRAY_BUFFER)}}function c(h){const d=[],f=h.index,p=h.attributes.position;let v=0;if(f!==null){const S=f.array;v=f.version;for(let y=0,x=S.length;y<x;y+=3){const P=S[y+0],R=S[y+1],A=S[y+2];d.push(P,R,R,A,A,P)}}else if(p!==void 0){const S=p.array;v=p.version;for(let y=0,x=S.length/3-1;y<x;y+=3){const P=y+0,R=y+1,A=y+2;d.push(P,R,R,A,A,P)}}else return;const g=new(Qd(d)?nf:qc)(d,1);g.version=v;const m=s.get(h);m&&e.remove(m),s.set(h,g)}function u(h){const d=s.get(h);if(d){const f=h.index;f!==null&&d.version<f.version&&c(h)}else c(h);return s.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function Ov(r,e,t){let n;function i(d){n=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,f){r.drawElements(n,f,s,d*a),t.update(f,n,1)}function c(d,f,p){p!==0&&(r.drawElementsInstanced(n,f,s,d*a,p),t.update(f,n,p))}function u(d,f,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,d,0,p);let g=0;for(let m=0;m<p;m++)g+=f[m];t.update(g,n,1)}function h(d,f,p,v){if(p===0)return;const g=e.get("WEBGL_multi_draw");if(g===null)for(let m=0;m<d.length;m++)c(d[m]/a,f[m],v[m]);else{g.multiDrawElementsInstancedWEBGL(n,f,0,s,d,0,v,0,p);let m=0;for(let S=0;S<p;S++)m+=f[S]*v[S];t.update(m,n,1)}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Bv(r){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case r.TRIANGLES:t.triangles+=o*(s/3);break;case r.LINES:t.lines+=o*(s/2);break;case r.LINE_STRIP:t.lines+=o*(s-1);break;case r.LINE_LOOP:t.lines+=o*s;break;case r.POINTS:t.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function kv(r,e,t){const n=new WeakMap,i=new rt;function s(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(o);if(d===void 0||d.count!==h){let _=function(){I.dispose(),n.delete(o),o.removeEventListener("dispose",_)};var f=_;d!==void 0&&d.texture.dispose();const p=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,g=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],S=o.morphAttributes.normal||[],y=o.morphAttributes.color||[];let x=0;p===!0&&(x=1),v===!0&&(x=2),g===!0&&(x=3);let P=o.attributes.position.count*x,R=1;P>e.maxTextureSize&&(R=Math.ceil(P/e.maxTextureSize),P=e.maxTextureSize);const A=new Float32Array(P*R*4*h),I=new Xc(A,P,R,h);I.type=wn,I.needsUpdate=!0;const T=x*4;for(let M=0;M<h;M++){const L=m[M],U=S[M],N=y[M],F=P*R*4*M;for(let k=0;k<L.count;k++){const W=k*T;p===!0&&(i.fromBufferAttribute(L,k),A[F+W+0]=i.x,A[F+W+1]=i.y,A[F+W+2]=i.z,A[F+W+3]=0),v===!0&&(i.fromBufferAttribute(U,k),A[F+W+4]=i.x,A[F+W+5]=i.y,A[F+W+6]=i.z,A[F+W+7]=0),g===!0&&(i.fromBufferAttribute(N,k),A[F+W+8]=i.x,A[F+W+9]=i.y,A[F+W+10]=i.z,A[F+W+11]=N.itemSize===4?i.w:1)}}d={count:h,texture:I,size:new Ue(P,R)},n.set(o,d),o.addEventListener("dispose",_)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",a.morphTexture,t);else{let p=0;for(let g=0;g<c.length;g++)p+=c[g];const v=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(r,"morphTargetBaseInfluence",v),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:s}}function zv(r,e,t,n){let i=new WeakMap;function s(l){const c=n.render.frame,u=l.geometry,h=e.get(l,u);if(i.get(h)!==c&&(e.update(h),i.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(t.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,r.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;i.get(d)!==c&&(d.update(),i.set(d,c))}return h}function a(){i=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:a}}class Zc extends Pt{constructor(e,t,n,i,s,a,o,l,c,u=zr){if(u!==zr&&u!==nr)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===zr&&(n=er),n===void 0&&u===nr&&(n=tr),super(null,i,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o!==void 0?o:kt,this.minFilter=l!==void 0?l:kt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const lf=new Pt,hh=new Zc(1,1),cf=new Xc,uf=new Am,hf=new af,dh=[],fh=[],ph=new Float32Array(16),mh=new Float32Array(9),gh=new Float32Array(4);function Qr(r,e,t){const n=r[0];if(n<=0||n>0)return r;const i=e*t;let s=dh[i];if(s===void 0&&(s=new Float32Array(i),dh[i]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,r[a].toArray(s,o)}return s}function zt(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function Vt(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function To(r,e){let t=fh[e];t===void 0&&(t=new Int32Array(e),fh[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function Vv(r,e){const t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function Hv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zt(t,e))return;r.uniform2fv(this.addr,e),Vt(t,e)}}function Gv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(zt(t,e))return;r.uniform3fv(this.addr,e),Vt(t,e)}}function Wv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zt(t,e))return;r.uniform4fv(this.addr,e),Vt(t,e)}}function Xv(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(zt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),Vt(t,e)}else{if(zt(t,n))return;gh.set(n),r.uniformMatrix2fv(this.addr,!1,gh),Vt(t,n)}}function jv(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(zt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),Vt(t,e)}else{if(zt(t,n))return;mh.set(n),r.uniformMatrix3fv(this.addr,!1,mh),Vt(t,n)}}function qv(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(zt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),Vt(t,e)}else{if(zt(t,n))return;ph.set(n),r.uniformMatrix4fv(this.addr,!1,ph),Vt(t,n)}}function Yv(r,e){const t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function Kv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zt(t,e))return;r.uniform2iv(this.addr,e),Vt(t,e)}}function Zv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(zt(t,e))return;r.uniform3iv(this.addr,e),Vt(t,e)}}function $v(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zt(t,e))return;r.uniform4iv(this.addr,e),Vt(t,e)}}function Jv(r,e){const t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function Qv(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(zt(t,e))return;r.uniform2uiv(this.addr,e),Vt(t,e)}}function ex(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(zt(t,e))return;r.uniform3uiv(this.addr,e),Vt(t,e)}}function tx(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(zt(t,e))return;r.uniform4uiv(this.addr,e),Vt(t,e)}}function nx(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(hh.compareFunction=Jd,s=hh):s=lf,t.setTexture2D(e||s,i)}function ix(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||uf,i)}function rx(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||hf,i)}function sx(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||cf,i)}function ax(r){switch(r){case 5126:return Vv;case 35664:return Hv;case 35665:return Gv;case 35666:return Wv;case 35674:return Xv;case 35675:return jv;case 35676:return qv;case 5124:case 35670:return Yv;case 35667:case 35671:return Kv;case 35668:case 35672:return Zv;case 35669:case 35673:return $v;case 5125:return Jv;case 36294:return Qv;case 36295:return ex;case 36296:return tx;case 35678:case 36198:case 36298:case 36306:case 35682:return nx;case 35679:case 36299:case 36307:return ix;case 35680:case 36300:case 36308:case 36293:return rx;case 36289:case 36303:case 36311:case 36292:return sx}}function ox(r,e){r.uniform1fv(this.addr,e)}function lx(r,e){const t=Qr(e,this.size,2);r.uniform2fv(this.addr,t)}function cx(r,e){const t=Qr(e,this.size,3);r.uniform3fv(this.addr,t)}function ux(r,e){const t=Qr(e,this.size,4);r.uniform4fv(this.addr,t)}function hx(r,e){const t=Qr(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function dx(r,e){const t=Qr(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function fx(r,e){const t=Qr(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function px(r,e){r.uniform1iv(this.addr,e)}function mx(r,e){r.uniform2iv(this.addr,e)}function gx(r,e){r.uniform3iv(this.addr,e)}function vx(r,e){r.uniform4iv(this.addr,e)}function xx(r,e){r.uniform1uiv(this.addr,e)}function _x(r,e){r.uniform2uiv(this.addr,e)}function yx(r,e){r.uniform3uiv(this.addr,e)}function Mx(r,e){r.uniform4uiv(this.addr,e)}function Sx(r,e,t){const n=this.cache,i=e.length,s=To(t,i);zt(n,s)||(r.uniform1iv(this.addr,s),Vt(n,s));for(let a=0;a!==i;++a)t.setTexture2D(e[a]||lf,s[a])}function bx(r,e,t){const n=this.cache,i=e.length,s=To(t,i);zt(n,s)||(r.uniform1iv(this.addr,s),Vt(n,s));for(let a=0;a!==i;++a)t.setTexture3D(e[a]||uf,s[a])}function Tx(r,e,t){const n=this.cache,i=e.length,s=To(t,i);zt(n,s)||(r.uniform1iv(this.addr,s),Vt(n,s));for(let a=0;a!==i;++a)t.setTextureCube(e[a]||hf,s[a])}function Ex(r,e,t){const n=this.cache,i=e.length,s=To(t,i);zt(n,s)||(r.uniform1iv(this.addr,s),Vt(n,s));for(let a=0;a!==i;++a)t.setTexture2DArray(e[a]||cf,s[a])}function wx(r){switch(r){case 5126:return ox;case 35664:return lx;case 35665:return cx;case 35666:return ux;case 35674:return hx;case 35675:return dx;case 35676:return fx;case 5124:case 35670:return px;case 35667:case 35671:return mx;case 35668:case 35672:return gx;case 35669:case 35673:return vx;case 5125:return xx;case 36294:return _x;case 36295:return yx;case 36296:return Mx;case 35678:case 36198:case 36298:case 36306:case 35682:return Sx;case 35679:case 36299:case 36307:return bx;case 35680:case 36300:case 36308:case 36293:return Tx;case 36289:case 36303:case 36311:case 36292:return Ex}}class Ax{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=ax(t.type)}}class Cx{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=wx(t.type)}}class Rx{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let s=0,a=i.length;s!==a;++s){const o=i[s];o.setValue(e,t[o.id],n)}}}const sl=/(\w+)(\])?(\[|\.)?/g;function vh(r,e){r.seq.push(e),r.map[e.id]=e}function Px(r,e,t){const n=r.name,i=n.length;for(sl.lastIndex=0;;){const s=sl.exec(n),a=sl.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){vh(t,c===void 0?new Ax(o,r,e):new Cx(o,r,e));break}else{let h=t.map[o];h===void 0&&(h=new Rx(o),vh(t,h)),t=h}}}class eo{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=e.getActiveUniform(t,i),a=e.getUniformLocation(t,s.name);Px(s,a,this)}}setValue(e,t,n,i){const s=this.map[t];s!==void 0&&s.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,s=e.length;i!==s;++i){const a=e[i];a.id in t&&n.push(a)}return n}}function xh(r,e,t){const n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}const Ix=37297;let Dx=0;function Lx(r,e){const t=r.split(`
`),n=[],i=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=i;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const _h=new qe;function Ux(r){Xe._getMatrix(_h,Xe.workingColorSpace,r);const e=`mat3( ${_h.elements.map(t=>t.toFixed(4))} )`;switch(Xe.getTransfer(r)){case So:return[e,"LinearTransferOETF"];case gt:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function yh(r,e,t){const n=r.getShaderParameter(e,r.COMPILE_STATUS),i=r.getShaderInfoLog(e).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const a=parseInt(s[1]);return t.toUpperCase()+`

`+i+`

`+Lx(r.getShaderSource(e),a)}else return i}function Nx(r,e){const t=Ux(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Fx(r,e){let t;switch(e){case Ld:t="Linear";break;case Ud:t="Reinhard";break;case Nd:t="Cineon";break;case Fc:t="ACESFilmic";break;case Fd:t="AgX";break;case Od:t="Neutral";break;case Hp:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Ea=new C;function Ox(){Xe.getLuminanceCoefficients(Ea);const r=Ea.x.toFixed(4),e=Ea.y.toFixed(4),t=Ea.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Bx(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(_s).join(`
`)}function kx(r){const e=[];for(const t in r){const n=r[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function zx(r,e){const t={},n=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(e,i),a=s.name;let o=1;s.type===r.FLOAT_MAT2&&(o=2),s.type===r.FLOAT_MAT3&&(o=3),s.type===r.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:r.getAttribLocation(e,a),locationSize:o}}return t}function _s(r){return r!==""}function Mh(r,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Sh(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Vx=/^[ \t]*#include +<([\w\d./]+)>/gm;function gc(r){return r.replace(Vx,Gx)}const Hx=new Map;function Gx(r,e){let t=$e[e];if(t===void 0){const n=Hx.get(e);if(n!==void 0)t=$e[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return gc(t)}const Wx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bh(r){return r.replace(Wx,Xx)}function Xx(r,e,t,n){let i="";for(let s=parseInt(e);s<parseInt(t);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function Th(r){let e=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function jx(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Cd?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===Rd?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===ui&&(e="SHADOWMAP_TYPE_VSM"),e}function qx(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case jr:case qr:e="ENVMAP_TYPE_CUBE";break;case yo:e="ENVMAP_TYPE_CUBE_UV";break}return e}function Yx(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case qr:e="ENVMAP_MODE_REFRACTION";break}return e}function Kx(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case _o:e="ENVMAP_BLENDING_MULTIPLY";break;case zp:e="ENVMAP_BLENDING_MIX";break;case Vp:e="ENVMAP_BLENDING_ADD";break}return e}function Zx(r){const e=r.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function $x(r,e,t,n){const i=r.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=jx(t),c=qx(t),u=Yx(t),h=Kx(t),d=Zx(t),f=Bx(t),p=kx(s),v=i.createProgram();let g,m,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(_s).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(_s).join(`
`),m.length>0&&(m+=`
`)):(g=[Th(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(_s).join(`
`),m=[Th(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ui?"#define TONE_MAPPING":"",t.toneMapping!==Ui?$e.tonemapping_pars_fragment:"",t.toneMapping!==Ui?Fx("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",$e.colorspace_pars_fragment,Nx("linearToOutputTexel",t.outputColorSpace),Ox(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(_s).join(`
`)),a=gc(a),a=Mh(a,t),a=Sh(a,t),o=gc(o),o=Mh(o,t),o=Sh(o,t),a=bh(a),o=bh(o),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",t.glslVersion===Fu?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Fu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=S+g+a,x=S+m+o,P=xh(i,i.VERTEX_SHADER,y),R=xh(i,i.FRAGMENT_SHADER,x);i.attachShader(v,P),i.attachShader(v,R),t.index0AttributeName!==void 0?i.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(v,0,"position"),i.linkProgram(v);function A(M){if(r.debug.checkShaderErrors){const L=i.getProgramInfoLog(v).trim(),U=i.getShaderInfoLog(P).trim(),N=i.getShaderInfoLog(R).trim();let F=!0,k=!0;if(i.getProgramParameter(v,i.LINK_STATUS)===!1)if(F=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,v,P,R);else{const W=yh(i,P,"vertex"),V=yh(i,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(v,i.VALIDATE_STATUS)+`

Material Name: `+M.name+`
Material Type: `+M.type+`

Program Info Log: `+L+`
`+W+`
`+V)}else L!==""?console.warn("THREE.WebGLProgram: Program Info Log:",L):(U===""||N==="")&&(k=!1);k&&(M.diagnostics={runnable:F,programLog:L,vertexShader:{log:U,prefix:g},fragmentShader:{log:N,prefix:m}})}i.deleteShader(P),i.deleteShader(R),I=new eo(i,v),T=zx(i,v)}let I;this.getUniforms=function(){return I===void 0&&A(this),I};let T;this.getAttributes=function(){return T===void 0&&A(this),T};let _=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=i.getProgramParameter(v,Ix)),_},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Dx++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=P,this.fragmentShader=R,this}let Jx=0;class Qx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new e_(e),t.set(e,n)),n}}class e_{constructor(e){this.id=Jx++,this.code=e,this.usedTimes=0}}function t_(r,e,t,n,i,s,a){const o=new jc,l=new Qx,c=new Set,u=[],h=i.logarithmicDepthBuffer,d=i.vertexTextures;let f=i.precision;const p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(T){return c.add(T),T===0?"uv":`uv${T}`}function g(T,_,M,L,U){const N=L.fog,F=U.geometry,k=T.isMeshStandardMaterial?L.environment:null,W=(T.isMeshStandardMaterial?t:e).get(T.envMap||k),V=W&&W.mapping===yo?W.image.height:null,K=p[T.type];T.precision!==null&&(f=i.getMaxPrecision(T.precision),f!==T.precision&&console.warn("THREE.WebGLProgram.getParameters:",T.precision,"not supported, using",f,"instead."));const $=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,J=$!==void 0?$.length:0;let oe=0;F.morphAttributes.position!==void 0&&(oe=1),F.morphAttributes.normal!==void 0&&(oe=2),F.morphAttributes.color!==void 0&&(oe=3);let Re,j,ne,ue;if(K){const mt=Gn[K];Re=mt.vertexShader,j=mt.fragmentShader}else Re=T.vertexShader,j=T.fragmentShader,l.update(T),ne=l.getVertexShaderID(T),ue=l.getFragmentShaderID(T);const ee=r.getRenderTarget(),ve=r.state.buffers.depth.getReversed(),Te=U.isInstancedMesh===!0,X=U.isBatchedMesh===!0,Le=!!T.map,Q=!!T.matcap,ye=!!W,D=!!T.aoMap,_e=!!T.lightMap,fe=!!T.bumpMap,ae=!!T.normalMap,le=!!T.displacementMap,Se=!!T.emissiveMap,de=!!T.metalnessMap,w=!!T.roughnessMap,b=T.anisotropy>0,G=T.clearcoat>0,ie=T.dispersion>0,re=T.iridescence>0,te=T.sheen>0,Pe=T.transmission>0,ge=b&&!!T.anisotropyMap,be=G&&!!T.clearcoatMap,Ye=G&&!!T.clearcoatNormalMap,ce=G&&!!T.clearcoatRoughnessMap,Ie=re&&!!T.iridescenceMap,He=re&&!!T.iridescenceThicknessMap,Ge=te&&!!T.sheenColorMap,De=te&&!!T.sheenRoughnessMap,it=!!T.specularMap,We=!!T.specularColorMap,ct=!!T.specularIntensityMap,B=Pe&&!!T.transmissionMap,xe=Pe&&!!T.thicknessMap,Z=!!T.gradientMap,se=!!T.alphaMap,Ce=T.alphaTest>0,Ee=!!T.alphaHash,Ke=!!T.extensions;let Tt=Ui;T.toneMapped&&(ee===null||ee.isXRRenderTarget===!0)&&(Tt=r.toneMapping);const Kt={shaderID:K,shaderType:T.type,shaderName:T.name,vertexShader:Re,fragmentShader:j,defines:T.defines,customVertexShaderID:ne,customFragmentShaderID:ue,isRawShaderMaterial:T.isRawShaderMaterial===!0,glslVersion:T.glslVersion,precision:f,batching:X,batchingColor:X&&U._colorsTexture!==null,instancing:Te,instancingColor:Te&&U.instanceColor!==null,instancingMorph:Te&&U.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ee===null?r.outputColorSpace:ee.isXRRenderTarget===!0?ee.texture.colorSpace:nn,alphaToCoverage:!!T.alphaToCoverage,map:Le,matcap:Q,envMap:ye,envMapMode:ye&&W.mapping,envMapCubeUVHeight:V,aoMap:D,lightMap:_e,bumpMap:fe,normalMap:ae,displacementMap:d&&le,emissiveMap:Se,normalMapObjectSpace:ae&&T.normalMapType===Kp,normalMapTangentSpace:ae&&T.normalMapType===Xs,metalnessMap:de,roughnessMap:w,anisotropy:b,anisotropyMap:ge,clearcoat:G,clearcoatMap:be,clearcoatNormalMap:Ye,clearcoatRoughnessMap:ce,dispersion:ie,iridescence:re,iridescenceMap:Ie,iridescenceThicknessMap:He,sheen:te,sheenColorMap:Ge,sheenRoughnessMap:De,specularMap:it,specularColorMap:We,specularIntensityMap:ct,transmission:Pe,transmissionMap:B,thicknessMap:xe,gradientMap:Z,opaque:T.transparent===!1&&T.blending===kr&&T.alphaToCoverage===!1,alphaMap:se,alphaTest:Ce,alphaHash:Ee,combine:T.combine,mapUv:Le&&v(T.map.channel),aoMapUv:D&&v(T.aoMap.channel),lightMapUv:_e&&v(T.lightMap.channel),bumpMapUv:fe&&v(T.bumpMap.channel),normalMapUv:ae&&v(T.normalMap.channel),displacementMapUv:le&&v(T.displacementMap.channel),emissiveMapUv:Se&&v(T.emissiveMap.channel),metalnessMapUv:de&&v(T.metalnessMap.channel),roughnessMapUv:w&&v(T.roughnessMap.channel),anisotropyMapUv:ge&&v(T.anisotropyMap.channel),clearcoatMapUv:be&&v(T.clearcoatMap.channel),clearcoatNormalMapUv:Ye&&v(T.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ce&&v(T.clearcoatRoughnessMap.channel),iridescenceMapUv:Ie&&v(T.iridescenceMap.channel),iridescenceThicknessMapUv:He&&v(T.iridescenceThicknessMap.channel),sheenColorMapUv:Ge&&v(T.sheenColorMap.channel),sheenRoughnessMapUv:De&&v(T.sheenRoughnessMap.channel),specularMapUv:it&&v(T.specularMap.channel),specularColorMapUv:We&&v(T.specularColorMap.channel),specularIntensityMapUv:ct&&v(T.specularIntensityMap.channel),transmissionMapUv:B&&v(T.transmissionMap.channel),thicknessMapUv:xe&&v(T.thicknessMap.channel),alphaMapUv:se&&v(T.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(ae||b),vertexColors:T.vertexColors,vertexAlphas:T.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!F.attributes.uv&&(Le||se),fog:!!N,useFog:T.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:T.flatShading===!0,sizeAttenuation:T.sizeAttenuation===!0,logarithmicDepthBuffer:h,reverseDepthBuffer:ve,skinning:U.isSkinnedMesh===!0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:oe,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:T.dithering,shadowMapEnabled:r.shadowMap.enabled&&M.length>0,shadowMapType:r.shadowMap.type,toneMapping:Tt,decodeVideoTexture:Le&&T.map.isVideoTexture===!0&&Xe.getTransfer(T.map.colorSpace)===gt,decodeVideoTextureEmissive:Se&&T.emissiveMap.isVideoTexture===!0&&Xe.getTransfer(T.emissiveMap.colorSpace)===gt,premultipliedAlpha:T.premultipliedAlpha,doubleSided:T.side===bn,flipSided:T.side===un,useDepthPacking:T.depthPacking>=0,depthPacking:T.depthPacking||0,index0AttributeName:T.index0AttributeName,extensionClipCullDistance:Ke&&T.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ke&&T.extensions.multiDraw===!0||X)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:T.customProgramCacheKey()};return Kt.vertexUv1s=c.has(1),Kt.vertexUv2s=c.has(2),Kt.vertexUv3s=c.has(3),c.clear(),Kt}function m(T){const _=[];if(T.shaderID?_.push(T.shaderID):(_.push(T.customVertexShaderID),_.push(T.customFragmentShaderID)),T.defines!==void 0)for(const M in T.defines)_.push(M),_.push(T.defines[M]);return T.isRawShaderMaterial===!1&&(S(_,T),y(_,T),_.push(r.outputColorSpace)),_.push(T.customProgramCacheKey),_.join()}function S(T,_){T.push(_.precision),T.push(_.outputColorSpace),T.push(_.envMapMode),T.push(_.envMapCubeUVHeight),T.push(_.mapUv),T.push(_.alphaMapUv),T.push(_.lightMapUv),T.push(_.aoMapUv),T.push(_.bumpMapUv),T.push(_.normalMapUv),T.push(_.displacementMapUv),T.push(_.emissiveMapUv),T.push(_.metalnessMapUv),T.push(_.roughnessMapUv),T.push(_.anisotropyMapUv),T.push(_.clearcoatMapUv),T.push(_.clearcoatNormalMapUv),T.push(_.clearcoatRoughnessMapUv),T.push(_.iridescenceMapUv),T.push(_.iridescenceThicknessMapUv),T.push(_.sheenColorMapUv),T.push(_.sheenRoughnessMapUv),T.push(_.specularMapUv),T.push(_.specularColorMapUv),T.push(_.specularIntensityMapUv),T.push(_.transmissionMapUv),T.push(_.thicknessMapUv),T.push(_.combine),T.push(_.fogExp2),T.push(_.sizeAttenuation),T.push(_.morphTargetsCount),T.push(_.morphAttributeCount),T.push(_.numDirLights),T.push(_.numPointLights),T.push(_.numSpotLights),T.push(_.numSpotLightMaps),T.push(_.numHemiLights),T.push(_.numRectAreaLights),T.push(_.numDirLightShadows),T.push(_.numPointLightShadows),T.push(_.numSpotLightShadows),T.push(_.numSpotLightShadowsWithMaps),T.push(_.numLightProbes),T.push(_.shadowMapType),T.push(_.toneMapping),T.push(_.numClippingPlanes),T.push(_.numClipIntersection),T.push(_.depthPacking)}function y(T,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),T.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reverseDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),T.push(o.mask)}function x(T){const _=p[T.type];let M;if(_){const L=Gn[_];M=Yn.clone(L.uniforms)}else M=T.uniforms;return M}function P(T,_){let M;for(let L=0,U=u.length;L<U;L++){const N=u[L];if(N.cacheKey===_){M=N,++M.usedTimes;break}}return M===void 0&&(M=new $x(r,_,T,s),u.push(M)),M}function R(T){if(--T.usedTimes===0){const _=u.indexOf(T);u[_]=u[u.length-1],u.pop(),T.destroy()}}function A(T){l.remove(T)}function I(){l.dispose()}return{getParameters:g,getProgramCacheKey:m,getUniforms:x,acquireProgram:P,releaseProgram:R,releaseShaderCache:A,programs:u,dispose:I}}function n_(){let r=new WeakMap;function e(a){return r.has(a)}function t(a){let o=r.get(a);return o===void 0&&(o={},r.set(a,o)),o}function n(a){r.delete(a)}function i(a,o,l){r.get(a)[o]=l}function s(){r=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:s}}function i_(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function Eh(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function wh(){const r=[];let e=0;const t=[],n=[],i=[];function s(){e=0,t.length=0,n.length=0,i.length=0}function a(h,d,f,p,v,g){let m=r[e];return m===void 0?(m={id:h.id,object:h,geometry:d,material:f,groupOrder:p,renderOrder:h.renderOrder,z:v,group:g},r[e]=m):(m.id=h.id,m.object=h,m.geometry=d,m.material=f,m.groupOrder=p,m.renderOrder=h.renderOrder,m.z=v,m.group=g),e++,m}function o(h,d,f,p,v,g){const m=a(h,d,f,p,v,g);f.transmission>0?n.push(m):f.transparent===!0?i.push(m):t.push(m)}function l(h,d,f,p,v,g){const m=a(h,d,f,p,v,g);f.transmission>0?n.unshift(m):f.transparent===!0?i.unshift(m):t.unshift(m)}function c(h,d){t.length>1&&t.sort(h||i_),n.length>1&&n.sort(d||Eh),i.length>1&&i.sort(d||Eh)}function u(){for(let h=e,d=r.length;h<d;h++){const f=r[h];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:i,init:s,push:o,unshift:l,finish:u,sort:c}}function r_(){let r=new WeakMap;function e(n,i){const s=r.get(n);let a;return s===void 0?(a=new wh,r.set(n,[a])):i>=s.length?(a=new wh,s.push(a)):a=s[i],a}function t(){r=new WeakMap}return{get:e,dispose:t}}function s_(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new C,color:new Ae};break;case"SpotLight":t={position:new C,direction:new C,color:new Ae,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new C,color:new Ae,distance:0,decay:0};break;case"HemisphereLight":t={direction:new C,skyColor:new Ae,groundColor:new Ae};break;case"RectAreaLight":t={color:new Ae,position:new C,halfWidth:new C,halfHeight:new C};break}return r[e.id]=t,t}}}function a_(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ue};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ue};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ue,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}let o_=0;function l_(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function c_(r){const e=new s_,t=a_(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new C);const i=new C,s=new me,a=new me;function o(c){let u=0,h=0,d=0;for(let T=0;T<9;T++)n.probe[T].set(0,0,0);let f=0,p=0,v=0,g=0,m=0,S=0,y=0,x=0,P=0,R=0,A=0;c.sort(l_);for(let T=0,_=c.length;T<_;T++){const M=c[T],L=M.color,U=M.intensity,N=M.distance,F=M.shadow&&M.shadow.map?M.shadow.map.texture:null;if(M.isAmbientLight)u+=L.r*U,h+=L.g*U,d+=L.b*U;else if(M.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(M.sh.coefficients[k],U);A++}else if(M.isDirectionalLight){const k=e.get(M);if(k.color.copy(M.color).multiplyScalar(M.intensity),M.castShadow){const W=M.shadow,V=t.get(M);V.shadowIntensity=W.intensity,V.shadowBias=W.bias,V.shadowNormalBias=W.normalBias,V.shadowRadius=W.radius,V.shadowMapSize=W.mapSize,n.directionalShadow[f]=V,n.directionalShadowMap[f]=F,n.directionalShadowMatrix[f]=M.shadow.matrix,S++}n.directional[f]=k,f++}else if(M.isSpotLight){const k=e.get(M);k.position.setFromMatrixPosition(M.matrixWorld),k.color.copy(L).multiplyScalar(U),k.distance=N,k.coneCos=Math.cos(M.angle),k.penumbraCos=Math.cos(M.angle*(1-M.penumbra)),k.decay=M.decay,n.spot[v]=k;const W=M.shadow;if(M.map&&(n.spotLightMap[P]=M.map,P++,W.updateMatrices(M),M.castShadow&&R++),n.spotLightMatrix[v]=W.matrix,M.castShadow){const V=t.get(M);V.shadowIntensity=W.intensity,V.shadowBias=W.bias,V.shadowNormalBias=W.normalBias,V.shadowRadius=W.radius,V.shadowMapSize=W.mapSize,n.spotShadow[v]=V,n.spotShadowMap[v]=F,x++}v++}else if(M.isRectAreaLight){const k=e.get(M);k.color.copy(L).multiplyScalar(U),k.halfWidth.set(M.width*.5,0,0),k.halfHeight.set(0,M.height*.5,0),n.rectArea[g]=k,g++}else if(M.isPointLight){const k=e.get(M);if(k.color.copy(M.color).multiplyScalar(M.intensity),k.distance=M.distance,k.decay=M.decay,M.castShadow){const W=M.shadow,V=t.get(M);V.shadowIntensity=W.intensity,V.shadowBias=W.bias,V.shadowNormalBias=W.normalBias,V.shadowRadius=W.radius,V.shadowMapSize=W.mapSize,V.shadowCameraNear=W.camera.near,V.shadowCameraFar=W.camera.far,n.pointShadow[p]=V,n.pointShadowMap[p]=F,n.pointShadowMatrix[p]=M.shadow.matrix,y++}n.point[p]=k,p++}else if(M.isHemisphereLight){const k=e.get(M);k.skyColor.copy(M.color).multiplyScalar(U),k.groundColor.copy(M.groundColor).multiplyScalar(U),n.hemi[m]=k,m++}}g>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Me.LTC_FLOAT_1,n.rectAreaLTC2=Me.LTC_FLOAT_2):(n.rectAreaLTC1=Me.LTC_HALF_1,n.rectAreaLTC2=Me.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const I=n.hash;(I.directionalLength!==f||I.pointLength!==p||I.spotLength!==v||I.rectAreaLength!==g||I.hemiLength!==m||I.numDirectionalShadows!==S||I.numPointShadows!==y||I.numSpotShadows!==x||I.numSpotMaps!==P||I.numLightProbes!==A)&&(n.directional.length=f,n.spot.length=v,n.rectArea.length=g,n.point.length=p,n.hemi.length=m,n.directionalShadow.length=S,n.directionalShadowMap.length=S,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=S,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=x+P-R,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=A,I.directionalLength=f,I.pointLength=p,I.spotLength=v,I.rectAreaLength=g,I.hemiLength=m,I.numDirectionalShadows=S,I.numPointShadows=y,I.numSpotShadows=x,I.numSpotMaps=P,I.numLightProbes=A,n.version=o_++)}function l(c,u){let h=0,d=0,f=0,p=0,v=0;const g=u.matrixWorldInverse;for(let m=0,S=c.length;m<S;m++){const y=c[m];if(y.isDirectionalLight){const x=n.directional[h];x.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(g),h++}else if(y.isSpotLight){const x=n.spot[f];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),x.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(g),f++}else if(y.isRectAreaLight){const x=n.rectArea[p];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),a.identity(),s.copy(y.matrixWorld),s.premultiply(g),a.extractRotation(s),x.halfWidth.set(y.width*.5,0,0),x.halfHeight.set(0,y.height*.5,0),x.halfWidth.applyMatrix4(a),x.halfHeight.applyMatrix4(a),p++}else if(y.isPointLight){const x=n.point[d];x.position.setFromMatrixPosition(y.matrixWorld),x.position.applyMatrix4(g),d++}else if(y.isHemisphereLight){const x=n.hemi[v];x.direction.setFromMatrixPosition(y.matrixWorld),x.direction.transformDirection(g),v++}}}return{setup:o,setupView:l,state:n}}function Ah(r){const e=new c_(r),t=[],n=[];function i(u){c.camera=u,t.length=0,n.length=0}function s(u){t.push(u)}function a(u){n.push(u)}function o(){e.setup(t)}function l(u){e.setupView(t,u)}const c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function u_(r){let e=new WeakMap;function t(i,s=0){const a=e.get(i);let o;return a===void 0?(o=new Ah(r),e.set(i,[o])):s>=a.length?(o=new Ah(r),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}class df extends dn{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Yp,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class h_ extends dn{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const d_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,f_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function p_(r,e,t){let n=new Yc;const i=new Ue,s=new Ue,a=new rt,o=new df({depthPacking:$d}),l=new h_,c={},u=t.maxTextureSize,h={[_i]:un,[un]:_i,[bn]:bn},d=new At({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ue},radius:{value:4}},vertexShader:d_,fragmentShader:f_}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const p=new It;p.setAttribute("position",new wt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Ft(p,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Cd;let m=this.type;this.render=function(R,A,I){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;const T=r.getRenderTarget(),_=r.getActiveCubeFace(),M=r.getActiveMipmapLevel(),L=r.state;L.setBlending(Jt),L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);const U=m!==ui&&this.type===ui,N=m===ui&&this.type!==ui;for(let F=0,k=R.length;F<k;F++){const W=R[F],V=W.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",W,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;i.copy(V.mapSize);const K=V.getFrameExtents();if(i.multiply(K),s.copy(V.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(s.x=Math.floor(u/K.x),i.x=s.x*K.x,V.mapSize.x=s.x),i.y>u&&(s.y=Math.floor(u/K.y),i.y=s.y*K.y,V.mapSize.y=s.y)),V.map===null||U===!0||N===!0){const J=this.type!==ui?{minFilter:kt,magFilter:kt}:{};V.map!==null&&V.map.dispose(),V.map=new hn(i.x,i.y,J),V.map.texture.name=W.name+".shadowMap",V.camera.updateProjectionMatrix()}r.setRenderTarget(V.map),r.clear();const $=V.getViewportCount();for(let J=0;J<$;J++){const oe=V.getViewport(J);a.set(s.x*oe.x,s.y*oe.y,s.x*oe.z,s.y*oe.w),L.viewport(a),V.updateMatrices(W,J),n=V.getFrustum(),x(A,I,V.camera,W,this.type)}V.isPointLightShadow!==!0&&this.type===ui&&S(V,I),V.needsUpdate=!1}m=this.type,g.needsUpdate=!1,r.setRenderTarget(T,_,M)};function S(R,A){const I=e.update(v);d.defines.VSM_SAMPLES!==R.blurSamples&&(d.defines.VSM_SAMPLES=R.blurSamples,f.defines.VSM_SAMPLES=R.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new hn(i.x,i.y)),d.uniforms.shadow_pass.value=R.map.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,r.setRenderTarget(R.mapPass),r.clear(),r.renderBufferDirect(A,null,I,d,v,null),f.uniforms.shadow_pass.value=R.mapPass.texture,f.uniforms.resolution.value=R.mapSize,f.uniforms.radius.value=R.radius,r.setRenderTarget(R.map),r.clear(),r.renderBufferDirect(A,null,I,f,v,null)}function y(R,A,I,T){let _=null;const M=I.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(M!==void 0)_=M;else if(_=I.isPointLight===!0?l:o,r.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const L=_.uuid,U=A.uuid;let N=c[L];N===void 0&&(N={},c[L]=N);let F=N[U];F===void 0&&(F=_.clone(),N[U]=F,A.addEventListener("dispose",P)),_=F}if(_.visible=A.visible,_.wireframe=A.wireframe,T===ui?_.side=A.shadowSide!==null?A.shadowSide:A.side:_.side=A.shadowSide!==null?A.shadowSide:h[A.side],_.alphaMap=A.alphaMap,_.alphaTest=A.alphaTest,_.map=A.map,_.clipShadows=A.clipShadows,_.clippingPlanes=A.clippingPlanes,_.clipIntersection=A.clipIntersection,_.displacementMap=A.displacementMap,_.displacementScale=A.displacementScale,_.displacementBias=A.displacementBias,_.wireframeLinewidth=A.wireframeLinewidth,_.linewidth=A.linewidth,I.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const L=r.properties.get(_);L.light=I}return _}function x(R,A,I,T,_){if(R.visible===!1)return;if(R.layers.test(A.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&_===ui)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,R.matrixWorld);const U=e.update(R),N=R.material;if(Array.isArray(N)){const F=U.groups;for(let k=0,W=F.length;k<W;k++){const V=F[k],K=N[V.materialIndex];if(K&&K.visible){const $=y(R,K,T,_);R.onBeforeShadow(r,R,A,I,U,$,V),r.renderBufferDirect(I,null,U,$,R,V),R.onAfterShadow(r,R,A,I,U,$,V)}}}else if(N.visible){const F=y(R,N,T,_);R.onBeforeShadow(r,R,A,I,U,F,null),r.renderBufferDirect(I,null,U,F,R,null),R.onAfterShadow(r,R,A,I,U,F,null)}}const L=R.children;for(let U=0,N=L.length;U<N;U++)x(L[U],A,I,T,_)}function P(R){R.target.removeEventListener("dispose",P);for(const I in c){const T=c[I],_=R.target.uuid;_ in T&&(T[_].dispose(),delete T[_])}}}const m_={[Ul]:Nl,[Fl]:kl,[Ol]:zl,[Xr]:Bl,[Nl]:Ul,[kl]:Fl,[zl]:Ol,[Bl]:Xr};function g_(r,e){function t(){let B=!1;const xe=new rt;let Z=null;const se=new rt(0,0,0,0);return{setMask:function(Ce){Z!==Ce&&!B&&(r.colorMask(Ce,Ce,Ce,Ce),Z=Ce)},setLocked:function(Ce){B=Ce},setClear:function(Ce,Ee,Ke,Tt,Kt){Kt===!0&&(Ce*=Tt,Ee*=Tt,Ke*=Tt),xe.set(Ce,Ee,Ke,Tt),se.equals(xe)===!1&&(r.clearColor(Ce,Ee,Ke,Tt),se.copy(xe))},reset:function(){B=!1,Z=null,se.set(-1,0,0,0)}}}function n(){let B=!1,xe=!1,Z=null,se=null,Ce=null;return{setReversed:function(Ee){if(xe!==Ee){const Ke=e.get("EXT_clip_control");xe?Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.ZERO_TO_ONE_EXT):Ke.clipControlEXT(Ke.LOWER_LEFT_EXT,Ke.NEGATIVE_ONE_TO_ONE_EXT);const Tt=Ce;Ce=null,this.setClear(Tt)}xe=Ee},getReversed:function(){return xe},setTest:function(Ee){Ee?ee(r.DEPTH_TEST):ve(r.DEPTH_TEST)},setMask:function(Ee){Z!==Ee&&!B&&(r.depthMask(Ee),Z=Ee)},setFunc:function(Ee){if(xe&&(Ee=m_[Ee]),se!==Ee){switch(Ee){case Ul:r.depthFunc(r.NEVER);break;case Nl:r.depthFunc(r.ALWAYS);break;case Fl:r.depthFunc(r.LESS);break;case Xr:r.depthFunc(r.LEQUAL);break;case Ol:r.depthFunc(r.EQUAL);break;case Bl:r.depthFunc(r.GEQUAL);break;case kl:r.depthFunc(r.GREATER);break;case zl:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}se=Ee}},setLocked:function(Ee){B=Ee},setClear:function(Ee){Ce!==Ee&&(xe&&(Ee=1-Ee),r.clearDepth(Ee),Ce=Ee)},reset:function(){B=!1,Z=null,se=null,Ce=null,xe=!1}}}function i(){let B=!1,xe=null,Z=null,se=null,Ce=null,Ee=null,Ke=null,Tt=null,Kt=null;return{setTest:function(mt){B||(mt?ee(r.STENCIL_TEST):ve(r.STENCIL_TEST))},setMask:function(mt){xe!==mt&&!B&&(r.stencilMask(mt),xe=mt)},setFunc:function(mt,Pn,ni){(Z!==mt||se!==Pn||Ce!==ni)&&(r.stencilFunc(mt,Pn,ni),Z=mt,se=Pn,Ce=ni)},setOp:function(mt,Pn,ni){(Ee!==mt||Ke!==Pn||Tt!==ni)&&(r.stencilOp(mt,Pn,ni),Ee=mt,Ke=Pn,Tt=ni)},setLocked:function(mt){B=mt},setClear:function(mt){Kt!==mt&&(r.clearStencil(mt),Kt=mt)},reset:function(){B=!1,xe=null,Z=null,se=null,Ce=null,Ee=null,Ke=null,Tt=null,Kt=null}}}const s=new t,a=new n,o=new i,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,f=[],p=null,v=!1,g=null,m=null,S=null,y=null,x=null,P=null,R=null,A=new Ae(0,0,0),I=0,T=!1,_=null,M=null,L=null,U=null,N=null;const F=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let k=!1,W=0;const V=r.getParameter(r.VERSION);V.indexOf("WebGL")!==-1?(W=parseFloat(/^WebGL (\d)/.exec(V)[1]),k=W>=1):V.indexOf("OpenGL ES")!==-1&&(W=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),k=W>=2);let K=null,$={};const J=r.getParameter(r.SCISSOR_BOX),oe=r.getParameter(r.VIEWPORT),Re=new rt().fromArray(J),j=new rt().fromArray(oe);function ne(B,xe,Z,se){const Ce=new Uint8Array(4),Ee=r.createTexture();r.bindTexture(B,Ee),r.texParameteri(B,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(B,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Ke=0;Ke<Z;Ke++)B===r.TEXTURE_3D||B===r.TEXTURE_2D_ARRAY?r.texImage3D(xe,0,r.RGBA,1,1,se,0,r.RGBA,r.UNSIGNED_BYTE,Ce):r.texImage2D(xe+Ke,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,Ce);return Ee}const ue={};ue[r.TEXTURE_2D]=ne(r.TEXTURE_2D,r.TEXTURE_2D,1),ue[r.TEXTURE_CUBE_MAP]=ne(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),ue[r.TEXTURE_2D_ARRAY]=ne(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),ue[r.TEXTURE_3D]=ne(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ee(r.DEPTH_TEST),a.setFunc(Xr),fe(!1),ae(Iu),ee(r.CULL_FACE),D(Jt);function ee(B){u[B]!==!0&&(r.enable(B),u[B]=!0)}function ve(B){u[B]!==!1&&(r.disable(B),u[B]=!1)}function Te(B,xe){return h[B]!==xe?(r.bindFramebuffer(B,xe),h[B]=xe,B===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=xe),B===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=xe),!0):!1}function X(B,xe){let Z=f,se=!1;if(B){Z=d.get(xe),Z===void 0&&(Z=[],d.set(xe,Z));const Ce=B.textures;if(Z.length!==Ce.length||Z[0]!==r.COLOR_ATTACHMENT0){for(let Ee=0,Ke=Ce.length;Ee<Ke;Ee++)Z[Ee]=r.COLOR_ATTACHMENT0+Ee;Z.length=Ce.length,se=!0}}else Z[0]!==r.BACK&&(Z[0]=r.BACK,se=!0);se&&r.drawBuffers(Z)}function Le(B){return p!==B?(r.useProgram(B),p=B,!0):!1}const Q={[pi]:r.FUNC_ADD,[wp]:r.FUNC_SUBTRACT,[Ap]:r.FUNC_REVERSE_SUBTRACT};Q[Cp]=r.MIN,Q[Rp]=r.MAX;const ye={[Il]:r.ZERO,[Pp]:r.ONE,[Ip]:r.SRC_COLOR,[Dl]:r.SRC_ALPHA,[Np]:r.SRC_ALPHA_SATURATE,[Dd]:r.DST_COLOR,[Id]:r.DST_ALPHA,[Dp]:r.ONE_MINUS_SRC_COLOR,[Ll]:r.ONE_MINUS_SRC_ALPHA,[Up]:r.ONE_MINUS_DST_COLOR,[Lp]:r.ONE_MINUS_DST_ALPHA,[Fp]:r.CONSTANT_COLOR,[Op]:r.ONE_MINUS_CONSTANT_COLOR,[Bp]:r.CONSTANT_ALPHA,[kp]:r.ONE_MINUS_CONSTANT_ALPHA};function D(B,xe,Z,se,Ce,Ee,Ke,Tt,Kt,mt){if(B===Jt){v===!0&&(ve(r.BLEND),v=!1);return}if(v===!1&&(ee(r.BLEND),v=!0),B!==Pd){if(B!==g||mt!==T){if((m!==pi||x!==pi)&&(r.blendEquation(r.FUNC_ADD),m=pi,x=pi),mt)switch(B){case kr:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Pl:r.blendFunc(r.ONE,r.ONE);break;case Du:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case Lu:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case kr:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Pl:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case Du:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case Lu:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}S=null,y=null,P=null,R=null,A.set(0,0,0),I=0,g=B,T=mt}return}Ce=Ce||xe,Ee=Ee||Z,Ke=Ke||se,(xe!==m||Ce!==x)&&(r.blendEquationSeparate(Q[xe],Q[Ce]),m=xe,x=Ce),(Z!==S||se!==y||Ee!==P||Ke!==R)&&(r.blendFuncSeparate(ye[Z],ye[se],ye[Ee],ye[Ke]),S=Z,y=se,P=Ee,R=Ke),(Tt.equals(A)===!1||Kt!==I)&&(r.blendColor(Tt.r,Tt.g,Tt.b,Kt),A.copy(Tt),I=Kt),g=B,T=!1}function _e(B,xe){B.side===bn?ve(r.CULL_FACE):ee(r.CULL_FACE);let Z=B.side===un;xe&&(Z=!Z),fe(Z),B.blending===kr&&B.transparent===!1?D(Jt):D(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),a.setFunc(B.depthFunc),a.setTest(B.depthTest),a.setMask(B.depthWrite),s.setMask(B.colorWrite);const se=B.stencilWrite;o.setTest(se),se&&(o.setMask(B.stencilWriteMask),o.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),o.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),Se(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?ee(r.SAMPLE_ALPHA_TO_COVERAGE):ve(r.SAMPLE_ALPHA_TO_COVERAGE)}function fe(B){_!==B&&(B?r.frontFace(r.CW):r.frontFace(r.CCW),_=B)}function ae(B){B!==Tp?(ee(r.CULL_FACE),B!==M&&(B===Iu?r.cullFace(r.BACK):B===Ep?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):ve(r.CULL_FACE),M=B}function le(B){B!==L&&(k&&r.lineWidth(B),L=B)}function Se(B,xe,Z){B?(ee(r.POLYGON_OFFSET_FILL),(U!==xe||N!==Z)&&(r.polygonOffset(xe,Z),U=xe,N=Z)):ve(r.POLYGON_OFFSET_FILL)}function de(B){B?ee(r.SCISSOR_TEST):ve(r.SCISSOR_TEST)}function w(B){B===void 0&&(B=r.TEXTURE0+F-1),K!==B&&(r.activeTexture(B),K=B)}function b(B,xe,Z){Z===void 0&&(K===null?Z=r.TEXTURE0+F-1:Z=K);let se=$[Z];se===void 0&&(se={type:void 0,texture:void 0},$[Z]=se),(se.type!==B||se.texture!==xe)&&(K!==Z&&(r.activeTexture(Z),K=Z),r.bindTexture(B,xe||ue[B]),se.type=B,se.texture=xe)}function G(){const B=$[K];B!==void 0&&B.type!==void 0&&(r.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function ie(){try{r.compressedTexImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function re(){try{r.compressedTexImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function te(){try{r.texSubImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Pe(){try{r.texSubImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ge(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function be(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ye(){try{r.texStorage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ce(){try{r.texStorage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ie(){try{r.texImage2D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function He(){try{r.texImage3D.apply(r,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Ge(B){Re.equals(B)===!1&&(r.scissor(B.x,B.y,B.z,B.w),Re.copy(B))}function De(B){j.equals(B)===!1&&(r.viewport(B.x,B.y,B.z,B.w),j.copy(B))}function it(B,xe){let Z=c.get(xe);Z===void 0&&(Z=new WeakMap,c.set(xe,Z));let se=Z.get(B);se===void 0&&(se=r.getUniformBlockIndex(xe,B.name),Z.set(B,se))}function We(B,xe){const se=c.get(xe).get(B);l.get(xe)!==se&&(r.uniformBlockBinding(xe,se,B.__bindingPointIndex),l.set(xe,se))}function ct(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),a.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),u={},K=null,$={},h={},d=new WeakMap,f=[],p=null,v=!1,g=null,m=null,S=null,y=null,x=null,P=null,R=null,A=new Ae(0,0,0),I=0,T=!1,_=null,M=null,L=null,U=null,N=null,Re.set(0,0,r.canvas.width,r.canvas.height),j.set(0,0,r.canvas.width,r.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:ee,disable:ve,bindFramebuffer:Te,drawBuffers:X,useProgram:Le,setBlending:D,setMaterial:_e,setFlipSided:fe,setCullFace:ae,setLineWidth:le,setPolygonOffset:Se,setScissorTest:de,activeTexture:w,bindTexture:b,unbindTexture:G,compressedTexImage2D:ie,compressedTexImage3D:re,texImage2D:Ie,texImage3D:He,updateUBOMapping:it,uniformBlockBinding:We,texStorage2D:Ye,texStorage3D:ce,texSubImage2D:te,texSubImage3D:Pe,compressedTexSubImage2D:ge,compressedTexSubImage3D:be,scissor:Ge,viewport:De,reset:ct}}function Ch(r,e,t,n){const i=v_(n);switch(t){case Gd:return r*e;case Xd:return r*e;case jd:return r*e*2;case Mo:return r*e/i.components*i.byteLength;case zc:return r*e/i.components*i.byteLength;case qd:return r*e*2/i.components*i.byteLength;case Vc:return r*e*2/i.components*i.byteLength;case Wd:return r*e*3/i.components*i.byteLength;case An:return r*e*4/i.components*i.byteLength;case Hc:return r*e*4/i.components*i.byteLength;case Ka:case Za:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case $a:case Ja:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Gl:case Xl:return Math.max(r,16)*Math.max(e,8)/4;case Hl:case Wl:return Math.max(r,8)*Math.max(e,8)/2;case jl:case ql:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Yl:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Kl:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Zl:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case $l:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case Jl:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case Ql:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case ec:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case tc:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case nc:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case ic:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case rc:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case sc:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case ac:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case oc:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case lc:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case Qa:case cc:case uc:return Math.ceil(r/4)*Math.ceil(e/4)*16;case Yd:case hc:return Math.ceil(r/4)*Math.ceil(e/4)*8;case dc:case fc:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function v_(r){switch(r){case yi:case zd:return{byteLength:1,components:1};case Is:case Vd:case Cn:return{byteLength:2,components:1};case Bc:case kc:return{byteLength:2,components:4};case er:case Oc:case wn:return{byteLength:4,components:1};case Hd:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function x_(r,e,t,n,i,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ue,u=new WeakMap;let h;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(w,b){return f?new OffscreenCanvas(w,b):Us("canvas")}function v(w,b,G){let ie=1;const re=de(w);if((re.width>G||re.height>G)&&(ie=G/Math.max(re.width,re.height)),ie<1)if(typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&w instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&w instanceof ImageBitmap||typeof VideoFrame<"u"&&w instanceof VideoFrame){const te=Math.floor(ie*re.width),Pe=Math.floor(ie*re.height);h===void 0&&(h=p(te,Pe));const ge=b?p(te,Pe):h;return ge.width=te,ge.height=Pe,ge.getContext("2d").drawImage(w,0,0,te,Pe),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+re.width+"x"+re.height+") to ("+te+"x"+Pe+")."),ge}else return"data"in w&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+re.width+"x"+re.height+")."),w;return w}function g(w){return w.generateMipmaps}function m(w){r.generateMipmap(w)}function S(w){return w.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:w.isWebGL3DRenderTarget?r.TEXTURE_3D:w.isWebGLArrayRenderTarget||w.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function y(w,b,G,ie,re=!1){if(w!==null){if(r[w]!==void 0)return r[w];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+w+"'")}let te=b;if(b===r.RED&&(G===r.FLOAT&&(te=r.R32F),G===r.HALF_FLOAT&&(te=r.R16F),G===r.UNSIGNED_BYTE&&(te=r.R8)),b===r.RED_INTEGER&&(G===r.UNSIGNED_BYTE&&(te=r.R8UI),G===r.UNSIGNED_SHORT&&(te=r.R16UI),G===r.UNSIGNED_INT&&(te=r.R32UI),G===r.BYTE&&(te=r.R8I),G===r.SHORT&&(te=r.R16I),G===r.INT&&(te=r.R32I)),b===r.RG&&(G===r.FLOAT&&(te=r.RG32F),G===r.HALF_FLOAT&&(te=r.RG16F),G===r.UNSIGNED_BYTE&&(te=r.RG8)),b===r.RG_INTEGER&&(G===r.UNSIGNED_BYTE&&(te=r.RG8UI),G===r.UNSIGNED_SHORT&&(te=r.RG16UI),G===r.UNSIGNED_INT&&(te=r.RG32UI),G===r.BYTE&&(te=r.RG8I),G===r.SHORT&&(te=r.RG16I),G===r.INT&&(te=r.RG32I)),b===r.RGB_INTEGER&&(G===r.UNSIGNED_BYTE&&(te=r.RGB8UI),G===r.UNSIGNED_SHORT&&(te=r.RGB16UI),G===r.UNSIGNED_INT&&(te=r.RGB32UI),G===r.BYTE&&(te=r.RGB8I),G===r.SHORT&&(te=r.RGB16I),G===r.INT&&(te=r.RGB32I)),b===r.RGBA_INTEGER&&(G===r.UNSIGNED_BYTE&&(te=r.RGBA8UI),G===r.UNSIGNED_SHORT&&(te=r.RGBA16UI),G===r.UNSIGNED_INT&&(te=r.RGBA32UI),G===r.BYTE&&(te=r.RGBA8I),G===r.SHORT&&(te=r.RGBA16I),G===r.INT&&(te=r.RGBA32I)),b===r.RGB&&G===r.UNSIGNED_INT_5_9_9_9_REV&&(te=r.RGB9_E5),b===r.RGBA){const Pe=re?So:Xe.getTransfer(ie);G===r.FLOAT&&(te=r.RGBA32F),G===r.HALF_FLOAT&&(te=r.RGBA16F),G===r.UNSIGNED_BYTE&&(te=Pe===gt?r.SRGB8_ALPHA8:r.RGBA8),G===r.UNSIGNED_SHORT_4_4_4_4&&(te=r.RGBA4),G===r.UNSIGNED_SHORT_5_5_5_1&&(te=r.RGB5_A1)}return(te===r.R16F||te===r.R32F||te===r.RG16F||te===r.RG32F||te===r.RGBA16F||te===r.RGBA32F)&&e.get("EXT_color_buffer_float"),te}function x(w,b){let G;return w?b===null||b===er||b===tr?G=r.DEPTH24_STENCIL8:b===wn?G=r.DEPTH32F_STENCIL8:b===Is&&(G=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===er||b===tr?G=r.DEPTH_COMPONENT24:b===wn?G=r.DEPTH_COMPONENT32F:b===Is&&(G=r.DEPTH_COMPONENT16),G}function P(w,b){return g(w)===!0||w.isFramebufferTexture&&w.minFilter!==kt&&w.minFilter!==en?Math.log2(Math.max(b.width,b.height))+1:w.mipmaps!==void 0&&w.mipmaps.length>0?w.mipmaps.length:w.isCompressedTexture&&Array.isArray(w.image)?b.mipmaps.length:1}function R(w){const b=w.target;b.removeEventListener("dispose",R),I(b),b.isVideoTexture&&u.delete(b)}function A(w){const b=w.target;b.removeEventListener("dispose",A),_(b)}function I(w){const b=n.get(w);if(b.__webglInit===void 0)return;const G=w.source,ie=d.get(G);if(ie){const re=ie[b.__cacheKey];re.usedTimes--,re.usedTimes===0&&T(w),Object.keys(ie).length===0&&d.delete(G)}n.remove(w)}function T(w){const b=n.get(w);r.deleteTexture(b.__webglTexture);const G=w.source,ie=d.get(G);delete ie[b.__cacheKey],a.memory.textures--}function _(w){const b=n.get(w);if(w.depthTexture&&(w.depthTexture.dispose(),n.remove(w.depthTexture)),w.isWebGLCubeRenderTarget)for(let ie=0;ie<6;ie++){if(Array.isArray(b.__webglFramebuffer[ie]))for(let re=0;re<b.__webglFramebuffer[ie].length;re++)r.deleteFramebuffer(b.__webglFramebuffer[ie][re]);else r.deleteFramebuffer(b.__webglFramebuffer[ie]);b.__webglDepthbuffer&&r.deleteRenderbuffer(b.__webglDepthbuffer[ie])}else{if(Array.isArray(b.__webglFramebuffer))for(let ie=0;ie<b.__webglFramebuffer.length;ie++)r.deleteFramebuffer(b.__webglFramebuffer[ie]);else r.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&r.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&r.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let ie=0;ie<b.__webglColorRenderbuffer.length;ie++)b.__webglColorRenderbuffer[ie]&&r.deleteRenderbuffer(b.__webglColorRenderbuffer[ie]);b.__webglDepthRenderbuffer&&r.deleteRenderbuffer(b.__webglDepthRenderbuffer)}const G=w.textures;for(let ie=0,re=G.length;ie<re;ie++){const te=n.get(G[ie]);te.__webglTexture&&(r.deleteTexture(te.__webglTexture),a.memory.textures--),n.remove(G[ie])}n.remove(w)}let M=0;function L(){M=0}function U(){const w=M;return w>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+w+" texture units while this GPU supports only "+i.maxTextures),M+=1,w}function N(w){const b=[];return b.push(w.wrapS),b.push(w.wrapT),b.push(w.wrapR||0),b.push(w.magFilter),b.push(w.minFilter),b.push(w.anisotropy),b.push(w.internalFormat),b.push(w.format),b.push(w.type),b.push(w.generateMipmaps),b.push(w.premultiplyAlpha),b.push(w.flipY),b.push(w.unpackAlignment),b.push(w.colorSpace),b.join()}function F(w,b){const G=n.get(w);if(w.isVideoTexture&&le(w),w.isRenderTargetTexture===!1&&w.version>0&&G.__version!==w.version){const ie=w.image;if(ie===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(ie.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{j(G,w,b);return}}t.bindTexture(r.TEXTURE_2D,G.__webglTexture,r.TEXTURE0+b)}function k(w,b){const G=n.get(w);if(w.version>0&&G.__version!==w.version){j(G,w,b);return}t.bindTexture(r.TEXTURE_2D_ARRAY,G.__webglTexture,r.TEXTURE0+b)}function W(w,b){const G=n.get(w);if(w.version>0&&G.__version!==w.version){j(G,w,b);return}t.bindTexture(r.TEXTURE_3D,G.__webglTexture,r.TEXTURE0+b)}function V(w,b){const G=n.get(w);if(w.version>0&&G.__version!==w.version){ne(G,w,b);return}t.bindTexture(r.TEXTURE_CUBE_MAP,G.__webglTexture,r.TEXTURE0+b)}const K={[Rn]:r.REPEAT,[jn]:r.CLAMP_TO_EDGE,[ro]:r.MIRRORED_REPEAT},$={[kt]:r.NEAREST,[kd]:r.NEAREST_MIPMAP_NEAREST,[vs]:r.NEAREST_MIPMAP_LINEAR,[en]:r.LINEAR,[Ya]:r.LINEAR_MIPMAP_NEAREST,[qn]:r.LINEAR_MIPMAP_LINEAR},J={[Zp]:r.NEVER,[nm]:r.ALWAYS,[$p]:r.LESS,[Jd]:r.LEQUAL,[Jp]:r.EQUAL,[tm]:r.GEQUAL,[Qp]:r.GREATER,[em]:r.NOTEQUAL};function oe(w,b){if(b.type===wn&&e.has("OES_texture_float_linear")===!1&&(b.magFilter===en||b.magFilter===Ya||b.magFilter===vs||b.magFilter===qn||b.minFilter===en||b.minFilter===Ya||b.minFilter===vs||b.minFilter===qn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(w,r.TEXTURE_WRAP_S,K[b.wrapS]),r.texParameteri(w,r.TEXTURE_WRAP_T,K[b.wrapT]),(w===r.TEXTURE_3D||w===r.TEXTURE_2D_ARRAY)&&r.texParameteri(w,r.TEXTURE_WRAP_R,K[b.wrapR]),r.texParameteri(w,r.TEXTURE_MAG_FILTER,$[b.magFilter]),r.texParameteri(w,r.TEXTURE_MIN_FILTER,$[b.minFilter]),b.compareFunction&&(r.texParameteri(w,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(w,r.TEXTURE_COMPARE_FUNC,J[b.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===kt||b.minFilter!==vs&&b.minFilter!==qn||b.type===wn&&e.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){const G=e.get("EXT_texture_filter_anisotropic");r.texParameterf(w,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,i.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function Re(w,b){let G=!1;w.__webglInit===void 0&&(w.__webglInit=!0,b.addEventListener("dispose",R));const ie=b.source;let re=d.get(ie);re===void 0&&(re={},d.set(ie,re));const te=N(b);if(te!==w.__cacheKey){re[te]===void 0&&(re[te]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,G=!0),re[te].usedTimes++;const Pe=re[w.__cacheKey];Pe!==void 0&&(re[w.__cacheKey].usedTimes--,Pe.usedTimes===0&&T(b)),w.__cacheKey=te,w.__webglTexture=re[te].texture}return G}function j(w,b,G){let ie=r.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(ie=r.TEXTURE_2D_ARRAY),b.isData3DTexture&&(ie=r.TEXTURE_3D);const re=Re(w,b),te=b.source;t.bindTexture(ie,w.__webglTexture,r.TEXTURE0+G);const Pe=n.get(te);if(te.version!==Pe.__version||re===!0){t.activeTexture(r.TEXTURE0+G);const ge=Xe.getPrimaries(Xe.workingColorSpace),be=b.colorSpace===mi?null:Xe.getPrimaries(b.colorSpace),Ye=b.colorSpace===mi||ge===be?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,b.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,b.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ye);let ce=v(b.image,!1,i.maxTextureSize);ce=Se(b,ce);const Ie=s.convert(b.format,b.colorSpace),He=s.convert(b.type);let Ge=y(b.internalFormat,Ie,He,b.colorSpace,b.isVideoTexture);oe(ie,b);let De;const it=b.mipmaps,We=b.isVideoTexture!==!0,ct=Pe.__version===void 0||re===!0,B=te.dataReady,xe=P(b,ce);if(b.isDepthTexture)Ge=x(b.format===nr,b.type),ct&&(We?t.texStorage2D(r.TEXTURE_2D,1,Ge,ce.width,ce.height):t.texImage2D(r.TEXTURE_2D,0,Ge,ce.width,ce.height,0,Ie,He,null));else if(b.isDataTexture)if(it.length>0){We&&ct&&t.texStorage2D(r.TEXTURE_2D,xe,Ge,it[0].width,it[0].height);for(let Z=0,se=it.length;Z<se;Z++)De=it[Z],We?B&&t.texSubImage2D(r.TEXTURE_2D,Z,0,0,De.width,De.height,Ie,He,De.data):t.texImage2D(r.TEXTURE_2D,Z,Ge,De.width,De.height,0,Ie,He,De.data);b.generateMipmaps=!1}else We?(ct&&t.texStorage2D(r.TEXTURE_2D,xe,Ge,ce.width,ce.height),B&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,ce.width,ce.height,Ie,He,ce.data)):t.texImage2D(r.TEXTURE_2D,0,Ge,ce.width,ce.height,0,Ie,He,ce.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){We&&ct&&t.texStorage3D(r.TEXTURE_2D_ARRAY,xe,Ge,it[0].width,it[0].height,ce.depth);for(let Z=0,se=it.length;Z<se;Z++)if(De=it[Z],b.format!==An)if(Ie!==null)if(We){if(B)if(b.layerUpdates.size>0){const Ce=Ch(De.width,De.height,b.format,b.type);for(const Ee of b.layerUpdates){const Ke=De.data.subarray(Ee*Ce/De.data.BYTES_PER_ELEMENT,(Ee+1)*Ce/De.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,Ee,De.width,De.height,1,Ie,Ke)}b.clearLayerUpdates()}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,0,De.width,De.height,ce.depth,Ie,De.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,Z,Ge,De.width,De.height,ce.depth,0,De.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else We?B&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,Z,0,0,0,De.width,De.height,ce.depth,Ie,He,De.data):t.texImage3D(r.TEXTURE_2D_ARRAY,Z,Ge,De.width,De.height,ce.depth,0,Ie,He,De.data)}else{We&&ct&&t.texStorage2D(r.TEXTURE_2D,xe,Ge,it[0].width,it[0].height);for(let Z=0,se=it.length;Z<se;Z++)De=it[Z],b.format!==An?Ie!==null?We?B&&t.compressedTexSubImage2D(r.TEXTURE_2D,Z,0,0,De.width,De.height,Ie,De.data):t.compressedTexImage2D(r.TEXTURE_2D,Z,Ge,De.width,De.height,0,De.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):We?B&&t.texSubImage2D(r.TEXTURE_2D,Z,0,0,De.width,De.height,Ie,He,De.data):t.texImage2D(r.TEXTURE_2D,Z,Ge,De.width,De.height,0,Ie,He,De.data)}else if(b.isDataArrayTexture)if(We){if(ct&&t.texStorage3D(r.TEXTURE_2D_ARRAY,xe,Ge,ce.width,ce.height,ce.depth),B)if(b.layerUpdates.size>0){const Z=Ch(ce.width,ce.height,b.format,b.type);for(const se of b.layerUpdates){const Ce=ce.data.subarray(se*Z/ce.data.BYTES_PER_ELEMENT,(se+1)*Z/ce.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,se,ce.width,ce.height,1,Ie,He,Ce)}b.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,ce.width,ce.height,ce.depth,Ie,He,ce.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,Ge,ce.width,ce.height,ce.depth,0,Ie,He,ce.data);else if(b.isData3DTexture)We?(ct&&t.texStorage3D(r.TEXTURE_3D,xe,Ge,ce.width,ce.height,ce.depth),B&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,ce.width,ce.height,ce.depth,Ie,He,ce.data)):t.texImage3D(r.TEXTURE_3D,0,Ge,ce.width,ce.height,ce.depth,0,Ie,He,ce.data);else if(b.isFramebufferTexture){if(ct)if(We)t.texStorage2D(r.TEXTURE_2D,xe,Ge,ce.width,ce.height);else{let Z=ce.width,se=ce.height;for(let Ce=0;Ce<xe;Ce++)t.texImage2D(r.TEXTURE_2D,Ce,Ge,Z,se,0,Ie,He,null),Z>>=1,se>>=1}}else if(it.length>0){if(We&&ct){const Z=de(it[0]);t.texStorage2D(r.TEXTURE_2D,xe,Ge,Z.width,Z.height)}for(let Z=0,se=it.length;Z<se;Z++)De=it[Z],We?B&&t.texSubImage2D(r.TEXTURE_2D,Z,0,0,Ie,He,De):t.texImage2D(r.TEXTURE_2D,Z,Ge,Ie,He,De);b.generateMipmaps=!1}else if(We){if(ct){const Z=de(ce);t.texStorage2D(r.TEXTURE_2D,xe,Ge,Z.width,Z.height)}B&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,Ie,He,ce)}else t.texImage2D(r.TEXTURE_2D,0,Ge,Ie,He,ce);g(b)&&m(ie),Pe.__version=te.version,b.onUpdate&&b.onUpdate(b)}w.__version=b.version}function ne(w,b,G){if(b.image.length!==6)return;const ie=Re(w,b),re=b.source;t.bindTexture(r.TEXTURE_CUBE_MAP,w.__webglTexture,r.TEXTURE0+G);const te=n.get(re);if(re.version!==te.__version||ie===!0){t.activeTexture(r.TEXTURE0+G);const Pe=Xe.getPrimaries(Xe.workingColorSpace),ge=b.colorSpace===mi?null:Xe.getPrimaries(b.colorSpace),be=b.colorSpace===mi||Pe===ge?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,b.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,b.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);const Ye=b.isCompressedTexture||b.image[0].isCompressedTexture,ce=b.image[0]&&b.image[0].isDataTexture,Ie=[];for(let se=0;se<6;se++)!Ye&&!ce?Ie[se]=v(b.image[se],!0,i.maxCubemapSize):Ie[se]=ce?b.image[se].image:b.image[se],Ie[se]=Se(b,Ie[se]);const He=Ie[0],Ge=s.convert(b.format,b.colorSpace),De=s.convert(b.type),it=y(b.internalFormat,Ge,De,b.colorSpace),We=b.isVideoTexture!==!0,ct=te.__version===void 0||ie===!0,B=re.dataReady;let xe=P(b,He);oe(r.TEXTURE_CUBE_MAP,b);let Z;if(Ye){We&&ct&&t.texStorage2D(r.TEXTURE_CUBE_MAP,xe,it,He.width,He.height);for(let se=0;se<6;se++){Z=Ie[se].mipmaps;for(let Ce=0;Ce<Z.length;Ce++){const Ee=Z[Ce];b.format!==An?Ge!==null?We?B&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce,0,0,Ee.width,Ee.height,Ge,Ee.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce,it,Ee.width,Ee.height,0,Ee.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):We?B&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce,0,0,Ee.width,Ee.height,Ge,De,Ee.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce,it,Ee.width,Ee.height,0,Ge,De,Ee.data)}}}else{if(Z=b.mipmaps,We&&ct){Z.length>0&&xe++;const se=de(Ie[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,xe,it,se.width,se.height)}for(let se=0;se<6;se++)if(ce){We?B&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,Ie[se].width,Ie[se].height,Ge,De,Ie[se].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,it,Ie[se].width,Ie[se].height,0,Ge,De,Ie[se].data);for(let Ce=0;Ce<Z.length;Ce++){const Ke=Z[Ce].image[se].image;We?B&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce+1,0,0,Ke.width,Ke.height,Ge,De,Ke.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce+1,it,Ke.width,Ke.height,0,Ge,De,Ke.data)}}else{We?B&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,0,0,Ge,De,Ie[se]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,0,it,Ge,De,Ie[se]);for(let Ce=0;Ce<Z.length;Ce++){const Ee=Z[Ce];We?B&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce+1,0,0,Ge,De,Ee.image[se]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+se,Ce+1,it,Ge,De,Ee.image[se])}}}g(b)&&m(r.TEXTURE_CUBE_MAP),te.__version=re.version,b.onUpdate&&b.onUpdate(b)}w.__version=b.version}function ue(w,b,G,ie,re,te){const Pe=s.convert(G.format,G.colorSpace),ge=s.convert(G.type),be=y(G.internalFormat,Pe,ge,G.colorSpace),Ye=n.get(b),ce=n.get(G);if(ce.__renderTarget=b,!Ye.__hasExternalTextures){const Ie=Math.max(1,b.width>>te),He=Math.max(1,b.height>>te);re===r.TEXTURE_3D||re===r.TEXTURE_2D_ARRAY?t.texImage3D(re,te,be,Ie,He,b.depth,0,Pe,ge,null):t.texImage2D(re,te,be,Ie,He,0,Pe,ge,null)}t.bindFramebuffer(r.FRAMEBUFFER,w),ae(b)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,ie,re,ce.__webglTexture,0,fe(b)):(re===r.TEXTURE_2D||re>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&re<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,ie,re,ce.__webglTexture,te),t.bindFramebuffer(r.FRAMEBUFFER,null)}function ee(w,b,G){if(r.bindRenderbuffer(r.RENDERBUFFER,w),b.depthBuffer){const ie=b.depthTexture,re=ie&&ie.isDepthTexture?ie.type:null,te=x(b.stencilBuffer,re),Pe=b.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ge=fe(b);ae(b)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ge,te,b.width,b.height):G?r.renderbufferStorageMultisample(r.RENDERBUFFER,ge,te,b.width,b.height):r.renderbufferStorage(r.RENDERBUFFER,te,b.width,b.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Pe,r.RENDERBUFFER,w)}else{const ie=b.textures;for(let re=0;re<ie.length;re++){const te=ie[re],Pe=s.convert(te.format,te.colorSpace),ge=s.convert(te.type),be=y(te.internalFormat,Pe,ge,te.colorSpace),Ye=fe(b);G&&ae(b)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Ye,be,b.width,b.height):ae(b)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Ye,be,b.width,b.height):r.renderbufferStorage(r.RENDERBUFFER,be,b.width,b.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function ve(w,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(r.FRAMEBUFFER,w),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const ie=n.get(b.depthTexture);ie.__renderTarget=b,(!ie.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),F(b.depthTexture,0);const re=ie.__webglTexture,te=fe(b);if(b.depthTexture.format===zr)ae(b)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,re,0,te):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,re,0);else if(b.depthTexture.format===nr)ae(b)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,re,0,te):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,re,0);else throw new Error("Unknown depthTexture format")}function Te(w){const b=n.get(w),G=w.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==w.depthTexture){const ie=w.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),ie){const re=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,ie.removeEventListener("dispose",re)};ie.addEventListener("dispose",re),b.__depthDisposeCallback=re}b.__boundDepthTexture=ie}if(w.depthTexture&&!b.__autoAllocateDepthBuffer){if(G)throw new Error("target.depthTexture not supported in Cube render targets");ve(b.__webglFramebuffer,w)}else if(G){b.__webglDepthbuffer=[];for(let ie=0;ie<6;ie++)if(t.bindFramebuffer(r.FRAMEBUFFER,b.__webglFramebuffer[ie]),b.__webglDepthbuffer[ie]===void 0)b.__webglDepthbuffer[ie]=r.createRenderbuffer(),ee(b.__webglDepthbuffer[ie],w,!1);else{const re=w.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,te=b.__webglDepthbuffer[ie];r.bindRenderbuffer(r.RENDERBUFFER,te),r.framebufferRenderbuffer(r.FRAMEBUFFER,re,r.RENDERBUFFER,te)}}else if(t.bindFramebuffer(r.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=r.createRenderbuffer(),ee(b.__webglDepthbuffer,w,!1);else{const ie=w.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,re=b.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,re),r.framebufferRenderbuffer(r.FRAMEBUFFER,ie,r.RENDERBUFFER,re)}t.bindFramebuffer(r.FRAMEBUFFER,null)}function X(w,b,G){const ie=n.get(w);b!==void 0&&ue(ie.__webglFramebuffer,w,w.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),G!==void 0&&Te(w)}function Le(w){const b=w.texture,G=n.get(w),ie=n.get(b);w.addEventListener("dispose",A);const re=w.textures,te=w.isWebGLCubeRenderTarget===!0,Pe=re.length>1;if(Pe||(ie.__webglTexture===void 0&&(ie.__webglTexture=r.createTexture()),ie.__version=b.version,a.memory.textures++),te){G.__webglFramebuffer=[];for(let ge=0;ge<6;ge++)if(b.mipmaps&&b.mipmaps.length>0){G.__webglFramebuffer[ge]=[];for(let be=0;be<b.mipmaps.length;be++)G.__webglFramebuffer[ge][be]=r.createFramebuffer()}else G.__webglFramebuffer[ge]=r.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){G.__webglFramebuffer=[];for(let ge=0;ge<b.mipmaps.length;ge++)G.__webglFramebuffer[ge]=r.createFramebuffer()}else G.__webglFramebuffer=r.createFramebuffer();if(Pe)for(let ge=0,be=re.length;ge<be;ge++){const Ye=n.get(re[ge]);Ye.__webglTexture===void 0&&(Ye.__webglTexture=r.createTexture(),a.memory.textures++)}if(w.samples>0&&ae(w)===!1){G.__webglMultisampledFramebuffer=r.createFramebuffer(),G.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let ge=0;ge<re.length;ge++){const be=re[ge];G.__webglColorRenderbuffer[ge]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,G.__webglColorRenderbuffer[ge]);const Ye=s.convert(be.format,be.colorSpace),ce=s.convert(be.type),Ie=y(be.internalFormat,Ye,ce,be.colorSpace,w.isXRRenderTarget===!0),He=fe(w);r.renderbufferStorageMultisample(r.RENDERBUFFER,He,Ie,w.width,w.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ge,r.RENDERBUFFER,G.__webglColorRenderbuffer[ge])}r.bindRenderbuffer(r.RENDERBUFFER,null),w.depthBuffer&&(G.__webglDepthRenderbuffer=r.createRenderbuffer(),ee(G.__webglDepthRenderbuffer,w,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(te){t.bindTexture(r.TEXTURE_CUBE_MAP,ie.__webglTexture),oe(r.TEXTURE_CUBE_MAP,b);for(let ge=0;ge<6;ge++)if(b.mipmaps&&b.mipmaps.length>0)for(let be=0;be<b.mipmaps.length;be++)ue(G.__webglFramebuffer[ge][be],w,b,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ge,be);else ue(G.__webglFramebuffer[ge],w,b,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0);g(b)&&m(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Pe){for(let ge=0,be=re.length;ge<be;ge++){const Ye=re[ge],ce=n.get(Ye);t.bindTexture(r.TEXTURE_2D,ce.__webglTexture),oe(r.TEXTURE_2D,Ye),ue(G.__webglFramebuffer,w,Ye,r.COLOR_ATTACHMENT0+ge,r.TEXTURE_2D,0),g(Ye)&&m(r.TEXTURE_2D)}t.unbindTexture()}else{let ge=r.TEXTURE_2D;if((w.isWebGL3DRenderTarget||w.isWebGLArrayRenderTarget)&&(ge=w.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(ge,ie.__webglTexture),oe(ge,b),b.mipmaps&&b.mipmaps.length>0)for(let be=0;be<b.mipmaps.length;be++)ue(G.__webglFramebuffer[be],w,b,r.COLOR_ATTACHMENT0,ge,be);else ue(G.__webglFramebuffer,w,b,r.COLOR_ATTACHMENT0,ge,0);g(b)&&m(ge),t.unbindTexture()}w.depthBuffer&&Te(w)}function Q(w){const b=w.textures;for(let G=0,ie=b.length;G<ie;G++){const re=b[G];if(g(re)){const te=S(w),Pe=n.get(re).__webglTexture;t.bindTexture(te,Pe),m(te),t.unbindTexture()}}}const ye=[],D=[];function _e(w){if(w.samples>0){if(ae(w)===!1){const b=w.textures,G=w.width,ie=w.height;let re=r.COLOR_BUFFER_BIT;const te=w.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Pe=n.get(w),ge=b.length>1;if(ge)for(let be=0;be<b.length;be++)t.bindFramebuffer(r.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+be,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,Pe.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+be,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Pe.__webglFramebuffer);for(let be=0;be<b.length;be++){if(w.resolveDepthBuffer&&(w.depthBuffer&&(re|=r.DEPTH_BUFFER_BIT),w.stencilBuffer&&w.resolveStencilBuffer&&(re|=r.STENCIL_BUFFER_BIT)),ge){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Pe.__webglColorRenderbuffer[be]);const Ye=n.get(b[be]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Ye,0)}r.blitFramebuffer(0,0,G,ie,0,0,G,ie,re,r.NEAREST),l===!0&&(ye.length=0,D.length=0,ye.push(r.COLOR_ATTACHMENT0+be),w.depthBuffer&&w.resolveDepthBuffer===!1&&(ye.push(te),D.push(te),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,D)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,ye))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),ge)for(let be=0;be<b.length;be++){t.bindFramebuffer(r.FRAMEBUFFER,Pe.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+be,r.RENDERBUFFER,Pe.__webglColorRenderbuffer[be]);const Ye=n.get(b[be]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,Pe.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+be,r.TEXTURE_2D,Ye,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,Pe.__webglMultisampledFramebuffer)}else if(w.depthBuffer&&w.resolveDepthBuffer===!1&&l){const b=w.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[b])}}}function fe(w){return Math.min(i.maxSamples,w.samples)}function ae(w){const b=n.get(w);return w.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function le(w){const b=a.render.frame;u.get(w)!==b&&(u.set(w,b),w.update())}function Se(w,b){const G=w.colorSpace,ie=w.format,re=w.type;return w.isCompressedTexture===!0||w.isVideoTexture===!0||G!==nn&&G!==mi&&(Xe.getTransfer(G)===gt?(ie!==An||re!==yi)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",G)),b}function de(w){return typeof HTMLImageElement<"u"&&w instanceof HTMLImageElement?(c.width=w.naturalWidth||w.width,c.height=w.naturalHeight||w.height):typeof VideoFrame<"u"&&w instanceof VideoFrame?(c.width=w.displayWidth,c.height=w.displayHeight):(c.width=w.width,c.height=w.height),c}this.allocateTextureUnit=U,this.resetTextureUnits=L,this.setTexture2D=F,this.setTexture2DArray=k,this.setTexture3D=W,this.setTextureCube=V,this.rebindTextures=X,this.setupRenderTarget=Le,this.updateRenderTargetMipmap=Q,this.updateMultisampleRenderTarget=_e,this.setupDepthRenderbuffer=Te,this.setupFrameBufferTexture=ue,this.useMultisampledRTT=ae}function __(r,e){function t(n,i=mi){let s;const a=Xe.getTransfer(i);if(n===yi)return r.UNSIGNED_BYTE;if(n===Bc)return r.UNSIGNED_SHORT_4_4_4_4;if(n===kc)return r.UNSIGNED_SHORT_5_5_5_1;if(n===Hd)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===zd)return r.BYTE;if(n===Vd)return r.SHORT;if(n===Is)return r.UNSIGNED_SHORT;if(n===Oc)return r.INT;if(n===er)return r.UNSIGNED_INT;if(n===wn)return r.FLOAT;if(n===Cn)return r.HALF_FLOAT;if(n===Gd)return r.ALPHA;if(n===Wd)return r.RGB;if(n===An)return r.RGBA;if(n===Xd)return r.LUMINANCE;if(n===jd)return r.LUMINANCE_ALPHA;if(n===zr)return r.DEPTH_COMPONENT;if(n===nr)return r.DEPTH_STENCIL;if(n===Mo)return r.RED;if(n===zc)return r.RED_INTEGER;if(n===qd)return r.RG;if(n===Vc)return r.RG_INTEGER;if(n===Hc)return r.RGBA_INTEGER;if(n===Ka||n===Za||n===$a||n===Ja)if(a===gt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Ka)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Za)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===$a)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ja)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Ka)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Za)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===$a)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ja)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Hl||n===Gl||n===Wl||n===Xl)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Hl)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Gl)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Wl)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xl)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===jl||n===ql||n===Yl)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===jl||n===ql)return a===gt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Yl)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Kl||n===Zl||n===$l||n===Jl||n===Ql||n===ec||n===tc||n===nc||n===ic||n===rc||n===sc||n===ac||n===oc||n===lc)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Kl)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Zl)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===$l)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Jl)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ql)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ec)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===tc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===nc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ic)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===rc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===sc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ac)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===oc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===lc)return a===gt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Qa||n===cc||n===uc)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Qa)return a===gt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===cc)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===uc)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Yd||n===hc||n===dc||n===fc)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Qa)return s.COMPRESSED_RED_RGTC1_EXT;if(n===hc)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===dc)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===fc)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===tr?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:t}}class y_ extends Qt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class Yt extends dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const M_={type:"move"};class al{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Yt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Yt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new C,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new C),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Yt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new C,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new C),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const v of e.hand.values()){const g=t.getJointPose(v,n),m=this._getHandJoint(c,v);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,p=.005;c.inputState.pinching&&d>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(M_)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Yt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const S_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,b_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class T_{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const i=new Pt,s=e.properties.get(i);s.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new At({vertexShader:S_,fragmentShader:b_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ft(new qs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class E_ extends cr{constructor(e,t){super();const n=this;let i=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,f=null,p=null;const v=new T_,g=t.getContextAttributes();let m=null,S=null;const y=[],x=[],P=new Ue;let R=null;const A=new Qt;A.viewport=new rt;const I=new Qt;I.viewport=new rt;const T=[A,I],_=new y_;let M=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let ne=y[j];return ne===void 0&&(ne=new al,y[j]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(j){let ne=y[j];return ne===void 0&&(ne=new al,y[j]=ne),ne.getGripSpace()},this.getHand=function(j){let ne=y[j];return ne===void 0&&(ne=new al,y[j]=ne),ne.getHandSpace()};function U(j){const ne=x.indexOf(j.inputSource);if(ne===-1)return;const ue=y[ne];ue!==void 0&&(ue.update(j.inputSource,j.frame,c||a),ue.dispatchEvent({type:j.type,data:j.inputSource}))}function N(){i.removeEventListener("select",U),i.removeEventListener("selectstart",U),i.removeEventListener("selectend",U),i.removeEventListener("squeeze",U),i.removeEventListener("squeezestart",U),i.removeEventListener("squeezeend",U),i.removeEventListener("end",N),i.removeEventListener("inputsourceschange",F);for(let j=0;j<y.length;j++){const ne=x[j];ne!==null&&(x[j]=null,y[j].disconnect(ne))}M=null,L=null,v.reset(),e.setRenderTarget(m),f=null,d=null,h=null,i=null,S=null,Re.stop(),n.isPresenting=!1,e.setPixelRatio(R),e.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h},this.getFrame=function(){return p},this.getSession=function(){return i},this.setSession=async function(j){if(i=j,i!==null){if(m=e.getRenderTarget(),i.addEventListener("select",U),i.addEventListener("selectstart",U),i.addEventListener("selectend",U),i.addEventListener("squeeze",U),i.addEventListener("squeezestart",U),i.addEventListener("squeezeend",U),i.addEventListener("end",N),i.addEventListener("inputsourceschange",F),g.xrCompatible!==!0&&await t.makeXRCompatible(),R=e.getPixelRatio(),e.getSize(P),i.renderState.layers===void 0){const ne={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,t,ne),i.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),S=new hn(f.framebufferWidth,f.framebufferHeight,{format:An,type:yi,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil})}else{let ne=null,ue=null,ee=null;g.depth&&(ee=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ne=g.stencil?nr:zr,ue=g.stencil?tr:er);const ve={colorFormat:t.RGBA8,depthFormat:ee,scaleFactor:s};h=new XRWebGLBinding(i,t),d=h.createProjectionLayer(ve),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),S=new hn(d.textureWidth,d.textureHeight,{format:An,type:yi,depthTexture:new Zc(d.textureWidth,d.textureHeight,ue,void 0,void 0,void 0,void 0,void 0,void 0,ne),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),Re.setContext(i),Re.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function F(j){for(let ne=0;ne<j.removed.length;ne++){const ue=j.removed[ne],ee=x.indexOf(ue);ee>=0&&(x[ee]=null,y[ee].disconnect(ue))}for(let ne=0;ne<j.added.length;ne++){const ue=j.added[ne];let ee=x.indexOf(ue);if(ee===-1){for(let Te=0;Te<y.length;Te++)if(Te>=x.length){x.push(ue),ee=Te;break}else if(x[Te]===null){x[Te]=ue,ee=Te;break}if(ee===-1)break}const ve=y[ee];ve&&ve.connect(ue)}}const k=new C,W=new C;function V(j,ne,ue){k.setFromMatrixPosition(ne.matrixWorld),W.setFromMatrixPosition(ue.matrixWorld);const ee=k.distanceTo(W),ve=ne.projectionMatrix.elements,Te=ue.projectionMatrix.elements,X=ve[14]/(ve[10]-1),Le=ve[14]/(ve[10]+1),Q=(ve[9]+1)/ve[5],ye=(ve[9]-1)/ve[5],D=(ve[8]-1)/ve[0],_e=(Te[8]+1)/Te[0],fe=X*D,ae=X*_e,le=ee/(-D+_e),Se=le*-D;if(ne.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Se),j.translateZ(le),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),ve[10]===-1)j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{const de=X+le,w=Le+le,b=fe-Se,G=ae+(ee-Se),ie=Q*Le/w*de,re=ye*Le/w*de;j.projectionMatrix.makePerspective(b,G,ie,re,de,w),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function K(j,ne){ne===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(ne.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(i===null)return;let ne=j.near,ue=j.far;v.texture!==null&&(v.depthNear>0&&(ne=v.depthNear),v.depthFar>0&&(ue=v.depthFar)),_.near=I.near=A.near=ne,_.far=I.far=A.far=ue,(M!==_.near||L!==_.far)&&(i.updateRenderState({depthNear:_.near,depthFar:_.far}),M=_.near,L=_.far),A.layers.mask=j.layers.mask|2,I.layers.mask=j.layers.mask|4,_.layers.mask=A.layers.mask|I.layers.mask;const ee=j.parent,ve=_.cameras;K(_,ee);for(let Te=0;Te<ve.length;Te++)K(ve[Te],ee);ve.length===2?V(_,A,I):_.projectionMatrix.copy(A.projectionMatrix),$(j,_,ee)};function $(j,ne,ue){ue===null?j.matrix.copy(ne.matrixWorld):(j.matrix.copy(ue.matrixWorld),j.matrix.invert(),j.matrix.multiply(ne.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=Yr*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(j){l=j,d!==null&&(d.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let J=null;function oe(j,ne){if(u=ne.getViewerPose(c||a),p=ne,u!==null){const ue=u.views;f!==null&&(e.setRenderTargetFramebuffer(S,f.framebuffer),e.setRenderTarget(S));let ee=!1;ue.length!==_.cameras.length&&(_.cameras.length=0,ee=!0);for(let Te=0;Te<ue.length;Te++){const X=ue[Te];let Le=null;if(f!==null)Le=f.getViewport(X);else{const ye=h.getViewSubImage(d,X);Le=ye.viewport,Te===0&&(e.setRenderTargetTextures(S,ye.colorTexture,d.ignoreDepthValues?void 0:ye.depthStencilTexture),e.setRenderTarget(S))}let Q=T[Te];Q===void 0&&(Q=new Qt,Q.layers.enable(Te),Q.viewport=new rt,T[Te]=Q),Q.matrix.fromArray(X.transform.matrix),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.projectionMatrix.fromArray(X.projectionMatrix),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert(),Q.viewport.set(Le.x,Le.y,Le.width,Le.height),Te===0&&(_.matrix.copy(Q.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),ee===!0&&_.cameras.push(Q)}const ve=i.enabledFeatures;if(ve&&ve.includes("depth-sensing")){const Te=h.getDepthInformation(ue[0]);Te&&Te.isValid&&Te.texture&&v.init(e,Te,i.renderState)}}for(let ue=0;ue<y.length;ue++){const ee=x[ue],ve=y[ue];ee!==null&&ve!==void 0&&ve.update(ee,ne,c||a)}J&&J(j,ne),ne.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ne}),p=null}const Re=new of;Re.setAnimationLoop(oe),this.setAnimationLoop=function(j){J=j},this.dispose=function(){}}}const qi=new Bt,w_=new me;function A_(r,e){function t(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,rf(r)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function i(g,m,S,y,x){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(g,m):m.isMeshToonMaterial?(s(g,m),h(g,m)):m.isMeshPhongMaterial?(s(g,m),u(g,m)):m.isMeshStandardMaterial?(s(g,m),d(g,m),m.isMeshPhysicalMaterial&&f(g,m,x)):m.isMeshMatcapMaterial?(s(g,m),p(g,m)):m.isMeshDepthMaterial?s(g,m):m.isMeshDistanceMaterial?(s(g,m),v(g,m)):m.isMeshNormalMaterial?s(g,m):m.isLineBasicMaterial?(a(g,m),m.isLineDashedMaterial&&o(g,m)):m.isPointsMaterial?l(g,m,S,y):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,t(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===un&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,t(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===un&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,t(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,t(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);const S=e.get(m),y=S.envMap,x=S.envMapRotation;y&&(g.envMap.value=y,qi.copy(x),qi.x*=-1,qi.y*=-1,qi.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(qi.y*=-1,qi.z*=-1),g.envMapRotation.value.setFromMatrix4(w_.makeRotationFromEuler(qi)),g.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,g.aoMapTransform))}function a(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform))}function o(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,S,y){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*S,g.scale.value=y*.5,m.map&&(g.map.value=m.map,t(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function u(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function h(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function d(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,S){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===un&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=S.texture,g.transmissionSamplerSize.value.set(S.width,S.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function v(g,m){const S=e.get(m).light;g.referencePosition.value.setFromMatrixPosition(S.matrixWorld),g.nearDistance.value=S.shadow.camera.near,g.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function C_(r,e,t,n){let i={},s={},a=[];const o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(S,y){const x=y.program;n.uniformBlockBinding(S,x)}function c(S,y){let x=i[S.id];x===void 0&&(p(S),x=u(S),i[S.id]=x,S.addEventListener("dispose",g));const P=y.program;n.updateUBOMapping(S,P);const R=e.render.frame;s[S.id]!==R&&(d(S),s[S.id]=R)}function u(S){const y=h();S.__bindingPointIndex=y;const x=r.createBuffer(),P=S.__size,R=S.usage;return r.bindBuffer(r.UNIFORM_BUFFER,x),r.bufferData(r.UNIFORM_BUFFER,P,R),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,x),x}function h(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(S){const y=i[S.id],x=S.uniforms,P=S.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let R=0,A=x.length;R<A;R++){const I=Array.isArray(x[R])?x[R]:[x[R]];for(let T=0,_=I.length;T<_;T++){const M=I[T];if(f(M,R,T,P)===!0){const L=M.__offset,U=Array.isArray(M.value)?M.value:[M.value];let N=0;for(let F=0;F<U.length;F++){const k=U[F],W=v(k);typeof k=="number"||typeof k=="boolean"?(M.__data[0]=k,r.bufferSubData(r.UNIFORM_BUFFER,L+N,M.__data)):k.isMatrix3?(M.__data[0]=k.elements[0],M.__data[1]=k.elements[1],M.__data[2]=k.elements[2],M.__data[3]=0,M.__data[4]=k.elements[3],M.__data[5]=k.elements[4],M.__data[6]=k.elements[5],M.__data[7]=0,M.__data[8]=k.elements[6],M.__data[9]=k.elements[7],M.__data[10]=k.elements[8],M.__data[11]=0):(k.toArray(M.__data,N),N+=W.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,L,M.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(S,y,x,P){const R=S.value,A=y+"_"+x;if(P[A]===void 0)return typeof R=="number"||typeof R=="boolean"?P[A]=R:P[A]=R.clone(),!0;{const I=P[A];if(typeof R=="number"||typeof R=="boolean"){if(I!==R)return P[A]=R,!0}else if(I.equals(R)===!1)return I.copy(R),!0}return!1}function p(S){const y=S.uniforms;let x=0;const P=16;for(let A=0,I=y.length;A<I;A++){const T=Array.isArray(y[A])?y[A]:[y[A]];for(let _=0,M=T.length;_<M;_++){const L=T[_],U=Array.isArray(L.value)?L.value:[L.value];for(let N=0,F=U.length;N<F;N++){const k=U[N],W=v(k),V=x%P,K=V%W.boundary,$=V+K;x+=K,$!==0&&P-$<W.storage&&(x+=P-$),L.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),L.__offset=x,x+=W.storage}}}const R=x%P;return R>0&&(x+=P-R),S.__size=x,S.__cache={},this}function v(S){const y={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(y.boundary=4,y.storage=4):S.isVector2?(y.boundary=8,y.storage=8):S.isVector3||S.isColor?(y.boundary=16,y.storage=12):S.isVector4?(y.boundary=16,y.storage=16):S.isMatrix3?(y.boundary=48,y.storage=48):S.isMatrix4?(y.boundary=64,y.storage=64):S.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",S),y}function g(S){const y=S.target;y.removeEventListener("dispose",g);const x=a.indexOf(y.__bindingPointIndex);a.splice(x,1),r.deleteBuffer(i[y.id]),delete i[y.id],delete s[y.id]}function m(){for(const S in i)r.deleteBuffer(i[S]);a=[],i={},s={}}return{bind:l,update:c,dispose:m}}class R_{constructor(e={}){const{canvas:t=_m(),context:n=null,depth:i=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=a;const p=new Uint32Array(4),v=new Int32Array(4);let g=null,m=null;const S=[],y=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=at,this.toneMapping=Ui,this.toneMappingExposure=1;const x=this;let P=!1,R=0,A=0,I=null,T=-1,_=null;const M=new rt,L=new rt;let U=null;const N=new Ae(0);let F=0,k=t.width,W=t.height,V=1,K=null,$=null;const J=new rt(0,0,k,W),oe=new rt(0,0,k,W);let Re=!1;const j=new Yc;let ne=!1,ue=!1;const ee=new me,ve=new me,Te=new C,X=new rt,Le={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Q=!1;function ye(){return I===null?V:1}let D=n;function _e(E,z){return t.getContext(E,z)}try{const E={alpha:!0,depth:i,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Nc}`),t.addEventListener("webglcontextlost",se,!1),t.addEventListener("webglcontextrestored",Ce,!1),t.addEventListener("webglcontextcreationerror",Ee,!1),D===null){const z="webgl2";if(D=_e(z,E),D===null)throw _e(z)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let fe,ae,le,Se,de,w,b,G,ie,re,te,Pe,ge,be,Ye,ce,Ie,He,Ge,De,it,We,ct,B;function xe(){fe=new Nv(D),fe.init(),We=new __(D,fe),ae=new Rv(D,fe,e,We),le=new g_(D,fe),ae.reverseDepthBuffer&&d&&le.buffers.depth.setReversed(!0),Se=new Bv(D),de=new n_,w=new x_(D,fe,le,de,ae,We,Se),b=new Iv(x),G=new Uv(x),ie=new Xm(D),ct=new Av(D,ie),re=new Fv(D,ie,Se,ct),te=new zv(D,re,ie,Se),Ge=new kv(D,ae,w),ce=new Pv(de),Pe=new t_(x,b,G,fe,ae,ct,ce),ge=new A_(x,de),be=new r_,Ye=new u_(fe),He=new wv(x,b,G,le,te,f,l),Ie=new p_(x,te,ae),B=new C_(D,Se,ae,le),De=new Cv(D,fe,Se),it=new Ov(D,fe,Se),Se.programs=Pe.programs,x.capabilities=ae,x.extensions=fe,x.properties=de,x.renderLists=be,x.shadowMap=Ie,x.state=le,x.info=Se}xe();const Z=new E_(x,D);this.xr=Z,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){const E=fe.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=fe.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(E){E!==void 0&&(V=E,this.setSize(k,W,!1))},this.getSize=function(E){return E.set(k,W)},this.setSize=function(E,z,q=!0){if(Z.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}k=E,W=z,t.width=Math.floor(E*V),t.height=Math.floor(z*V),q===!0&&(t.style.width=E+"px",t.style.height=z+"px"),this.setViewport(0,0,E,z)},this.getDrawingBufferSize=function(E){return E.set(k*V,W*V).floor()},this.setDrawingBufferSize=function(E,z,q){k=E,W=z,V=q,t.width=Math.floor(E*q),t.height=Math.floor(z*q),this.setViewport(0,0,E,z)},this.getCurrentViewport=function(E){return E.copy(M)},this.getViewport=function(E){return E.copy(J)},this.setViewport=function(E,z,q,Y){E.isVector4?J.set(E.x,E.y,E.z,E.w):J.set(E,z,q,Y),le.viewport(M.copy(J).multiplyScalar(V).round())},this.getScissor=function(E){return E.copy(oe)},this.setScissor=function(E,z,q,Y){E.isVector4?oe.set(E.x,E.y,E.z,E.w):oe.set(E,z,q,Y),le.scissor(L.copy(oe).multiplyScalar(V).round())},this.getScissorTest=function(){return Re},this.setScissorTest=function(E){le.setScissorTest(Re=E)},this.setOpaqueSort=function(E){K=E},this.setTransparentSort=function(E){$=E},this.getClearColor=function(E){return E.copy(He.getClearColor())},this.setClearColor=function(){He.setClearColor.apply(He,arguments)},this.getClearAlpha=function(){return He.getClearAlpha()},this.setClearAlpha=function(){He.setClearAlpha.apply(He,arguments)},this.clear=function(E=!0,z=!0,q=!0){let Y=0;if(E){let H=!1;if(I!==null){const pe=I.texture.format;H=pe===Hc||pe===Vc||pe===zc}if(H){const pe=I.texture.type,we=pe===yi||pe===er||pe===Is||pe===tr||pe===Bc||pe===kc,Ne=He.getClearColor(),Fe=He.getClearAlpha(),je=Ne.r,Ze=Ne.g,Oe=Ne.b;we?(p[0]=je,p[1]=Ze,p[2]=Oe,p[3]=Fe,D.clearBufferuiv(D.COLOR,0,p)):(v[0]=je,v[1]=Ze,v[2]=Oe,v[3]=Fe,D.clearBufferiv(D.COLOR,0,v))}else Y|=D.COLOR_BUFFER_BIT}z&&(Y|=D.DEPTH_BUFFER_BIT),q&&(Y|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),D.clear(Y)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",se,!1),t.removeEventListener("webglcontextrestored",Ce,!1),t.removeEventListener("webglcontextcreationerror",Ee,!1),be.dispose(),Ye.dispose(),de.dispose(),b.dispose(),G.dispose(),te.dispose(),ct.dispose(),B.dispose(),Pe.dispose(),Z.dispose(),Z.removeEventListener("sessionstart",bu),Z.removeEventListener("sessionend",Tu),Vi.stop()};function se(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),P=!0}function Ce(){console.log("THREE.WebGLRenderer: Context Restored."),P=!1;const E=Se.autoReset,z=Ie.enabled,q=Ie.autoUpdate,Y=Ie.needsUpdate,H=Ie.type;xe(),Se.autoReset=E,Ie.enabled=z,Ie.autoUpdate=q,Ie.needsUpdate=Y,Ie.type=H}function Ee(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Ke(E){const z=E.target;z.removeEventListener("dispose",Ke),Tt(z)}function Tt(E){Kt(E),de.remove(E)}function Kt(E){const z=de.get(E).programs;z!==void 0&&(z.forEach(function(q){Pe.releaseProgram(q)}),E.isShaderMaterial&&Pe.releaseShaderCache(E))}this.renderBufferDirect=function(E,z,q,Y,H,pe){z===null&&(z=Le);const we=H.isMesh&&H.matrixWorld.determinant()<0,Ne=xp(E,z,q,Y,H);le.setMaterial(Y,we);let Fe=q.index,je=1;if(Y.wireframe===!0){if(Fe=re.getWireframeAttribute(q),Fe===void 0)return;je=2}const Ze=q.drawRange,Oe=q.attributes.position;let ut=Ze.start*je,_t=(Ze.start+Ze.count)*je;pe!==null&&(ut=Math.max(ut,pe.start*je),_t=Math.min(_t,(pe.start+pe.count)*je)),Fe!==null?(ut=Math.max(ut,0),_t=Math.min(_t,Fe.count)):Oe!=null&&(ut=Math.max(ut,0),_t=Math.min(_t,Oe.count));const yt=_t-ut;if(yt<0||yt===1/0)return;ct.setup(H,Y,Ne,q,Fe);let ln,ft=De;if(Fe!==null&&(ln=ie.get(Fe),ft=it,ft.setIndex(ln)),H.isMesh)Y.wireframe===!0?(le.setLineWidth(Y.wireframeLinewidth*ye()),ft.setMode(D.LINES)):ft.setMode(D.TRIANGLES);else if(H.isLine){let ke=Y.linewidth;ke===void 0&&(ke=1),le.setLineWidth(ke*ye()),H.isLineSegments?ft.setMode(D.LINES):H.isLineLoop?ft.setMode(D.LINE_LOOP):ft.setMode(D.LINE_STRIP)}else H.isPoints?ft.setMode(D.POINTS):H.isSprite&&ft.setMode(D.TRIANGLES);if(H.isBatchedMesh)if(H._multiDrawInstances!==null)ft.renderMultiDrawInstances(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount,H._multiDrawInstances);else if(fe.get("WEBGL_multi_draw"))ft.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{const ke=H._multiDrawStarts,ii=H._multiDrawCounts,pt=H._multiDrawCount,In=Fe?ie.get(Fe).bytesPerElement:1,ur=de.get(Y).currentProgram.getUniforms();for(let fn=0;fn<pt;fn++)ur.setValue(D,"_gl_DrawID",fn),ft.render(ke[fn]/In,ii[fn])}else if(H.isInstancedMesh)ft.renderInstances(ut,yt,H.count);else if(q.isInstancedBufferGeometry){const ke=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,ii=Math.min(q.instanceCount,ke);ft.renderInstances(ut,yt,ii)}else ft.render(ut,yt)};function mt(E,z,q){E.transparent===!0&&E.side===bn&&E.forceSinglePass===!1?(E.side=un,E.needsUpdate=!0,ra(E,z,q),E.side=_i,E.needsUpdate=!0,ra(E,z,q),E.side=bn):ra(E,z,q)}this.compile=function(E,z,q=null){q===null&&(q=E),m=Ye.get(q),m.init(z),y.push(m),q.traverseVisible(function(H){H.isLight&&H.layers.test(z.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),E!==q&&E.traverseVisible(function(H){H.isLight&&H.layers.test(z.layers)&&(m.pushLight(H),H.castShadow&&m.pushShadow(H))}),m.setupLights();const Y=new Set;return E.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;const pe=H.material;if(pe)if(Array.isArray(pe))for(let we=0;we<pe.length;we++){const Ne=pe[we];mt(Ne,q,H),Y.add(Ne)}else mt(pe,q,H),Y.add(pe)}),y.pop(),m=null,Y},this.compileAsync=function(E,z,q=null){const Y=this.compile(E,z,q);return new Promise(H=>{function pe(){if(Y.forEach(function(we){de.get(we).currentProgram.isReady()&&Y.delete(we)}),Y.size===0){H(E);return}setTimeout(pe,10)}fe.get("KHR_parallel_shader_compile")!==null?pe():setTimeout(pe,10)})};let Pn=null;function ni(E){Pn&&Pn(E)}function bu(){Vi.stop()}function Tu(){Vi.start()}const Vi=new of;Vi.setAnimationLoop(ni),typeof self<"u"&&Vi.setContext(self),this.setAnimationLoop=function(E){Pn=E,Z.setAnimationLoop(E),E===null?Vi.stop():Vi.start()},Z.addEventListener("sessionstart",bu),Z.addEventListener("sessionend",Tu),this.render=function(E,z){if(z!==void 0&&z.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),Z.enabled===!0&&Z.isPresenting===!0&&(Z.cameraAutoUpdate===!0&&Z.updateCamera(z),z=Z.getCamera()),E.isScene===!0&&E.onBeforeRender(x,E,z,I),m=Ye.get(E,y.length),m.init(z),y.push(m),ve.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),j.setFromProjectionMatrix(ve),ue=this.localClippingEnabled,ne=ce.init(this.clippingPlanes,ue),g=be.get(E,S.length),g.init(),S.push(g),Z.enabled===!0&&Z.isPresenting===!0){const pe=x.xr.getDepthSensingMesh();pe!==null&&Do(pe,z,-1/0,x.sortObjects)}Do(E,z,0,x.sortObjects),g.finish(),x.sortObjects===!0&&g.sort(K,$),Q=Z.enabled===!1||Z.isPresenting===!1||Z.hasDepthSensing()===!1,Q&&He.addToRenderList(g,E),this.info.render.frame++,ne===!0&&ce.beginShadows();const q=m.state.shadowsArray;Ie.render(q,E,z),ne===!0&&ce.endShadows(),this.info.autoReset===!0&&this.info.reset();const Y=g.opaque,H=g.transmissive;if(m.setupLights(),z.isArrayCamera){const pe=z.cameras;if(H.length>0)for(let we=0,Ne=pe.length;we<Ne;we++){const Fe=pe[we];wu(Y,H,E,Fe)}Q&&He.render(E);for(let we=0,Ne=pe.length;we<Ne;we++){const Fe=pe[we];Eu(g,E,Fe,Fe.viewport)}}else H.length>0&&wu(Y,H,E,z),Q&&He.render(E),Eu(g,E,z);I!==null&&(w.updateMultisampleRenderTarget(I),w.updateRenderTargetMipmap(I)),E.isScene===!0&&E.onAfterRender(x,E,z),ct.resetDefaultState(),T=-1,_=null,y.pop(),y.length>0?(m=y[y.length-1],ne===!0&&ce.setGlobalState(x.clippingPlanes,m.state.camera)):m=null,S.pop(),S.length>0?g=S[S.length-1]:g=null};function Do(E,z,q,Y){if(E.visible===!1)return;if(E.layers.test(z.layers)){if(E.isGroup)q=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(z);else if(E.isLight)m.pushLight(E),E.castShadow&&m.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||j.intersectsSprite(E)){Y&&X.setFromMatrixPosition(E.matrixWorld).applyMatrix4(ve);const we=te.update(E),Ne=E.material;Ne.visible&&g.push(E,we,Ne,q,X.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||j.intersectsObject(E))){const we=te.update(E),Ne=E.material;if(Y&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),X.copy(E.boundingSphere.center)):(we.boundingSphere===null&&we.computeBoundingSphere(),X.copy(we.boundingSphere.center)),X.applyMatrix4(E.matrixWorld).applyMatrix4(ve)),Array.isArray(Ne)){const Fe=we.groups;for(let je=0,Ze=Fe.length;je<Ze;je++){const Oe=Fe[je],ut=Ne[Oe.materialIndex];ut&&ut.visible&&g.push(E,we,ut,q,X.z,Oe)}}else Ne.visible&&g.push(E,we,Ne,q,X.z,null)}}const pe=E.children;for(let we=0,Ne=pe.length;we<Ne;we++)Do(pe[we],z,q,Y)}function Eu(E,z,q,Y){const H=E.opaque,pe=E.transmissive,we=E.transparent;m.setupLightsView(q),ne===!0&&ce.setGlobalState(x.clippingPlanes,q),Y&&le.viewport(M.copy(Y)),H.length>0&&ia(H,z,q),pe.length>0&&ia(pe,z,q),we.length>0&&ia(we,z,q),le.buffers.depth.setTest(!0),le.buffers.depth.setMask(!0),le.buffers.color.setMask(!0),le.setPolygonOffset(!1)}function wu(E,z,q,Y){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[Y.id]===void 0&&(m.state.transmissionRenderTarget[Y.id]=new hn(1,1,{generateMipmaps:!0,type:fe.has("EXT_color_buffer_half_float")||fe.has("EXT_color_buffer_float")?Cn:yi,minFilter:qn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Xe.workingColorSpace}));const pe=m.state.transmissionRenderTarget[Y.id],we=Y.viewport||M;pe.setSize(we.z,we.w);const Ne=x.getRenderTarget();x.setRenderTarget(pe),x.getClearColor(N),F=x.getClearAlpha(),F<1&&x.setClearColor(16777215,.5),x.clear(),Q&&He.render(q);const Fe=x.toneMapping;x.toneMapping=Ui;const je=Y.viewport;if(Y.viewport!==void 0&&(Y.viewport=void 0),m.setupLightsView(Y),ne===!0&&ce.setGlobalState(x.clippingPlanes,Y),ia(E,q,Y),w.updateMultisampleRenderTarget(pe),w.updateRenderTargetMipmap(pe),fe.has("WEBGL_multisampled_render_to_texture")===!1){let Ze=!1;for(let Oe=0,ut=z.length;Oe<ut;Oe++){const _t=z[Oe],yt=_t.object,ln=_t.geometry,ft=_t.material,ke=_t.group;if(ft.side===bn&&yt.layers.test(Y.layers)){const ii=ft.side;ft.side=un,ft.needsUpdate=!0,Au(yt,q,Y,ln,ft,ke),ft.side=ii,ft.needsUpdate=!0,Ze=!0}}Ze===!0&&(w.updateMultisampleRenderTarget(pe),w.updateRenderTargetMipmap(pe))}x.setRenderTarget(Ne),x.setClearColor(N,F),je!==void 0&&(Y.viewport=je),x.toneMapping=Fe}function ia(E,z,q){const Y=z.isScene===!0?z.overrideMaterial:null;for(let H=0,pe=E.length;H<pe;H++){const we=E[H],Ne=we.object,Fe=we.geometry,je=Y===null?we.material:Y,Ze=we.group;Ne.layers.test(q.layers)&&Au(Ne,z,q,Fe,je,Ze)}}function Au(E,z,q,Y,H,pe){E.onBeforeRender(x,z,q,Y,H,pe),E.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),H.onBeforeRender(x,z,q,Y,E,pe),H.transparent===!0&&H.side===bn&&H.forceSinglePass===!1?(H.side=un,H.needsUpdate=!0,x.renderBufferDirect(q,z,Y,H,E,pe),H.side=_i,H.needsUpdate=!0,x.renderBufferDirect(q,z,Y,H,E,pe),H.side=bn):x.renderBufferDirect(q,z,Y,H,E,pe),E.onAfterRender(x,z,q,Y,H,pe)}function ra(E,z,q){z.isScene!==!0&&(z=Le);const Y=de.get(E),H=m.state.lights,pe=m.state.shadowsArray,we=H.state.version,Ne=Pe.getParameters(E,H.state,pe,z,q),Fe=Pe.getProgramCacheKey(Ne);let je=Y.programs;Y.environment=E.isMeshStandardMaterial?z.environment:null,Y.fog=z.fog,Y.envMap=(E.isMeshStandardMaterial?G:b).get(E.envMap||Y.environment),Y.envMapRotation=Y.environment!==null&&E.envMap===null?z.environmentRotation:E.envMapRotation,je===void 0&&(E.addEventListener("dispose",Ke),je=new Map,Y.programs=je);let Ze=je.get(Fe);if(Ze!==void 0){if(Y.currentProgram===Ze&&Y.lightsStateVersion===we)return Ru(E,Ne),Ze}else Ne.uniforms=Pe.getUniforms(E),E.onBeforeCompile(Ne,x),Ze=Pe.acquireProgram(Ne,Fe),je.set(Fe,Ze),Y.uniforms=Ne.uniforms;const Oe=Y.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Oe.clippingPlanes=ce.uniform),Ru(E,Ne),Y.needsLights=yp(E),Y.lightsStateVersion=we,Y.needsLights&&(Oe.ambientLightColor.value=H.state.ambient,Oe.lightProbe.value=H.state.probe,Oe.directionalLights.value=H.state.directional,Oe.directionalLightShadows.value=H.state.directionalShadow,Oe.spotLights.value=H.state.spot,Oe.spotLightShadows.value=H.state.spotShadow,Oe.rectAreaLights.value=H.state.rectArea,Oe.ltc_1.value=H.state.rectAreaLTC1,Oe.ltc_2.value=H.state.rectAreaLTC2,Oe.pointLights.value=H.state.point,Oe.pointLightShadows.value=H.state.pointShadow,Oe.hemisphereLights.value=H.state.hemi,Oe.directionalShadowMap.value=H.state.directionalShadowMap,Oe.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Oe.spotShadowMap.value=H.state.spotShadowMap,Oe.spotLightMatrix.value=H.state.spotLightMatrix,Oe.spotLightMap.value=H.state.spotLightMap,Oe.pointShadowMap.value=H.state.pointShadowMap,Oe.pointShadowMatrix.value=H.state.pointShadowMatrix),Y.currentProgram=Ze,Y.uniformsList=null,Ze}function Cu(E){if(E.uniformsList===null){const z=E.currentProgram.getUniforms();E.uniformsList=eo.seqWithValue(z.seq,E.uniforms)}return E.uniformsList}function Ru(E,z){const q=de.get(E);q.outputColorSpace=z.outputColorSpace,q.batching=z.batching,q.batchingColor=z.batchingColor,q.instancing=z.instancing,q.instancingColor=z.instancingColor,q.instancingMorph=z.instancingMorph,q.skinning=z.skinning,q.morphTargets=z.morphTargets,q.morphNormals=z.morphNormals,q.morphColors=z.morphColors,q.morphTargetsCount=z.morphTargetsCount,q.numClippingPlanes=z.numClippingPlanes,q.numIntersection=z.numClipIntersection,q.vertexAlphas=z.vertexAlphas,q.vertexTangents=z.vertexTangents,q.toneMapping=z.toneMapping}function xp(E,z,q,Y,H){z.isScene!==!0&&(z=Le),w.resetTextureUnits();const pe=z.fog,we=Y.isMeshStandardMaterial?z.environment:null,Ne=I===null?x.outputColorSpace:I.isXRRenderTarget===!0?I.texture.colorSpace:nn,Fe=(Y.isMeshStandardMaterial?G:b).get(Y.envMap||we),je=Y.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,Ze=!!q.attributes.tangent&&(!!Y.normalMap||Y.anisotropy>0),Oe=!!q.morphAttributes.position,ut=!!q.morphAttributes.normal,_t=!!q.morphAttributes.color;let yt=Ui;Y.toneMapped&&(I===null||I.isXRRenderTarget===!0)&&(yt=x.toneMapping);const ln=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ft=ln!==void 0?ln.length:0,ke=de.get(Y),ii=m.state.lights;if(ne===!0&&(ue===!0||E!==_)){const xn=E===_&&Y.id===T;ce.setState(Y,E,xn)}let pt=!1;Y.version===ke.__version?(ke.needsLights&&ke.lightsStateVersion!==ii.state.version||ke.outputColorSpace!==Ne||H.isBatchedMesh&&ke.batching===!1||!H.isBatchedMesh&&ke.batching===!0||H.isBatchedMesh&&ke.batchingColor===!0&&H.colorTexture===null||H.isBatchedMesh&&ke.batchingColor===!1&&H.colorTexture!==null||H.isInstancedMesh&&ke.instancing===!1||!H.isInstancedMesh&&ke.instancing===!0||H.isSkinnedMesh&&ke.skinning===!1||!H.isSkinnedMesh&&ke.skinning===!0||H.isInstancedMesh&&ke.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&ke.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&ke.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&ke.instancingMorph===!1&&H.morphTexture!==null||ke.envMap!==Fe||Y.fog===!0&&ke.fog!==pe||ke.numClippingPlanes!==void 0&&(ke.numClippingPlanes!==ce.numPlanes||ke.numIntersection!==ce.numIntersection)||ke.vertexAlphas!==je||ke.vertexTangents!==Ze||ke.morphTargets!==Oe||ke.morphNormals!==ut||ke.morphColors!==_t||ke.toneMapping!==yt||ke.morphTargetsCount!==ft)&&(pt=!0):(pt=!0,ke.__version=Y.version);let In=ke.currentProgram;pt===!0&&(In=ra(Y,z,H));let ur=!1,fn=!1,is=!1;const Mt=In.getUniforms(),kn=ke.uniforms;if(le.useProgram(In.program)&&(ur=!0,fn=!0,is=!0),Y.id!==T&&(T=Y.id,fn=!0),ur||_!==E){le.buffers.depth.getReversed()?(ee.copy(E.projectionMatrix),Mm(ee),Sm(ee),Mt.setValue(D,"projectionMatrix",ee)):Mt.setValue(D,"projectionMatrix",E.projectionMatrix),Mt.setValue(D,"viewMatrix",E.matrixWorldInverse);const Si=Mt.map.cameraPosition;Si!==void 0&&Si.setValue(D,Te.setFromMatrixPosition(E.matrixWorld)),ae.logarithmicDepthBuffer&&Mt.setValue(D,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(Y.isMeshPhongMaterial||Y.isMeshToonMaterial||Y.isMeshLambertMaterial||Y.isMeshBasicMaterial||Y.isMeshStandardMaterial||Y.isShaderMaterial)&&Mt.setValue(D,"isOrthographic",E.isOrthographicCamera===!0),_!==E&&(_=E,fn=!0,is=!0)}if(H.isSkinnedMesh){Mt.setOptional(D,H,"bindMatrix"),Mt.setOptional(D,H,"bindMatrixInverse");const xn=H.skeleton;xn&&(xn.boneTexture===null&&xn.computeBoneTexture(),Mt.setValue(D,"boneTexture",xn.boneTexture,w))}H.isBatchedMesh&&(Mt.setOptional(D,H,"batchingTexture"),Mt.setValue(D,"batchingTexture",H._matricesTexture,w),Mt.setOptional(D,H,"batchingIdTexture"),Mt.setValue(D,"batchingIdTexture",H._indirectTexture,w),Mt.setOptional(D,H,"batchingColorTexture"),H._colorsTexture!==null&&Mt.setValue(D,"batchingColorTexture",H._colorsTexture,w));const rs=q.morphAttributes;if((rs.position!==void 0||rs.normal!==void 0||rs.color!==void 0)&&Ge.update(H,q,In),(fn||ke.receiveShadow!==H.receiveShadow)&&(ke.receiveShadow=H.receiveShadow,Mt.setValue(D,"receiveShadow",H.receiveShadow)),Y.isMeshGouraudMaterial&&Y.envMap!==null&&(kn.envMap.value=Fe,kn.flipEnvMap.value=Fe.isCubeTexture&&Fe.isRenderTargetTexture===!1?-1:1),Y.isMeshStandardMaterial&&Y.envMap===null&&z.environment!==null&&(kn.envMapIntensity.value=z.environmentIntensity),fn&&(Mt.setValue(D,"toneMappingExposure",x.toneMappingExposure),ke.needsLights&&_p(kn,is),pe&&Y.fog===!0&&ge.refreshFogUniforms(kn,pe),ge.refreshMaterialUniforms(kn,Y,V,W,m.state.transmissionRenderTarget[E.id]),eo.upload(D,Cu(ke),kn,w)),Y.isShaderMaterial&&Y.uniformsNeedUpdate===!0&&(eo.upload(D,Cu(ke),kn,w),Y.uniformsNeedUpdate=!1),Y.isSpriteMaterial&&Mt.setValue(D,"center",H.center),Mt.setValue(D,"modelViewMatrix",H.modelViewMatrix),Mt.setValue(D,"normalMatrix",H.normalMatrix),Mt.setValue(D,"modelMatrix",H.matrixWorld),Y.isShaderMaterial||Y.isRawShaderMaterial){const xn=Y.uniformsGroups;for(let Si=0,bi=xn.length;Si<bi;Si++){const Pu=xn[Si];B.update(Pu,In),B.bind(Pu,In)}}return In}function _p(E,z){E.ambientLightColor.needsUpdate=z,E.lightProbe.needsUpdate=z,E.directionalLights.needsUpdate=z,E.directionalLightShadows.needsUpdate=z,E.pointLights.needsUpdate=z,E.pointLightShadows.needsUpdate=z,E.spotLights.needsUpdate=z,E.spotLightShadows.needsUpdate=z,E.rectAreaLights.needsUpdate=z,E.hemisphereLights.needsUpdate=z}function yp(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return A},this.getRenderTarget=function(){return I},this.setRenderTargetTextures=function(E,z,q){de.get(E.texture).__webglTexture=z,de.get(E.depthTexture).__webglTexture=q;const Y=de.get(E);Y.__hasExternalTextures=!0,Y.__autoAllocateDepthBuffer=q===void 0,Y.__autoAllocateDepthBuffer||fe.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Y.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,z){const q=de.get(E);q.__webglFramebuffer=z,q.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(E,z=0,q=0){I=E,R=z,A=q;let Y=!0,H=null,pe=!1,we=!1;if(E){const Fe=de.get(E);if(Fe.__useDefaultFramebuffer!==void 0)le.bindFramebuffer(D.FRAMEBUFFER,null),Y=!1;else if(Fe.__webglFramebuffer===void 0)w.setupRenderTarget(E);else if(Fe.__hasExternalTextures)w.rebindTextures(E,de.get(E.texture).__webglTexture,de.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const Oe=E.depthTexture;if(Fe.__boundDepthTexture!==Oe){if(Oe!==null&&de.has(Oe)&&(E.width!==Oe.image.width||E.height!==Oe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");w.setupDepthRenderbuffer(E)}}const je=E.texture;(je.isData3DTexture||je.isDataArrayTexture||je.isCompressedArrayTexture)&&(we=!0);const Ze=de.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ze[z])?H=Ze[z][q]:H=Ze[z],pe=!0):E.samples>0&&w.useMultisampledRTT(E)===!1?H=de.get(E).__webglMultisampledFramebuffer:Array.isArray(Ze)?H=Ze[q]:H=Ze,M.copy(E.viewport),L.copy(E.scissor),U=E.scissorTest}else M.copy(J).multiplyScalar(V).floor(),L.copy(oe).multiplyScalar(V).floor(),U=Re;if(le.bindFramebuffer(D.FRAMEBUFFER,H)&&Y&&le.drawBuffers(E,H),le.viewport(M),le.scissor(L),le.setScissorTest(U),pe){const Fe=de.get(E.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+z,Fe.__webglTexture,q)}else if(we){const Fe=de.get(E.texture),je=z||0;D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,Fe.__webglTexture,q||0,je)}T=-1},this.readRenderTargetPixels=function(E,z,q,Y,H,pe,we){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ne=de.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&we!==void 0&&(Ne=Ne[we]),Ne){le.bindFramebuffer(D.FRAMEBUFFER,Ne);try{const Fe=E.texture,je=Fe.format,Ze=Fe.type;if(!ae.textureFormatReadable(je)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!ae.textureTypeReadable(Ze)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=E.width-Y&&q>=0&&q<=E.height-H&&D.readPixels(z,q,Y,H,We.convert(je),We.convert(Ze),pe)}finally{const Fe=I!==null?de.get(I).__webglFramebuffer:null;le.bindFramebuffer(D.FRAMEBUFFER,Fe)}}},this.readRenderTargetPixelsAsync=async function(E,z,q,Y,H,pe,we){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ne=de.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&we!==void 0&&(Ne=Ne[we]),Ne){const Fe=E.texture,je=Fe.format,Ze=Fe.type;if(!ae.textureFormatReadable(je))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ae.textureTypeReadable(Ze))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(z>=0&&z<=E.width-Y&&q>=0&&q<=E.height-H){le.bindFramebuffer(D.FRAMEBUFFER,Ne);const Oe=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Oe),D.bufferData(D.PIXEL_PACK_BUFFER,pe.byteLength,D.STREAM_READ),D.readPixels(z,q,Y,H,We.convert(je),We.convert(Ze),0);const ut=I!==null?de.get(I).__webglFramebuffer:null;le.bindFramebuffer(D.FRAMEBUFFER,ut);const _t=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await ym(D,_t,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Oe),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,pe),D.deleteBuffer(Oe),D.deleteSync(_t),pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,z=null,q=0){E.isTexture!==!0&&(xs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),z=arguments[0]||null,E=arguments[1]);const Y=Math.pow(2,-q),H=Math.floor(E.image.width*Y),pe=Math.floor(E.image.height*Y),we=z!==null?z.x:0,Ne=z!==null?z.y:0;w.setTexture2D(E,0),D.copyTexSubImage2D(D.TEXTURE_2D,q,0,0,we,Ne,H,pe),le.unbindTexture()},this.copyTextureToTexture=function(E,z,q=null,Y=null,H=0){E.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture function signature has changed."),Y=arguments[0]||null,E=arguments[1],z=arguments[2],H=arguments[3]||0,q=null);let pe,we,Ne,Fe,je,Ze,Oe,ut,_t;const yt=E.isCompressedTexture?E.mipmaps[H]:E.image;q!==null?(pe=q.max.x-q.min.x,we=q.max.y-q.min.y,Ne=q.isBox3?q.max.z-q.min.z:1,Fe=q.min.x,je=q.min.y,Ze=q.isBox3?q.min.z:0):(pe=yt.width,we=yt.height,Ne=yt.depth||1,Fe=0,je=0,Ze=0),Y!==null?(Oe=Y.x,ut=Y.y,_t=Y.z):(Oe=0,ut=0,_t=0);const ln=We.convert(z.format),ft=We.convert(z.type);let ke;z.isData3DTexture?(w.setTexture3D(z,0),ke=D.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(w.setTexture2DArray(z,0),ke=D.TEXTURE_2D_ARRAY):(w.setTexture2D(z,0),ke=D.TEXTURE_2D),D.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),D.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),D.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);const ii=D.getParameter(D.UNPACK_ROW_LENGTH),pt=D.getParameter(D.UNPACK_IMAGE_HEIGHT),In=D.getParameter(D.UNPACK_SKIP_PIXELS),ur=D.getParameter(D.UNPACK_SKIP_ROWS),fn=D.getParameter(D.UNPACK_SKIP_IMAGES);D.pixelStorei(D.UNPACK_ROW_LENGTH,yt.width),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,yt.height),D.pixelStorei(D.UNPACK_SKIP_PIXELS,Fe),D.pixelStorei(D.UNPACK_SKIP_ROWS,je),D.pixelStorei(D.UNPACK_SKIP_IMAGES,Ze);const is=E.isDataArrayTexture||E.isData3DTexture,Mt=z.isDataArrayTexture||z.isData3DTexture;if(E.isRenderTargetTexture||E.isDepthTexture){const kn=de.get(E),rs=de.get(z),xn=de.get(kn.__renderTarget),Si=de.get(rs.__renderTarget);le.bindFramebuffer(D.READ_FRAMEBUFFER,xn.__webglFramebuffer),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,Si.__webglFramebuffer);for(let bi=0;bi<Ne;bi++)is&&D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,de.get(E).__webglTexture,H,Ze+bi),E.isDepthTexture?(Mt&&D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,de.get(z).__webglTexture,H,_t+bi),D.blitFramebuffer(Fe,je,pe,we,Oe,ut,pe,we,D.DEPTH_BUFFER_BIT,D.NEAREST)):Mt?D.copyTexSubImage3D(ke,H,Oe,ut,_t+bi,Fe,je,pe,we):D.copyTexSubImage2D(ke,H,Oe,ut,_t+bi,Fe,je,pe,we);le.bindFramebuffer(D.READ_FRAMEBUFFER,null),le.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else Mt?E.isDataTexture||E.isData3DTexture?D.texSubImage3D(ke,H,Oe,ut,_t,pe,we,Ne,ln,ft,yt.data):z.isCompressedArrayTexture?D.compressedTexSubImage3D(ke,H,Oe,ut,_t,pe,we,Ne,ln,yt.data):D.texSubImage3D(ke,H,Oe,ut,_t,pe,we,Ne,ln,ft,yt):E.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,H,Oe,ut,pe,we,ln,ft,yt.data):E.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,H,Oe,ut,yt.width,yt.height,ln,yt.data):D.texSubImage2D(D.TEXTURE_2D,H,Oe,ut,pe,we,ln,ft,yt);D.pixelStorei(D.UNPACK_ROW_LENGTH,ii),D.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pt),D.pixelStorei(D.UNPACK_SKIP_PIXELS,In),D.pixelStorei(D.UNPACK_SKIP_ROWS,ur),D.pixelStorei(D.UNPACK_SKIP_IMAGES,fn),H===0&&z.generateMipmaps&&D.generateMipmap(ke),le.unbindTexture()},this.copyTextureToTexture3D=function(E,z,q=null,Y=null,H=0){return E.isTexture!==!0&&(xs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),q=arguments[0]||null,Y=arguments[1]||null,E=arguments[2],z=arguments[3],H=arguments[4]||0),xs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,z,q,Y,H)},this.initRenderTarget=function(E){de.get(E).__webglFramebuffer===void 0&&w.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?w.setTextureCube(E,0):E.isData3DTexture?w.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?w.setTexture2DArray(E,0):w.setTexture2D(E,0),le.unbindTexture()},this.resetState=function(){R=0,A=0,I=null,le.reset(),ct.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return gi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=Xe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Xe._getUnpackColorSpace()}}class $c{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ae(e),this.near=t,this.far=n}clone(){return new $c(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class P_ extends dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Bt,this.environmentIntensity=1,this.environmentRotation=new Bt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class ff{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=mc,this.updateRanges=[],this.version=0,this.uuid=Bn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,s=this.stride;i<s;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Bn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Bn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const rn=new C;class Ns{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.applyMatrix4(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.applyNormalMatrix(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)rn.fromBufferAttribute(this,t),rn.transformDirection(e),this.setXYZ(t,rn.x,rn.y,rn.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=On(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=vt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=vt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=vt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=vt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=vt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=On(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=On(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=On(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=On(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),i=vt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=vt(t,this.array),n=vt(n,this.array),i=vt(i,this.array),s=vt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return new wt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Ns(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Eo extends dn{static get type(){return"SpriteMaterial"}constructor(e){super(),this.isSpriteMaterial=!0,this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let Er;const cs=new C,wr=new C,Ar=new C,Cr=new Ue,us=new Ue,pf=new me,wa=new C,hs=new C,Aa=new C,Rh=new Ue,ol=new Ue,Ph=new Ue;class Jc extends dt{constructor(e=new Eo){if(super(),this.isSprite=!0,this.type="Sprite",Er===void 0){Er=new It;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new ff(t,5);Er.setIndex([0,1,2,0,2,3]),Er.setAttribute("position",new Ns(n,3,0,!1)),Er.setAttribute("uv",new Ns(n,2,3,!1))}this.geometry=Er,this.material=e,this.center=new Ue(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),wr.setFromMatrixScale(this.matrixWorld),pf.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Ar.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&wr.multiplyScalar(-Ar.z);const n=this.material.rotation;let i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));const a=this.center;Ca(wa.set(-.5,-.5,0),Ar,a,wr,i,s),Ca(hs.set(.5,-.5,0),Ar,a,wr,i,s),Ca(Aa.set(.5,.5,0),Ar,a,wr,i,s),Rh.set(0,0),ol.set(1,0),Ph.set(1,1);let o=e.ray.intersectTriangle(wa,hs,Aa,!1,cs);if(o===null&&(Ca(hs.set(-.5,.5,0),Ar,a,wr,i,s),ol.set(0,1),o=e.ray.intersectTriangle(wa,Aa,hs,!1,cs),o===null))return;const l=e.ray.origin.distanceTo(cs);l<e.near||l>e.far||t.push({distance:l,point:cs.clone(),uv:Tn.getInterpolation(cs,wa,hs,Aa,Rh,ol,Ph,new Ue),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function Ca(r,e,t,n,i,s){Cr.subVectors(r,t).addScalar(.5).multiply(n),i!==void 0?(us.x=s*Cr.x-i*Cr.y,us.y=i*Cr.x+s*Cr.y):us.copy(Cr),r.copy(e),r.x+=us.x,r.y+=us.y,r.applyMatrix4(pf)}const Ih=new C,Dh=new rt,Lh=new rt,I_=new C,Uh=new me,Ra=new C,ll=new Qn,Nh=new me,cl=new js;class mf extends Ft{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Uu,this.bindMatrix=new me,this.bindMatrixInverse=new me,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Xt),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ra),this.boundingBox.expandByPoint(Ra)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Qn),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,Ra),this.boundingSphere.expandByPoint(Ra)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ll.copy(this.boundingSphere),ll.applyMatrix4(i),e.ray.intersectsSphere(ll)!==!1&&(Nh.copy(i).invert(),cl.copy(e.ray).applyMatrix4(Nh),!(this.boundingBox!==null&&cl.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,cl)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new rt,t=this.geometry.attributes.skinWeight;for(let n=0,i=t.count;n<i;n++){e.fromBufferAttribute(t,n);const s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Uu?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===Gp?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const n=this.skeleton,i=this.geometry;Dh.fromBufferAttribute(i.attributes.skinIndex,e),Lh.fromBufferAttribute(i.attributes.skinWeight,e),Ih.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){const a=Lh.getComponent(s);if(a!==0){const o=Dh.getComponent(s);Uh.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),t.addScaledVector(I_.copy(Ih).applyMatrix4(Uh),a)}}return t.applyMatrix4(this.bindMatrixInverse)}}class oo extends dt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Qc extends Pt{constructor(e=null,t=1,n=1,i,s,a,o,l,c=kt,u=kt,h,d){super(null,a,o,l,c,u,i,s,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Fh=new me,D_=new me;class Ys{constructor(e=[],t=[]){this.uuid=Bn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new me)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const n=new me;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){const e=this.bones,t=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let s=0,a=e.length;s<a;s++){const o=e[s]?e[s].matrixWorld:D_;Fh.multiplyMatrices(o,t[s]),Fh.toArray(n,s*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new Ys(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const n=new Qc(t,e,e,An,wn);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){const i=this.bones[t];if(i.name===e)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,i=e.bones.length;n<i;n++){const s=e.bones[n];let a=t[s];a===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),a=new oo),this.bones.push(a),this.boneInverses.push(new me().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){const e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,n=this.boneInverses;for(let i=0,s=t.length;i<s;i++){const a=t[i];e.bones.push(a.uuid);const o=n[i];e.boneInverses.push(o.toArray())}return e}}class vc extends wt{constructor(e,t,n,i=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Rr=new me,Oh=new me,Pa=[],Bh=new Xt,L_=new me,ds=new Ft,fs=new Qn;class xc extends Ft{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new vc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,L_)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Xt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Rr),Bh.copy(e.boundingBox).applyMatrix4(Rr),this.boundingBox.union(Bh)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Qn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Rr),fs.copy(e.boundingSphere).applyMatrix4(Rr),this.boundingSphere.union(fs)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,a=e*s+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(e,t){const n=this.matrixWorld,i=this.count;if(ds.geometry=this.geometry,ds.material=this.material,ds.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fs.copy(this.boundingSphere),fs.applyMatrix4(n),e.ray.intersectsSphere(fs)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,Rr),Oh.multiplyMatrices(n,Rr),ds.matrixWorld=Oh,ds.raycast(e,Pa);for(let a=0,o=Pa.length;a<o;a++){const l=Pa[a];l.instanceId=s,l.object=this,t.push(l)}Pa.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new vc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const n=t.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Qc(new Float32Array(i*this.count),i,this.count,Mo,wn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*e;s[l]=o,s.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Fs extends dn{static get type(){return"LineBasicMaterial"}constructor(e){super(),this.isLineBasicMaterial=!0,this.color=new Ae(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const lo=new C,co=new C,kh=new me,ps=new js,Ia=new Qn,ul=new C,zh=new C;class wo extends dt{constructor(e=new It,t=new Fs){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,s=t.count;i<s;i++)lo.fromBufferAttribute(t,i-1),co.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=lo.distanceTo(co);e.setAttribute("lineDistance",new Ut(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,s=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ia.copy(n.boundingSphere),Ia.applyMatrix4(i),Ia.radius+=s,e.ray.intersectsSphere(Ia)===!1)return;kh.copy(i).invert(),ps.copy(e.ray).applyMatrix4(kh);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const f=Math.max(0,a.start),p=Math.min(u.count,a.start+a.count);for(let v=f,g=p-1;v<g;v+=c){const m=u.getX(v),S=u.getX(v+1),y=Da(this,e,ps,l,m,S);y&&t.push(y)}if(this.isLineLoop){const v=u.getX(p-1),g=u.getX(f),m=Da(this,e,ps,l,v,g);m&&t.push(m)}}else{const f=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let v=f,g=p-1;v<g;v+=c){const m=Da(this,e,ps,l,v,v+1);m&&t.push(m)}if(this.isLineLoop){const v=Da(this,e,ps,l,p-1,f);v&&t.push(v)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Da(r,e,t,n,i,s){const a=r.geometry.attributes.position;if(lo.fromBufferAttribute(a,i),co.fromBufferAttribute(a,s),t.distanceSqToSegment(lo,co,ul,zh)>n)return;ul.applyMatrix4(r.matrixWorld);const l=e.ray.origin.distanceTo(ul);if(!(l<e.near||l>e.far))return{distance:l,point:zh.clone().applyMatrix4(r.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:r}}const Vh=new C,Hh=new C;class gf extends wo{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,s=t.count;i<s;i+=2)Vh.fromBufferAttribute(t,i),Hh.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+Vh.distanceTo(Hh);e.setAttribute("lineDistance",new Ut(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class vf extends wo{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class xf extends dn{static get type(){return"PointsMaterial"}constructor(e){super(),this.isPointsMaterial=!0,this.color=new Ae(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Gh=new me,_c=new js,La=new Qn,Ua=new C;class _f extends dt{constructor(e=new It,t=new xf){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,s=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),La.copy(n.boundingSphere),La.applyMatrix4(i),La.radius+=s,e.ray.intersectsSphere(La)===!1)return;Gh.copy(i).invert(),_c.copy(e.ray).applyMatrix4(Gh);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=d,v=f;p<v;p++){const g=c.getX(p);Ua.fromBufferAttribute(h,g),Wh(Ua,g,l,i,e,t,this)}}else{const d=Math.max(0,a.start),f=Math.min(h.count,a.start+a.count);for(let p=d,v=f;p<v;p++)Ua.fromBufferAttribute(h,p),Wh(Ua,p,l,i,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Wh(r,e,t,n,i,s,a){const o=_c.distanceSqToPoint(r);if(o<t){const l=new C;_c.closestPointToPoint(r,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:a})}}class eu extends Pt{constructor(e,t,n,i,s,a,o,l,c){super(e,t,n,i,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class U_{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,i=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),s+=n.distanceTo(i),t.push(s),i=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){const n=this.getLengths();let i=0;const s=n.length;let a;t?a=t:a=e*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(s-1);const u=n[i],d=n[i+1]-u,f=(a-u)/d;return(i+f)/(s-1)}getTangent(e,t){let i=e-1e-4,s=e+1e-4;i<0&&(i=0),s>1&&(s=1);const a=this.getPoint(i),o=this.getPoint(s),l=t||(a.isVector2?new Ue:new C);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){const n=new C,i=[],s=[],a=[],o=new C,l=new me;for(let f=0;f<=e;f++){const p=f/e;i[f]=this.getTangentAt(p,new C)}s[0]=new C,a[0]=new C;let c=Number.MAX_VALUE;const u=Math.abs(i[0].x),h=Math.abs(i[0].y),d=Math.abs(i[0].z);u<=c&&(c=u,n.set(1,0,0)),h<=c&&(c=h,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],o),a[0].crossVectors(i[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(i[f-1],i[f]),o.length()>Number.EPSILON){o.normalize();const p=Math.acos(Wt(i[f-1].dot(i[f]),-1,1));s[f].applyMatrix4(l.makeRotationAxis(o,p))}a[f].crossVectors(i[f],s[f])}if(t===!0){let f=Math.acos(Wt(s[0].dot(s[e]),-1,1));f/=e,i[0].dot(o.crossVectors(s[0],s[e]))>0&&(f=-f);for(let p=1;p<=e;p++)s[p].applyMatrix4(l.makeRotationAxis(i[p],f*p)),a[p].crossVectors(i[p],s[p])}return{tangents:i,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class tu extends It{constructor(e=1,t=1,n=1,i=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const u=[],h=[],d=[],f=[];let p=0;const v=[],g=n/2;let m=0;S(),a===!1&&(e>0&&y(!0),t>0&&y(!1)),this.setIndex(u),this.setAttribute("position",new Ut(h,3)),this.setAttribute("normal",new Ut(d,3)),this.setAttribute("uv",new Ut(f,2));function S(){const x=new C,P=new C;let R=0;const A=(t-e)/n;for(let I=0;I<=s;I++){const T=[],_=I/s,M=_*(t-e)+e;for(let L=0;L<=i;L++){const U=L/i,N=U*l+o,F=Math.sin(N),k=Math.cos(N);P.x=M*F,P.y=-_*n+g,P.z=M*k,h.push(P.x,P.y,P.z),x.set(F,A,k).normalize(),d.push(x.x,x.y,x.z),f.push(U,1-_),T.push(p++)}v.push(T)}for(let I=0;I<i;I++)for(let T=0;T<s;T++){const _=v[T][I],M=v[T+1][I],L=v[T+1][I+1],U=v[T][I+1];(e>0||T!==0)&&(u.push(_,M,U),R+=3),(t>0||T!==s-1)&&(u.push(M,L,U),R+=3)}c.addGroup(m,R,0),m+=R}function y(x){const P=p,R=new Ue,A=new C;let I=0;const T=x===!0?e:t,_=x===!0?1:-1;for(let L=1;L<=i;L++)h.push(0,g*_,0),d.push(0,_,0),f.push(.5,.5),p++;const M=p;for(let L=0;L<=i;L++){const N=L/i*l+o,F=Math.cos(N),k=Math.sin(N);A.x=T*k,A.y=g*_,A.z=T*F,h.push(A.x,A.y,A.z),d.push(0,_,0),R.x=F*.5+.5,R.y=k*.5*_+.5,f.push(R.x,R.y),p++}for(let L=0;L<i;L++){const U=P+L,N=M+L;x===!0?u.push(N,N+1,U):u.push(N+1,N,U),I+=3}c.addGroup(m,I,x===!0?1:2),m+=I}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new tu(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const N_={triangulate:function(r,e,t=2){const n=e&&e.length,i=n?e[0]*t:r.length;let s=yf(r,0,i,t,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c,u,h,d,f;if(n&&(s=z_(r,e,s,t)),r.length>80*t){o=c=r[0],l=u=r[1];for(let p=t;p<i;p+=t)h=r[p],d=r[p+1],h<o&&(o=h),d<l&&(l=d),h>c&&(c=h),d>u&&(u=d);f=Math.max(c-o,u-l),f=f!==0?32767/f:0}return Os(s,a,t,o,l,f,0),a}};function yf(r,e,t,n,i){let s,a;if(i===$_(r,e,t,n)>0)for(s=e;s<t;s+=n)a=Xh(s,r[s],r[s+1],a);else for(s=t-n;s>=e;s-=n)a=Xh(s,r[s],r[s+1],a);return a&&Ao(a,a.next)&&(ks(a),a=a.next),a}function ir(r,e){if(!r)return r;e||(e=r);let t=r,n;do if(n=!1,!t.steiner&&(Ao(t,t.next)||bt(t.prev,t,t.next)===0)){if(ks(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function Os(r,e,t,n,i,s,a){if(!r)return;!a&&s&&X_(r,n,i,s);let o=r,l,c;for(;r.prev!==r.next;){if(l=r.prev,c=r.next,s?O_(r,n,i,s):F_(r)){e.push(l.i/t|0),e.push(r.i/t|0),e.push(c.i/t|0),ks(r),r=c.next,o=c.next;continue}if(r=c,r===o){a?a===1?(r=B_(ir(r),e,t),Os(r,e,t,n,i,s,2)):a===2&&k_(r,e,t,n,i,s):Os(ir(r),e,t,n,i,s,1);break}}}function F_(r){const e=r.prev,t=r,n=r.next;if(bt(e,t,n)>=0)return!1;const i=e.x,s=t.x,a=n.x,o=e.y,l=t.y,c=n.y,u=i<s?i<a?i:a:s<a?s:a,h=o<l?o<c?o:c:l<c?l:c,d=i>s?i>a?i:a:s>a?s:a,f=o>l?o>c?o:c:l>c?l:c;let p=n.next;for(;p!==e;){if(p.x>=u&&p.x<=d&&p.y>=h&&p.y<=f&&Or(i,o,s,l,a,c,p.x,p.y)&&bt(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function O_(r,e,t,n){const i=r.prev,s=r,a=r.next;if(bt(i,s,a)>=0)return!1;const o=i.x,l=s.x,c=a.x,u=i.y,h=s.y,d=a.y,f=o<l?o<c?o:c:l<c?l:c,p=u<h?u<d?u:d:h<d?h:d,v=o>l?o>c?o:c:l>c?l:c,g=u>h?u>d?u:d:h>d?h:d,m=yc(f,p,e,t,n),S=yc(v,g,e,t,n);let y=r.prevZ,x=r.nextZ;for(;y&&y.z>=m&&x&&x.z<=S;){if(y.x>=f&&y.x<=v&&y.y>=p&&y.y<=g&&y!==i&&y!==a&&Or(o,u,l,h,c,d,y.x,y.y)&&bt(y.prev,y,y.next)>=0||(y=y.prevZ,x.x>=f&&x.x<=v&&x.y>=p&&x.y<=g&&x!==i&&x!==a&&Or(o,u,l,h,c,d,x.x,x.y)&&bt(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;y&&y.z>=m;){if(y.x>=f&&y.x<=v&&y.y>=p&&y.y<=g&&y!==i&&y!==a&&Or(o,u,l,h,c,d,y.x,y.y)&&bt(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;x&&x.z<=S;){if(x.x>=f&&x.x<=v&&x.y>=p&&x.y<=g&&x!==i&&x!==a&&Or(o,u,l,h,c,d,x.x,x.y)&&bt(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function B_(r,e,t){let n=r;do{const i=n.prev,s=n.next.next;!Ao(i,s)&&Mf(i,n,n.next,s)&&Bs(i,s)&&Bs(s,i)&&(e.push(i.i/t|0),e.push(n.i/t|0),e.push(s.i/t|0),ks(n),ks(n.next),n=r=s),n=n.next}while(n!==r);return ir(n)}function k_(r,e,t,n,i,s){let a=r;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Y_(a,o)){let l=Sf(a,o);a=ir(a,a.next),l=ir(l,l.next),Os(a,e,t,n,i,s,0),Os(l,e,t,n,i,s,0);return}o=o.next}a=a.next}while(a!==r)}function z_(r,e,t,n){const i=[];let s,a,o,l,c;for(s=0,a=e.length;s<a;s++)o=e[s]*n,l=s<a-1?e[s+1]*n:r.length,c=yf(r,o,l,n,!1),c===c.next&&(c.steiner=!0),i.push(q_(c));for(i.sort(V_),s=0;s<i.length;s++)t=H_(i[s],t);return t}function V_(r,e){return r.x-e.x}function H_(r,e){const t=G_(r,e);if(!t)return e;const n=Sf(t,r);return ir(n,n.next),ir(t,t.next)}function G_(r,e){let t=e,n=-1/0,i;const s=r.x,a=r.y;do{if(a<=t.y&&a>=t.next.y&&t.next.y!==t.y){const d=t.x+(a-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=s&&d>n&&(n=d,i=t.x<t.next.x?t:t.next,d===s))return i}t=t.next}while(t!==e);if(!i)return null;const o=i,l=i.x,c=i.y;let u=1/0,h;t=i;do s>=t.x&&t.x>=l&&s!==t.x&&Or(a<c?s:n,a,l,c,a<c?n:s,a,t.x,t.y)&&(h=Math.abs(a-t.y)/(s-t.x),Bs(t,r)&&(h<u||h===u&&(t.x>i.x||t.x===i.x&&W_(i,t)))&&(i=t,u=h)),t=t.next;while(t!==o);return i}function W_(r,e){return bt(r.prev,r,e.prev)<0&&bt(e.next,r,r.next)<0}function X_(r,e,t,n){let i=r;do i.z===0&&(i.z=yc(i.x,i.y,e,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==r);i.prevZ.nextZ=null,i.prevZ=null,j_(i)}function j_(r){let e,t,n,i,s,a,o,l,c=1;do{for(t=r,r=null,s=null,a=0;t;){for(a++,n=t,o=0,e=0;e<c&&(o++,n=n.nextZ,!!n);e++);for(l=c;o>0||l>0&&n;)o!==0&&(l===0||!n||t.z<=n.z)?(i=t,t=t.nextZ,o--):(i=n,n=n.nextZ,l--),s?s.nextZ=i:r=i,i.prevZ=s,s=i;t=n}s.nextZ=null,c*=2}while(a>1);return r}function yc(r,e,t,n,i){return r=(r-t)*i|0,e=(e-n)*i|0,r=(r|r<<8)&16711935,r=(r|r<<4)&252645135,r=(r|r<<2)&858993459,r=(r|r<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,r|e<<1}function q_(r){let e=r,t=r;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==r);return t}function Or(r,e,t,n,i,s,a,o){return(i-a)*(e-o)>=(r-a)*(s-o)&&(r-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(i-a)*(n-o)}function Y_(r,e){return r.next.i!==e.i&&r.prev.i!==e.i&&!K_(r,e)&&(Bs(r,e)&&Bs(e,r)&&Z_(r,e)&&(bt(r.prev,r,e.prev)||bt(r,e.prev,e))||Ao(r,e)&&bt(r.prev,r,r.next)>0&&bt(e.prev,e,e.next)>0)}function bt(r,e,t){return(e.y-r.y)*(t.x-e.x)-(e.x-r.x)*(t.y-e.y)}function Ao(r,e){return r.x===e.x&&r.y===e.y}function Mf(r,e,t,n){const i=Fa(bt(r,e,t)),s=Fa(bt(r,e,n)),a=Fa(bt(t,n,r)),o=Fa(bt(t,n,e));return!!(i!==s&&a!==o||i===0&&Na(r,t,e)||s===0&&Na(r,n,e)||a===0&&Na(t,r,n)||o===0&&Na(t,e,n))}function Na(r,e,t){return e.x<=Math.max(r.x,t.x)&&e.x>=Math.min(r.x,t.x)&&e.y<=Math.max(r.y,t.y)&&e.y>=Math.min(r.y,t.y)}function Fa(r){return r>0?1:r<0?-1:0}function K_(r,e){let t=r;do{if(t.i!==r.i&&t.next.i!==r.i&&t.i!==e.i&&t.next.i!==e.i&&Mf(t,t.next,r,e))return!0;t=t.next}while(t!==r);return!1}function Bs(r,e){return bt(r.prev,r,r.next)<0?bt(r,e,r.next)>=0&&bt(r,r.prev,e)>=0:bt(r,e,r.prev)<0||bt(r,r.next,e)<0}function Z_(r,e){let t=r,n=!1;const i=(r.x+e.x)/2,s=(r.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&i<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==r);return n}function Sf(r,e){const t=new Mc(r.i,r.x,r.y),n=new Mc(e.i,e.x,e.y),i=r.next,s=e.prev;return r.next=e,e.prev=r,t.next=i,i.prev=t,n.next=t,t.prev=n,s.next=n,n.prev=s,n}function Xh(r,e,t,n){const i=new Mc(r,e,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function ks(r){r.next.prev=r.prev,r.prev.next=r.next,r.prevZ&&(r.prevZ.nextZ=r.nextZ),r.nextZ&&(r.nextZ.prevZ=r.prevZ)}function Mc(r,e,t){this.i=r,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function $_(r,e,t,n){let i=0;for(let s=e,a=t-n;s<t;s+=n)i+=(r[a]-r[s])*(r[s+1]+r[a+1]),a=s;return i}class nu{static area(e){const t=e.length;let n=0;for(let i=t-1,s=0;s<t;i=s++)n+=e[i].x*e[s].y-e[s].x*e[i].y;return n*.5}static isClockWise(e){return nu.area(e)<0}static triangulateShape(e,t){const n=[],i=[],s=[];jh(e),qh(n,e);let a=e.length;t.forEach(jh);for(let l=0;l<t.length;l++)i.push(a),a+=t[l].length,qh(n,t[l]);const o=N_.triangulate(n,i);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function jh(r){const e=r.length;e>2&&r[e-1].equals(r[0])&&r.pop()}function qh(r,e){for(let t=0;t<e.length;t++)r.push(e[t].x),r.push(e[t].y)}class J_ extends At{static get type(){return"RawShaderMaterial"}constructor(e){super(e),this.isRawShaderMaterial=!0}}class Ks extends dn{static get type(){return"MeshStandardMaterial"}constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Ae(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xs,this.normalScale=new Ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bt,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class ei extends Ks{static get type(){return"MeshPhysicalMaterial"}constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new Ue(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Wt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ae(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ae(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ae(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class hl extends dn{static get type(){return"MeshPhongMaterial"}constructor(e){super(),this.isMeshPhongMaterial=!0,this.color=new Ae(16777215),this.specular=new Ae(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xs,this.normalScale=new Ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bt,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.specular.copy(e.specular),this.shininess=e.shininess,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Q_ extends dn{static get type(){return"MeshNormalMaterial"}constructor(e){super(),this.isMeshNormalMaterial=!0,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xs,this.normalScale=new Ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(e)}copy(e){return super.copy(e),this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.flatShading=e.flatShading,this}}class e5 extends dn{static get type(){return"MeshLambertMaterial"}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new Ae(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ae(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xs,this.normalScale=new Ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bt,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}function Oa(r,e,t){return!r||!t&&r.constructor===e?r:typeof e.BYTES_PER_ELEMENT=="number"?new e(r):Array.prototype.slice.call(r)}function t5(r){return ArrayBuffer.isView(r)&&!(r instanceof DataView)}function n5(r){function e(i,s){return r[i]-r[s]}const t=r.length,n=new Array(t);for(let i=0;i!==t;++i)n[i]=i;return n.sort(e),n}function Yh(r,e,t){const n=r.length,i=new r.constructor(n);for(let s=0,a=0;a!==n;++s){const o=t[s]*e;for(let l=0;l!==e;++l)i[a++]=r[o+l]}return i}function bf(r,e,t,n){let i=1,s=r[0];for(;s!==void 0&&s[n]===void 0;)s=r[i++];if(s===void 0)return;let a=s[n];if(a!==void 0)if(Array.isArray(a))do a=s[n],a!==void 0&&(e.push(s.time),t.push.apply(t,a)),s=r[i++];while(s!==void 0);else if(a.toArray!==void 0)do a=s[n],a!==void 0&&(e.push(s.time),a.toArray(t,t.length)),s=r[i++];while(s!==void 0);else do a=s[n],a!==void 0&&(e.push(s.time),t.push(a)),s=r[i++];while(s!==void 0)}class Zs{constructor(e,t,n,i){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let n=this._cachedIndex,i=t[n],s=t[n-1];e:{t:{let a;n:{i:if(!(e<i)){for(let o=n+2;;){if(i===void 0){if(e<s)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(s=i,i=t[++n],e<i)break t}a=t.length;break n}if(!(e>=s)){const o=t[1];e<o&&(n=2,s=o);for(let l=n-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=s,s=t[--n-1],e>=s)break t}a=n,n=0;break n}break e}for(;n<a;){const o=n+a>>>1;e<t[o]?a=o:n=o+1}if(i=t[n],s=t[n-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,s,i)}return this.interpolate_(n,s,e,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=e*i;for(let a=0;a!==i;++a)t[a]=n[s+a];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class i5 extends Zs{constructor(e,t,n,i){super(e,t,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Ur,endingEnd:Ur}}intervalChanged_(e,t,n){const i=this.parameterPositions;let s=e-2,a=e+1,o=i[s],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case Nr:s=e,o=2*t-n;break;case so:s=i.length-2,o=t+i[s]-i[s+1];break;default:s=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Nr:a=e,l=2*n-t;break;case so:a=1,l=n+i[1]-i[0];break;default:a=e-1,l=t}const c=(n-t)*.5,u=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=s*u,this._offsetNext=a*u}interpolate_(e,t,n,i){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(i-t),v=p*p,g=v*p,m=-d*g+2*d*v-d*p,S=(1+d)*g+(-1.5-2*d)*v+(-.5+d)*p+1,y=(-1-f)*g+(1.5+f)*v+.5*p,x=f*g-f*v;for(let P=0;P!==o;++P)s[P]=m*a[u+P]+S*a[c+P]+y*a[l+P]+x*a[h+P];return s}}class Tf extends Zs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,u=(n-t)/(i-t),h=1-u;for(let d=0;d!==o;++d)s[d]=a[c+d]*h+a[l+d]*u;return s}}class r5 extends Zs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e){return this.copySampleValue_(e-1)}}class ti{constructor(e,t,n,i){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Oa(t,this.TimeBufferType),this.values=Oa(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Oa(e.times,Array),values:Oa(e.values,Array)};const i=e.getInterpolation();i!==e.DefaultInterpolation&&(n.interpolation=i)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new r5(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Tf(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new i5(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case Ds:t=this.InterpolantFactoryMethodDiscrete;break;case Ls:t=this.InterpolantFactoryMethodLinear;break;case Lo:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ds;case this.InterpolantFactoryMethodLinear:return Ls;case this.InterpolantFactoryMethodSmooth:return Lo}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let n=0,i=t.length;n!==i;++n)t[n]*=e}return this}trim(e,t){const n=this.times,i=n.length;let s=0,a=i-1;for(;s!==i&&n[s]<e;)++s;for(;a!==-1&&n[a]>t;)--a;if(++a,s!==0||a!==i){s>=a&&(a=Math.max(a,1),s=a-1);const o=this.getValueSize();this.times=n.slice(s,a),this.values=this.values.slice(s*o,a*o)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);const n=this.times,i=this.values,s=n.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==s;o++){const l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(i!==void 0&&t5(i))for(let o=0,l=i.length;o!==l;++o){const c=i[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===Lo,s=e.length-1;let a=1;for(let o=1;o<s;++o){let l=!1;const c=e[o],u=e[o+1];if(c!==u&&(o!==1||c!==e[0]))if(i)l=!0;else{const h=o*n,d=h-n,f=h+n;for(let p=0;p!==n;++p){const v=t[h+p];if(v!==t[d+p]||v!==t[f+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];const h=o*n,d=a*n;for(let f=0;f!==n;++f)t[d+f]=t[h+f]}++a}}if(s>0){e[a]=e[s];for(let o=s*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),n=this.constructor,i=new n(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}}ti.prototype.TimeBufferType=Float32Array;ti.prototype.ValueBufferType=Float32Array;ti.prototype.DefaultInterpolation=Ls;class es extends ti{constructor(e,t,n){super(e,t,n)}}es.prototype.ValueTypeName="bool";es.prototype.ValueBufferType=Array;es.prototype.DefaultInterpolation=Ds;es.prototype.InterpolantFactoryMethodLinear=void 0;es.prototype.InterpolantFactoryMethodSmooth=void 0;class Ef extends ti{}Ef.prototype.ValueTypeName="color";class rr extends ti{}rr.prototype.ValueTypeName="number";class s5 extends Zs{constructor(e,t,n,i){super(e,t,n,i)}interpolate_(e,t,n,i){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(i-t);let c=e*o;for(let u=c+o;c!==u;c+=4)ht.slerpFlat(s,0,a,c-o,a,c,l);return s}}class Oi extends ti{InterpolantFactoryMethodLinear(e){return new s5(this.times,this.values,this.getValueSize(),e)}}Oi.prototype.ValueTypeName="quaternion";Oi.prototype.InterpolantFactoryMethodSmooth=void 0;class ts extends ti{constructor(e,t,n){super(e,t,n)}}ts.prototype.ValueTypeName="string";ts.prototype.ValueBufferType=Array;ts.prototype.DefaultInterpolation=Ds;ts.prototype.InterpolantFactoryMethodLinear=void 0;ts.prototype.InterpolantFactoryMethodSmooth=void 0;class sr extends ti{}sr.prototype.ValueTypeName="vector";class uo{constructor(e="",t=-1,n=[],i=Gc){this.name=e,this.tracks=n,this.duration=t,this.blendMode=i,this.uuid=Bn(),this.duration<0&&this.resetDuration()}static parse(e){const t=[],n=e.tracks,i=1/(e.fps||1);for(let a=0,o=n.length;a!==o;++a)t.push(o5(n[a]).scale(i));const s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s}static toJSON(e){const t=[],n=e.tracks,i={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let s=0,a=n.length;s!==a;++s)t.push(ti.toJSON(n[s]));return i}static CreateFromMorphTargetSequence(e,t,n,i){const s=t.length,a=[];for(let o=0;o<s;o++){let l=[],c=[];l.push((o+s-1)%s,o,(o+1)%s),c.push(0,1,0);const u=n5(l);l=Yh(l,1,u),c=Yh(c,1,u),!i&&l[0]===0&&(l.push(s),c.push(c[0])),a.push(new rr(".morphTargetInfluences["+t[o].name+"]",l,c).scale(1/n))}return new this(e,-1,a)}static findByName(e,t){let n=e;if(!Array.isArray(e)){const i=e;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===t)return n[i];return null}static CreateClipsFromMorphTargetSequences(e,t,n){const i={},s=/^([\w-]*?)([\d]+)$/;for(let o=0,l=e.length;o<l;o++){const c=e[o],u=c.name.match(s);if(u&&u.length>1){const h=u[1];let d=i[h];d||(i[h]=d=[]),d.push(c)}}const a=[];for(const o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],t,n));return a}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const n=function(h,d,f,p,v){if(f.length!==0){const g=[],m=[];bf(f,g,m,p),g.length!==0&&v.push(new h(d,g,m))}},i=[],s=e.name||"default",a=e.fps||30,o=e.blendMode;let l=e.length||-1;const c=e.hierarchy||[];for(let h=0;h<c.length;h++){const d=c[h].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const f={};let p;for(p=0;p<d.length;p++)if(d[p].morphTargets)for(let v=0;v<d[p].morphTargets.length;v++)f[d[p].morphTargets[v]]=-1;for(const v in f){const g=[],m=[];for(let S=0;S!==d[p].morphTargets.length;++S){const y=d[p];g.push(y.time),m.push(y.morphTarget===v?1:0)}i.push(new rr(".morphTargetInfluence["+v+"]",g,m))}l=f.length*a}else{const f=".bones["+t[h].name+"]";n(sr,f+".position",d,"pos",i),n(Oi,f+".quaternion",d,"rot",i),n(sr,f+".scale",d,"scl",i)}}return i.length===0?null:new this(s,l,i,o)}resetDuration(){const e=this.tracks;let t=0;for(let n=0,i=e.length;n!==i;++n){const s=this.tracks[n];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function a5(r){switch(r.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return rr;case"vector":case"vector2":case"vector3":case"vector4":return sr;case"color":return Ef;case"quaternion":return Oi;case"bool":case"boolean":return es;case"string":return ts}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+r)}function o5(r){if(r.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=a5(r.type);if(r.times===void 0){const t=[],n=[];bf(r.keys,t,n,"value"),r.times=t,r.values=n}return e.parse!==void 0?e.parse(r):new e(r.name,r.times,r.values,r.interpolation)}const Li={enabled:!1,files:{},add:function(r,e){this.enabled!==!1&&(this.files[r]=e)},get:function(r){if(this.enabled!==!1)return this.files[r]},remove:function(r){delete this.files[r]},clear:function(){this.files={}}};class l5{constructor(e,t,n){const i=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(u){o++,s===!1&&i.onStart!==void 0&&i.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,i.onProgress!==void 0&&i.onProgress(u,a,o),a===o&&(s=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(u){i.onError!==void 0&&i.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){const h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=c.length;h<d;h+=2){const f=c[h],p=c[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return p}return null}}}const c5=new l5;class Zn{constructor(e){this.manager=e!==void 0?e:c5,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){const n=this;return new Promise(function(i,s){n.load(e,i,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}}Zn.DEFAULT_MATERIAL_NAME="__DEFAULT";const ci={};class u5 extends Error{constructor(e,t){super(e),this.response=t}}class zs extends Zn{constructor(e){super(e)}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=Li.get(e);if(s!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0),s;if(ci[e]!==void 0){ci[e].push({onLoad:t,onProgress:n,onError:i});return}ci[e]=[],ci[e].push({onLoad:t,onProgress:n,onError:i});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const u=ci[e],h=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),f=d?parseInt(d):0,p=f!==0;let v=0;const g=new ReadableStream({start(m){S();function S(){h.read().then(({done:y,value:x})=>{if(y)m.close();else{v+=x.byteLength;const P=new ProgressEvent("progress",{lengthComputable:p,loaded:v,total:f});for(let R=0,A=u.length;R<A;R++){const I=u[R];I.onProgress&&I.onProgress(P)}m.enqueue(x),S()}},y=>{m.error(y)})}}});return new Response(g)}else throw new u5(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(u=>new DOMParser().parseFromString(u,o));case"json":return c.json();default:if(o===void 0)return c.text();{const h=/charset="?([^;"\s]*)"?/i.exec(o),d=h&&h[1]?h[1].toLowerCase():void 0,f=new TextDecoder(d);return c.arrayBuffer().then(p=>f.decode(p))}}}).then(c=>{Li.add(e,c);const u=ci[e];delete ci[e];for(let h=0,d=u.length;h<d;h++){const f=u[h];f.onLoad&&f.onLoad(c)}}).catch(c=>{const u=ci[e];if(u===void 0)throw this.manager.itemError(e),c;delete ci[e];for(let h=0,d=u.length;h<d;h++){const f=u[h];f.onError&&f.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}}class h5 extends Zn{constructor(e){super(e)}load(e,t,n,i){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,a=Li.get(e);if(a!==void 0)return s.manager.itemStart(e),setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a;const o=Us("img");function l(){u(),Li.add(e,this),t&&t(this),s.manager.itemEnd(e)}function c(h){u(),i&&i(h),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),s.manager.itemStart(e),o.src=e,o}}class wf extends Zn{constructor(e){super(e)}load(e,t,n,i){const s=new Pt,a=new h5(this.manager);return a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(e,function(o){s.image=o,s.needsUpdate=!0,t!==void 0&&t(s)},n,i),s}}class $s extends dt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ae(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}}class d5 extends $s{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(dt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ae(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}}const dl=new me,Kh=new C,Zh=new C;class iu{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ue(512,512),this.map=null,this.mapPass=null,this.matrix=new me,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Yc,this._frameExtents=new Ue(1,1),this._viewportCount=1,this._viewports=[new rt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;Kh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Kh),Zh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Zh),t.updateMatrixWorld(),dl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(dl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(dl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class f5 extends iu{constructor(){super(new Qt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){const t=this.camera,n=Yr*2*e.angle*this.focus,i=this.mapSize.width/this.mapSize.height,s=e.distance||t.far;(n!==t.fov||i!==t.aspect||s!==t.far)&&(t.fov=n,t.aspect=i,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class Af extends $s{constructor(e,t,n=0,i=Math.PI/3,s=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(dt.DEFAULT_UP),this.updateMatrix(),this.target=new dt,this.distance=n,this.angle=i,this.penumbra=s,this.decay=a,this.map=null,this.shadow=new f5}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}const $h=new me,ms=new C,fl=new C;class p5 extends iu{constructor(){super(new Qt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new Ue(4,2),this._viewportCount=6,this._viewports=[new rt(2,1,1,1),new rt(0,1,1,1),new rt(3,1,1,1),new rt(1,1,1,1),new rt(3,0,1,1),new rt(1,0,1,1)],this._cubeDirections=[new C(1,0,0),new C(-1,0,0),new C(0,0,1),new C(0,0,-1),new C(0,1,0),new C(0,-1,0)],this._cubeUps=[new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,1,0),new C(0,0,1),new C(0,0,-1)]}updateMatrices(e,t=0){const n=this.camera,i=this.matrix,s=e.distance||n.far;s!==n.far&&(n.far=s,n.updateProjectionMatrix()),ms.setFromMatrixPosition(e.matrixWorld),n.position.copy(ms),fl.copy(n.position),fl.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(fl),n.updateMatrixWorld(),i.makeTranslation(-ms.x,-ms.y,-ms.z),$h.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix($h)}}class ho extends $s{constructor(e,t,n=0,i=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new p5}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}}class m5 extends iu{constructor(){super(new bo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class ru extends $s{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(dt.DEFAULT_UP),this.updateMatrix(),this.target=new dt,this.shadow=new m5}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class g5 extends $s{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class Hr{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let n=0,i=e.length;n<i;n++)t+=String.fromCharCode(e[n]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}class v5 extends Zn{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,n,i){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,a=Li.get(e);if(a!==void 0){if(s.manager.itemStart(e),a.then){a.then(c=>{t&&t(c),s.manager.itemEnd(e)}).catch(c=>{i&&i(c)});return}return setTimeout(function(){t&&t(a),s.manager.itemEnd(e)},0),a}const o={};o.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",o.headers=this.requestHeader;const l=fetch(e,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return Li.add(e,c),t&&t(c),s.manager.itemEnd(e),c}).catch(function(c){i&&i(c),Li.remove(e),s.manager.itemError(e),s.manager.itemEnd(e)});Li.add(e,l),s.manager.itemStart(e)}}class x5{constructor(e=!0){this.autoStart=e,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=Jh(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let e=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const t=Jh();e=(t-this.oldTime)/1e3,this.oldTime=t,this.elapsedTime+=e}return e}}function Jh(){return performance.now()}class _5{constructor(e,t,n){this.binding=e,this.valueSize=n;let i,s,a;switch(t){case"quaternion":i=this._slerp,s=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,s=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,s=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=s,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(e,t){const n=this.buffer,i=this.valueSize,s=e*i+i;let a=this.cumulativeWeight;if(a===0){for(let o=0;o!==i;++o)n[s+o]=n[o];a=t}else{a+=t;const o=t/a;this._mixBufferRegion(n,s,0,o,i)}this.cumulativeWeight=a}accumulateAdditive(e){const t=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(t,i,0,e,n),this.cumulativeWeightAdditive+=e}apply(e){const t=this.valueSize,n=this.buffer,i=e*t+t,s=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,s<1){const l=t*this._origIndex;this._mixBufferRegion(n,i,l,1-s,t)}a>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*t,1,t);for(let l=t,c=t+t;l!==c;++l)if(n[l]!==n[l+t]){o.setValue(n,i);break}}saveOriginalState(){const e=this.binding,t=this.buffer,n=this.valueSize,i=n*this._origIndex;e.getValue(t,i);for(let s=n,a=i;s!==a;++s)t[s]=t[i+s%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){const e=this.valueSize*3;this.binding.setValue(this.buffer,e)}_setAdditiveIdentityNumeric(){const e=this._addIndex*this.valueSize,t=e+this.valueSize;for(let n=e;n<t;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){const e=this._origIndex*this.valueSize,t=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[t+n]=this.buffer[e+n]}_select(e,t,n,i,s){if(i>=.5)for(let a=0;a!==s;++a)e[t+a]=e[n+a]}_slerp(e,t,n,i){ht.slerpFlat(e,t,e,t,e,n,i)}_slerpAdditive(e,t,n,i,s){const a=this._workIndex*s;ht.multiplyQuaternionsFlat(e,a,e,t,e,n),ht.slerpFlat(e,t,e,t,e,a,i)}_lerp(e,t,n,i,s){const a=1-i;for(let o=0;o!==s;++o){const l=t+o;e[l]=e[l]*a+e[n+o]*i}}_lerpAdditive(e,t,n,i,s){for(let a=0;a!==s;++a){const o=t+a;e[o]=e[o]+e[n+a]*i}}}const su="\\[\\]\\.:\\/",y5=new RegExp("["+su+"]","g"),au="[^"+su+"]",M5="[^"+su.replace("\\.","")+"]",S5=/((?:WC+[\/:])*)/.source.replace("WC",au),b5=/(WCOD+)?/.source.replace("WCOD",M5),T5=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",au),E5=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",au),w5=new RegExp("^"+S5+b5+T5+E5+"$"),A5=["material","materials","bones","map"];class C5{constructor(e,t,n){const i=n||ot.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,i)}getValue(e,t){this.bind();const n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(e,t)}setValue(e,t){const n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,s=n.length;i!==s;++i)n[i].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}}class ot{constructor(e,t,n){this.path=t,this.parsedPath=n||ot.parseTrackName(t),this.node=ot.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new ot.Composite(e,t,n):new ot(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(y5,"")}static parseTrackName(e){const t=w5.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){const s=n.nodeName.substring(i+1);A5.indexOf(s)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=s)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){const n=function(s){for(let a=0;a<s.length;a++){const o=s[a];if(o.name===t||o.uuid===t)return o;const l=n(o.children);if(l)return l}return null},i=n(e.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)e[t++]=n[i]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const n=this.resolvedProperty;for(let i=0,s=n.length;i!==s;++i)n[i]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,n=t.objectName,i=t.propertyName;let s=t.propertyIndex;if(e||(e=ot.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const a=e[i];if(a===void 0){const c=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(i==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=s}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}ot.Composite=C5;ot.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ot.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ot.prototype.GetterByBindingType=[ot.prototype._getValue_direct,ot.prototype._getValue_array,ot.prototype._getValue_arrayElement,ot.prototype._getValue_toArray];ot.prototype.SetterByBindingTypeAndVersioning=[[ot.prototype._setValue_direct,ot.prototype._setValue_direct_setNeedsUpdate,ot.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ot.prototype._setValue_array,ot.prototype._setValue_array_setNeedsUpdate,ot.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ot.prototype._setValue_arrayElement,ot.prototype._setValue_arrayElement_setNeedsUpdate,ot.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ot.prototype._setValue_fromArray,ot.prototype._setValue_fromArray_setNeedsUpdate,ot.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class R5{constructor(e,t,n=null,i=t.blendMode){this._mixer=e,this._clip=t,this._localRoot=n,this.blendMode=i;const s=t.tracks,a=s.length,o=new Array(a),l={endingStart:Ur,endingEnd:Ur};for(let c=0;c!==a;++c){const u=s[c].createInterpolant(null);o[c]=u,u.settings=l}this._interpolantSettings=l,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._weightInterpolant=null,this.loop=Wp,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(e){return this._startTime=e,this}setLoop(e,t){return this.loop=e,this.repetitions=t,this}setEffectiveWeight(e){return this.weight=e,this._effectiveWeight=this.enabled?e:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(e){return this._scheduleFading(e,0,1)}fadeOut(e){return this._scheduleFading(e,1,0)}crossFadeFrom(e,t,n){if(e.fadeOut(t),this.fadeIn(t),n){const i=this._clip.duration,s=e._clip.duration,a=s/i,o=i/s;e.warp(1,a,t),this.warp(o,1,t)}return this}crossFadeTo(e,t,n){return e.crossFadeFrom(this,t,n)}stopFading(){const e=this._weightInterpolant;return e!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}setEffectiveTimeScale(e){return this.timeScale=e,this._effectiveTimeScale=this.paused?0:e,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(e){return this.timeScale=this._clip.duration/e,this.stopWarping()}syncWith(e){return this.time=e.time,this.timeScale=e.timeScale,this.stopWarping()}halt(e){return this.warp(this._effectiveTimeScale,0,e)}warp(e,t,n){const i=this._mixer,s=i.time,a=this.timeScale;let o=this._timeScaleInterpolant;o===null&&(o=i._lendControlInterpolant(),this._timeScaleInterpolant=o);const l=o.parameterPositions,c=o.sampleValues;return l[0]=s,l[1]=s+n,c[0]=e/a,c[1]=t/a,this}stopWarping(){const e=this._timeScaleInterpolant;return e!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(e)),this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(e,t,n,i){if(!this.enabled){this._updateWeight(e);return}const s=this._startTime;if(s!==null){const l=(e-s)*n;l<0||n===0?t=0:(this._startTime=null,t=n*l)}t*=this._updateTimeScale(e);const a=this._updateTime(t),o=this._updateWeight(e);if(o>0){const l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case jp:for(let u=0,h=l.length;u!==h;++u)l[u].evaluate(a),c[u].accumulateAdditive(o);break;case Gc:default:for(let u=0,h=l.length;u!==h;++u)l[u].evaluate(a),c[u].accumulate(i,o)}}}_updateWeight(e){let t=0;if(this.enabled){t=this.weight;const n=this._weightInterpolant;if(n!==null){const i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=t,t}_updateTimeScale(e){let t=0;if(!this.paused){t=this.timeScale;const n=this._timeScaleInterpolant;if(n!==null){const i=n.evaluate(e)[0];t*=i,e>n.parameterPositions[1]&&(this.stopWarping(),t===0?this.paused=!0:this.timeScale=t)}}return this._effectiveTimeScale=t,t}_updateTime(e){const t=this._clip.duration,n=this.loop;let i=this.time+e,s=this._loopCount;const a=n===Xp;if(e===0)return s===-1?i:a&&(s&1)===1?t-i:i;if(n===Kd){s===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));e:{if(i>=t)i=t;else if(i<0)i=0;else{this.time=i;break e}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e<0?-1:1})}}else{if(s===-1&&(e>=0?(s=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),i>=t||i<0){const o=Math.floor(i/t);i-=t*o,s+=Math.abs(o);const l=this.repetitions-s;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=e>0?t:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:e>0?1:-1});else{if(l===1){const c=e<0;this._setEndings(c,!c,a)}else this._setEndings(!1,!1,a);this._loopCount=s,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this.time=i;if(a&&(s&1)===1)return t-i}return i}_setEndings(e,t,n){const i=this._interpolantSettings;n?(i.endingStart=Nr,i.endingEnd=Nr):(e?i.endingStart=this.zeroSlopeAtStart?Nr:Ur:i.endingStart=so,t?i.endingEnd=this.zeroSlopeAtEnd?Nr:Ur:i.endingEnd=so)}_scheduleFading(e,t,n){const i=this._mixer,s=i.time;let a=this._weightInterpolant;a===null&&(a=i._lendControlInterpolant(),this._weightInterpolant=a);const o=a.parameterPositions,l=a.sampleValues;return o[0]=s,l[0]=t,o[1]=s+e,l[1]=n,this}}const P5=new Float32Array(1);class Sc extends cr{constructor(e){super(),this._root=e,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1}_bindAction(e,t){const n=e._localRoot||this._root,i=e._clip.tracks,s=i.length,a=e._propertyBindings,o=e._interpolants,l=n.uuid,c=this._bindingsByRootAndName;let u=c[l];u===void 0&&(u={},c[l]=u);for(let h=0;h!==s;++h){const d=i[h],f=d.name;let p=u[f];if(p!==void 0)++p.referenceCount,a[h]=p;else{if(p=a[h],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,l,f));continue}const v=t&&t._propertyBindings[h].binding.parsedPath;p=new _5(ot.create(n,f,v),d.ValueTypeName,d.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,l,f),a[h]=p}o[h].resultBuffer=p.buffer}}_activateAction(e){if(!this._isActiveAction(e)){if(e._cacheIndex===null){const n=(e._localRoot||this._root).uuid,i=e._clip.uuid,s=this._actionsByClip[i];this._bindAction(e,s&&s.knownActions[0]),this._addInactiveAction(e,i,n)}const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const s=t[n];s.useCount++===0&&(this._lendBinding(s),s.saveOriginalState())}this._lendAction(e)}}_deactivateAction(e){if(this._isActiveAction(e)){const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const s=t[n];--s.useCount===0&&(s.restoreOriginalState(),this._takeBackBinding(s))}this._takeBackAction(e)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;const e=this;this.stats={actions:{get total(){return e._actions.length},get inUse(){return e._nActiveActions}},bindings:{get total(){return e._bindings.length},get inUse(){return e._nActiveBindings}},controlInterpolants:{get total(){return e._controlInterpolants.length},get inUse(){return e._nActiveControlInterpolants}}}}_isActiveAction(e){const t=e._cacheIndex;return t!==null&&t<this._nActiveActions}_addInactiveAction(e,t,n){const i=this._actions,s=this._actionsByClip;let a=s[t];if(a===void 0)a={knownActions:[e],actionByRoot:{}},e._byClipCacheIndex=0,s[t]=a;else{const o=a.knownActions;e._byClipCacheIndex=o.length,o.push(e)}e._cacheIndex=i.length,i.push(e),a.actionByRoot[n]=e}_removeInactiveAction(e){const t=this._actions,n=t[t.length-1],i=e._cacheIndex;n._cacheIndex=i,t[i]=n,t.pop(),e._cacheIndex=null;const s=e._clip.uuid,a=this._actionsByClip,o=a[s],l=o.knownActions,c=l[l.length-1],u=e._byClipCacheIndex;c._byClipCacheIndex=u,l[u]=c,l.pop(),e._byClipCacheIndex=null;const h=o.actionByRoot,d=(e._localRoot||this._root).uuid;delete h[d],l.length===0&&delete a[s],this._removeInactiveBindingsForAction(e)}_removeInactiveBindingsForAction(e){const t=e._propertyBindings;for(let n=0,i=t.length;n!==i;++n){const s=t[n];--s.referenceCount===0&&this._removeInactiveBinding(s)}}_lendAction(e){const t=this._actions,n=e._cacheIndex,i=this._nActiveActions++,s=t[i];e._cacheIndex=i,t[i]=e,s._cacheIndex=n,t[n]=s}_takeBackAction(e){const t=this._actions,n=e._cacheIndex,i=--this._nActiveActions,s=t[i];e._cacheIndex=i,t[i]=e,s._cacheIndex=n,t[n]=s}_addInactiveBinding(e,t,n){const i=this._bindingsByRootAndName,s=this._bindings;let a=i[t];a===void 0&&(a={},i[t]=a),a[n]=e,e._cacheIndex=s.length,s.push(e)}_removeInactiveBinding(e){const t=this._bindings,n=e.binding,i=n.rootNode.uuid,s=n.path,a=this._bindingsByRootAndName,o=a[i],l=t[t.length-1],c=e._cacheIndex;l._cacheIndex=c,t[c]=l,t.pop(),delete o[s],Object.keys(o).length===0&&delete a[i]}_lendBinding(e){const t=this._bindings,n=e._cacheIndex,i=this._nActiveBindings++,s=t[i];e._cacheIndex=i,t[i]=e,s._cacheIndex=n,t[n]=s}_takeBackBinding(e){const t=this._bindings,n=e._cacheIndex,i=--this._nActiveBindings,s=t[i];e._cacheIndex=i,t[i]=e,s._cacheIndex=n,t[n]=s}_lendControlInterpolant(){const e=this._controlInterpolants,t=this._nActiveControlInterpolants++;let n=e[t];return n===void 0&&(n=new Tf(new Float32Array(2),new Float32Array(2),1,P5),n.__cacheIndex=t,e[t]=n),n}_takeBackControlInterpolant(e){const t=this._controlInterpolants,n=e.__cacheIndex,i=--this._nActiveControlInterpolants,s=t[i];e.__cacheIndex=i,t[i]=e,s.__cacheIndex=n,t[n]=s}clipAction(e,t,n){const i=t||this._root,s=i.uuid;let a=typeof e=="string"?uo.findByName(i,e):e;const o=a!==null?a.uuid:e,l=this._actionsByClip[o];let c=null;if(n===void 0&&(a!==null?n=a.blendMode:n=Gc),l!==void 0){const h=l.actionByRoot[s];if(h!==void 0&&h.blendMode===n)return h;c=l.knownActions[0],a===null&&(a=c._clip)}if(a===null)return null;const u=new R5(this,a,t,n);return this._bindAction(u,c),this._addInactiveAction(u,o,s),u}existingAction(e,t){const n=t||this._root,i=n.uuid,s=typeof e=="string"?uo.findByName(n,e):e,a=s?s.uuid:e,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[i]||null}stopAllAction(){const e=this._actions,t=this._nActiveActions;for(let n=t-1;n>=0;--n)e[n].stop();return this}update(e){e*=this.timeScale;const t=this._actions,n=this._nActiveActions,i=this.time+=e,s=Math.sign(e),a=this._accuIndex^=1;for(let c=0;c!==n;++c)t[c]._update(i,e,s,a);const o=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)o[c].apply(a);return this}setTime(e){this.time=0;for(let t=0;t<this._actions.length;t++)this._actions[t].time=0;return this.update(e)}getRoot(){return this._root}uncacheClip(e){const t=this._actions,n=e.uuid,i=this._actionsByClip,s=i[n];if(s!==void 0){const a=s.knownActions;for(let o=0,l=a.length;o!==l;++o){const c=a[o];this._deactivateAction(c);const u=c._cacheIndex,h=t[t.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,h._cacheIndex=u,t[u]=h,t.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(e){const t=e.uuid,n=this._actionsByClip;for(const a in n){const o=n[a].actionByRoot,l=o[t];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}const i=this._bindingsByRootAndName,s=i[t];if(s!==void 0)for(const a in s){const o=s[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(e,t){const n=this.existingAction(e,t);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}}const Qh=new me;class I5{constructor(e,t,n=0,i=1/0){this.ray=new js(e,t),this.near=n,this.far=i,this.camera=null,this.layers=new jc,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return Qh.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Qh),this}intersectObject(e,t=!0,n=[]){return bc(e,this,n,t),n.sort(ed),n}intersectObjects(e,t=!0,n=[]){for(let i=0,s=e.length;i<s;i++)bc(e[i],this,n,t);return n.sort(ed),n}}function ed(r,e){return r.distance-e.distance}function bc(r,e,t,n){let i=!0;if(r.layers.test(e.layers)&&r.raycast(e,t)===!1&&(i=!1),i===!0&&n===!0){const s=r.children;for(let a=0,o=s.length;a<o;a++)bc(s[a],e,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Nc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Nc);const Es={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class ki{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const D5=new bo(-1,1,1,-1,0,1);class L5 extends It{constructor(){super(),this.setAttribute("position",new Ut([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ut([0,2,0,0,2,0],2))}}const U5=new L5;class Js{constructor(e){this._mesh=new Ft(U5,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,D5)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Tc extends ki{constructor(e,t){super(),this.textureID=t!==void 0?t:"tDiffuse",e instanceof At?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Yn.clone(e.uniforms),this.material=new At({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this.fsQuad=new Js(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}class td extends ki{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const i=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class N5 extends ki{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class F5{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new Ue);this._width=n.width,this._height=n.height,t=new hn(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Cn}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Tc(Es),this.copyPass.material.blending=Jt,this.clock=new x5}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let i=0,s=this.passes.length;i<s;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}td!==void 0&&(a instanceof td?n=!0:a instanceof N5&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new Ue);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(n,i),this.renderTarget2.setSize(n,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(n,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class O5 extends ki{constructor(e,t,n=null,i=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Ae}render(e,t,n){const i=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=i}}const B5={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};class k5 extends ki{constructor(){super();const e=B5;this.uniforms=Yn.clone(e.uniforms),this.material=new J_({name:e.name,uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader}),this.fsQuad=new Js(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},Xe.getTransfer(this._outputColorSpace)===gt&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Ld?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===Ud?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===Nd?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===Fc?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===Fd?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Od&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this.fsQuad.render(e))}dispose(){this.material.dispose(),this.fsQuad.dispose()}}const z5={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ae(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class Zr extends ki{constructor(e,t,n,i){super(),this.strength=t!==void 0?t:1,this.radius=n,this.threshold=i,this.resolution=e!==void 0?new Ue(e.x,e.y):new Ue(256,256),this.clearColor=new Ae(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new hn(s,a,{type:Cn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const d=new hn(s,a,{type:Cn});d.texture.name="UnrealBloomPass.h"+h,d.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(d);const f=new hn(s,a,{type:Cn});f.texture.name="UnrealBloomPass.v"+h,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),s=Math.round(s/2),a=Math.round(a/2)}const o=z5;this.highPassUniforms=Yn.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=i,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new At({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[3,5,7,9,11];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new Ue(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1),new C(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;const u=Es;this.copyUniforms=Yn.clone(u.uniforms),this.blendMaterial=new At({uniforms:this.copyUniforms,vertexShader:u.vertexShader,fragmentShader:u.fragmentShader,blending:Pl,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new Ae,this.oldClearAlpha=1,this.basic=new vi,this.fsQuad=new Js(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),i=Math.round(t/2);this.renderTargetBright.setSize(n,i);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(n,i),this.renderTargetsVertical[s].setSize(n,i),this.separableBlurMaterials[s].uniforms.invSize.value=new Ue(1/n,1/i),n=Math.round(n/2),i=Math.round(i/2)}render(e,t,n,i,s){e.getClearColor(this._oldClearColor),this.oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,e.setRenderTarget(null),e.clear(),this.fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this.fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=Zr.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this.fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Zr.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this.fsQuad.render(e),o=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this.fsQuad.render(e),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(n),this.fsQuad.render(e)),e.setClearColor(this._oldClearColor,this.oldClearAlpha),e.autoClear=a}getSeperableBlurMaterial(e){const t=[];for(let n=0;n<e;n++)t.push(.39894*Math.exp(-.5*n*n/(e*e))/e);return new At({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new Ue(.5,.5)},direction:{value:new Ue(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(e){return new At({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}}Zr.BlurDirectionX=new Ue(1,0);Zr.BlurDirectionY=new Ue(0,1);class V5{constructor(e=Math){this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]],this.grad4=[[0,1,1,1],[0,1,1,-1],[0,1,-1,1],[0,1,-1,-1],[0,-1,1,1],[0,-1,1,-1],[0,-1,-1,1],[0,-1,-1,-1],[1,0,1,1],[1,0,1,-1],[1,0,-1,1],[1,0,-1,-1],[-1,0,1,1],[-1,0,1,-1],[-1,0,-1,1],[-1,0,-1,-1],[1,1,0,1],[1,1,0,-1],[1,-1,0,1],[1,-1,0,-1],[-1,1,0,1],[-1,1,0,-1],[-1,-1,0,1],[-1,-1,0,-1],[1,1,1,0],[1,1,-1,0],[1,-1,1,0],[1,-1,-1,0],[-1,1,1,0],[-1,1,-1,0],[-1,-1,1,0],[-1,-1,-1,0]],this.p=[];for(let t=0;t<256;t++)this.p[t]=Math.floor(e.random()*256);this.perm=[];for(let t=0;t<512;t++)this.perm[t]=this.p[t&255];this.simplex=[[0,1,2,3],[0,1,3,2],[0,0,0,0],[0,2,3,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,3,0],[0,2,1,3],[0,0,0,0],[0,3,1,2],[0,3,2,1],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,3,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,2,0,3],[0,0,0,0],[1,3,0,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,3,0,1],[2,3,1,0],[1,0,2,3],[1,0,3,2],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,3,1],[0,0,0,0],[2,1,3,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[2,0,1,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,0,1,2],[3,0,2,1],[0,0,0,0],[3,1,2,0],[2,1,0,3],[0,0,0,0],[0,0,0,0],[0,0,0,0],[3,1,0,2],[0,0,0,0],[3,2,0,1],[3,2,1,0]]}dot(e,t,n){return e[0]*t+e[1]*n}dot3(e,t,n,i){return e[0]*t+e[1]*n+e[2]*i}dot4(e,t,n,i,s){return e[0]*t+e[1]*n+e[2]*i+e[3]*s}noise(e,t){let n,i,s;const a=.5*(Math.sqrt(3)-1),o=(e+t)*a,l=Math.floor(e+o),c=Math.floor(t+o),u=(3-Math.sqrt(3))/6,h=(l+c)*u,d=l-h,f=c-h,p=e-d,v=t-f;let g,m;p>v?(g=1,m=0):(g=0,m=1);const S=p-g+u,y=v-m+u,x=p-1+2*u,P=v-1+2*u,R=l&255,A=c&255,I=this.perm[R+this.perm[A]]%12,T=this.perm[R+g+this.perm[A+m]]%12,_=this.perm[R+1+this.perm[A+1]]%12;let M=.5-p*p-v*v;M<0?n=0:(M*=M,n=M*M*this.dot(this.grad3[I],p,v));let L=.5-S*S-y*y;L<0?i=0:(L*=L,i=L*L*this.dot(this.grad3[T],S,y));let U=.5-x*x-P*P;return U<0?s=0:(U*=U,s=U*U*this.dot(this.grad3[_],x,P)),70*(n+i+s)}noise3d(e,t,n){let i,s,a,o;const c=(e+t+n)*.3333333333333333,u=Math.floor(e+c),h=Math.floor(t+c),d=Math.floor(n+c),f=1/6,p=(u+h+d)*f,v=u-p,g=h-p,m=d-p,S=e-v,y=t-g,x=n-m;let P,R,A,I,T,_;S>=y?y>=x?(P=1,R=0,A=0,I=1,T=1,_=0):S>=x?(P=1,R=0,A=0,I=1,T=0,_=1):(P=0,R=0,A=1,I=1,T=0,_=1):y<x?(P=0,R=0,A=1,I=0,T=1,_=1):S<x?(P=0,R=1,A=0,I=0,T=1,_=1):(P=0,R=1,A=0,I=1,T=1,_=0);const M=S-P+f,L=y-R+f,U=x-A+f,N=S-I+2*f,F=y-T+2*f,k=x-_+2*f,W=S-1+3*f,V=y-1+3*f,K=x-1+3*f,$=u&255,J=h&255,oe=d&255,Re=this.perm[$+this.perm[J+this.perm[oe]]]%12,j=this.perm[$+P+this.perm[J+R+this.perm[oe+A]]]%12,ne=this.perm[$+I+this.perm[J+T+this.perm[oe+_]]]%12,ue=this.perm[$+1+this.perm[J+1+this.perm[oe+1]]]%12;let ee=.6-S*S-y*y-x*x;ee<0?i=0:(ee*=ee,i=ee*ee*this.dot3(this.grad3[Re],S,y,x));let ve=.6-M*M-L*L-U*U;ve<0?s=0:(ve*=ve,s=ve*ve*this.dot3(this.grad3[j],M,L,U));let Te=.6-N*N-F*F-k*k;Te<0?a=0:(Te*=Te,a=Te*Te*this.dot3(this.grad3[ne],N,F,k));let X=.6-W*W-V*V-K*K;return X<0?o=0:(X*=X,o=X*X*this.dot3(this.grad3[ue],W,V,K)),32*(i+s+a+o)}noise4d(e,t,n,i){const s=this.grad4,a=this.simplex,o=this.perm,l=(Math.sqrt(5)-1)/4,c=(5-Math.sqrt(5))/20;let u,h,d,f,p;const v=(e+t+n+i)*l,g=Math.floor(e+v),m=Math.floor(t+v),S=Math.floor(n+v),y=Math.floor(i+v),x=(g+m+S+y)*c,P=g-x,R=m-x,A=S-x,I=y-x,T=e-P,_=t-R,M=n-A,L=i-I,U=T>_?32:0,N=T>M?16:0,F=_>M?8:0,k=T>L?4:0,W=_>L?2:0,V=M>L?1:0,K=U+N+F+k+W+V,$=a[K][0]>=3?1:0,J=a[K][1]>=3?1:0,oe=a[K][2]>=3?1:0,Re=a[K][3]>=3?1:0,j=a[K][0]>=2?1:0,ne=a[K][1]>=2?1:0,ue=a[K][2]>=2?1:0,ee=a[K][3]>=2?1:0,ve=a[K][0]>=1?1:0,Te=a[K][1]>=1?1:0,X=a[K][2]>=1?1:0,Le=a[K][3]>=1?1:0,Q=T-$+c,ye=_-J+c,D=M-oe+c,_e=L-Re+c,fe=T-j+2*c,ae=_-ne+2*c,le=M-ue+2*c,Se=L-ee+2*c,de=T-ve+3*c,w=_-Te+3*c,b=M-X+3*c,G=L-Le+3*c,ie=T-1+4*c,re=_-1+4*c,te=M-1+4*c,Pe=L-1+4*c,ge=g&255,be=m&255,Ye=S&255,ce=y&255,Ie=o[ge+o[be+o[Ye+o[ce]]]]%32,He=o[ge+$+o[be+J+o[Ye+oe+o[ce+Re]]]]%32,Ge=o[ge+j+o[be+ne+o[Ye+ue+o[ce+ee]]]]%32,De=o[ge+ve+o[be+Te+o[Ye+X+o[ce+Le]]]]%32,it=o[ge+1+o[be+1+o[Ye+1+o[ce+1]]]]%32;let We=.6-T*T-_*_-M*M-L*L;We<0?u=0:(We*=We,u=We*We*this.dot4(s[Ie],T,_,M,L));let ct=.6-Q*Q-ye*ye-D*D-_e*_e;ct<0?h=0:(ct*=ct,h=ct*ct*this.dot4(s[He],Q,ye,D,_e));let B=.6-fe*fe-ae*ae-le*le-Se*Se;B<0?d=0:(B*=B,d=B*B*this.dot4(s[Ge],fe,ae,le,Se));let xe=.6-de*de-w*w-b*b-G*G;xe<0?f=0:(xe*=xe,f=xe*xe*this.dot4(s[De],de,w,b,G));let Z=.6-ie*ie-re*re-te*te-Pe*Pe;return Z<0?p=0:(Z*=Z,p=Z*Z*this.dot4(s[it],ie,re,te,Pe)),27*(u+h+d+f+p)}}const Ba={defines:{PERSPECTIVE_CAMERA:1,KERNEL_SIZE:32},uniforms:{tNormal:{value:null},tDepth:{value:null},tNoise:{value:null},kernel:{value:null},cameraNear:{value:null},cameraFar:{value:null},resolution:{value:new Ue},cameraProjectionMatrix:{value:new me},cameraInverseProjectionMatrix:{value:new me},kernelRadius:{value:8},minDistance:{value:.005},maxDistance:{value:.05}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
		uniform highp sampler2D tNormal;
		uniform highp sampler2D tDepth;
		uniform sampler2D tNoise;

		uniform vec3 kernel[ KERNEL_SIZE ];

		uniform vec2 resolution;

		uniform float cameraNear;
		uniform float cameraFar;
		uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;

		uniform float kernelRadius;
		uniform float minDistance; // avoid artifacts caused by neighbour fragments with minimal depth difference
		uniform float maxDistance; // avoid the influence of fragments which are too far away

		varying vec2 vUv;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {

			return texture2D( tDepth, screenPosition ).x;

		}

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		float getViewZ( const in float depth ) {

			#if PERSPECTIVE_CAMERA == 1

				return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );

			#else

				return orthographicDepthToViewZ( depth, cameraNear, cameraFar );

			#endif

		}

		vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {

			float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];

			vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );

			clipPosition *= clipW; // unprojection.

			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;

		}

		vec3 getViewNormal( const in vec2 screenPosition ) {

			return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );

		}

		void main() {

			float depth = getDepth( vUv );

			if ( depth == 1.0 ) {

				gl_FragColor = vec4( 1.0 ); // don't influence background
				
			} else {

				float viewZ = getViewZ( depth );

				vec3 viewPosition = getViewPosition( vUv, depth, viewZ );
				vec3 viewNormal = getViewNormal( vUv );

				vec2 noiseScale = vec2( resolution.x / 4.0, resolution.y / 4.0 );
				vec3 random = vec3( texture2D( tNoise, vUv * noiseScale ).r );

				// compute matrix used to reorient a kernel vector

				vec3 tangent = normalize( random - viewNormal * dot( random, viewNormal ) );
				vec3 bitangent = cross( viewNormal, tangent );
				mat3 kernelMatrix = mat3( tangent, bitangent, viewNormal );

				float occlusion = 0.0;

				for ( int i = 0; i < KERNEL_SIZE; i ++ ) {

					vec3 sampleVector = kernelMatrix * kernel[ i ]; // reorient sample vector in view space
					vec3 samplePoint = viewPosition + ( sampleVector * kernelRadius ); // calculate sample point

					vec4 samplePointNDC = cameraProjectionMatrix * vec4( samplePoint, 1.0 ); // project point and calculate NDC
					samplePointNDC /= samplePointNDC.w;

					vec2 samplePointUv = samplePointNDC.xy * 0.5 + 0.5; // compute uv coordinates

					float realDepth = getLinearDepth( samplePointUv ); // get linear depth from depth texture
					float sampleDepth = viewZToOrthographicDepth( samplePoint.z, cameraNear, cameraFar ); // compute linear depth of the sample view Z value
					float delta = sampleDepth - realDepth;

					if ( delta > minDistance && delta < maxDistance ) { // if fragment is before sample point, increase occlusion

						occlusion += 1.0;

					}

				}

				occlusion = clamp( occlusion / float( KERNEL_SIZE ), 0.0, 1.0 );

				gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );

			}

		}`},ka={defines:{PERSPECTIVE_CAMERA:1},uniforms:{tDepth:{value:null},cameraNear:{value:null},cameraFar:{value:null}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDepth;

		uniform float cameraNear;
		uniform float cameraFar;

		varying vec2 vUv;

		#include <packing>

		float getLinearDepth( const in vec2 screenPosition ) {

			#if PERSPECTIVE_CAMERA == 1

				float fragCoordZ = texture2D( tDepth, screenPosition ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );

			#else

				return texture2D( tDepth, screenPosition ).x;

			#endif

		}

		void main() {

			float depth = getLinearDepth( vUv );
			gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );

		}`},za={uniforms:{tDiffuse:{value:null},resolution:{value:new Ue}},vertexShader:`varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`uniform sampler2D tDiffuse;

		uniform vec2 resolution;

		varying vec2 vUv;

		void main() {

			vec2 texelSize = ( 1.0 / resolution );
			float result = 0.0;

			for ( int i = - 2; i <= 2; i ++ ) {

				for ( int j = - 2; j <= 2; j ++ ) {

					vec2 offset = ( vec2( float( i ), float( j ) ) ) * texelSize;
					result += texture2D( tDiffuse, vUv + offset ).r;

				}

			}

			gl_FragColor = vec4( vec3( result / ( 5.0 * 5.0 ) ), 1.0 );

		}`};class Di extends ki{constructor(e,t,n,i,s=32){super(),this.width=n!==void 0?n:512,this.height=i!==void 0?i:512,this.clear=!0,this.needsSwap=!1,this.camera=t,this.scene=e,this.kernelRadius=8,this.kernel=[],this.noiseTexture=null,this.output=0,this.minDistance=.005,this.maxDistance=.1,this._visibilityCache=new Map,this.generateSampleKernel(s),this.generateRandomKernelRotations();const a=new Zc;a.format=nr,a.type=tr,this.normalRenderTarget=new hn(this.width,this.height,{minFilter:kt,magFilter:kt,type:Cn,depthTexture:a}),this.ssaoRenderTarget=new hn(this.width,this.height,{type:Cn}),this.blurRenderTarget=this.ssaoRenderTarget.clone(),this.ssaoMaterial=new At({defines:Object.assign({},Ba.defines),uniforms:Yn.clone(Ba.uniforms),vertexShader:Ba.vertexShader,fragmentShader:Ba.fragmentShader,blending:Jt}),this.ssaoMaterial.defines.KERNEL_SIZE=s,this.ssaoMaterial.uniforms.tNormal.value=this.normalRenderTarget.texture,this.ssaoMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.ssaoMaterial.uniforms.tNoise.value=this.noiseTexture,this.ssaoMaterial.uniforms.kernel.value=this.kernel,this.ssaoMaterial.uniforms.cameraNear.value=this.camera.near,this.ssaoMaterial.uniforms.cameraFar.value=this.camera.far,this.ssaoMaterial.uniforms.resolution.value.set(this.width,this.height),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.normalMaterial=new Q_,this.normalMaterial.blending=Jt,this.blurMaterial=new At({defines:Object.assign({},za.defines),uniforms:Yn.clone(za.uniforms),vertexShader:za.vertexShader,fragmentShader:za.fragmentShader}),this.blurMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.blurMaterial.uniforms.resolution.value.set(this.width,this.height),this.depthRenderMaterial=new At({defines:Object.assign({},ka.defines),uniforms:Yn.clone(ka.uniforms),vertexShader:ka.vertexShader,fragmentShader:ka.fragmentShader,blending:Jt}),this.depthRenderMaterial.uniforms.tDepth.value=this.normalRenderTarget.depthTexture,this.depthRenderMaterial.uniforms.cameraNear.value=this.camera.near,this.depthRenderMaterial.uniforms.cameraFar.value=this.camera.far,this.copyMaterial=new At({uniforms:Yn.clone(Es.uniforms),vertexShader:Es.vertexShader,fragmentShader:Es.fragmentShader,transparent:!0,depthTest:!1,depthWrite:!1,blendSrc:Dd,blendDst:Il,blendEquation:pi,blendSrcAlpha:Id,blendDstAlpha:Il,blendEquationAlpha:pi}),this.fsQuad=new Js(null),this.originalClearColor=new Ae}dispose(){this.normalRenderTarget.dispose(),this.ssaoRenderTarget.dispose(),this.blurRenderTarget.dispose(),this.normalMaterial.dispose(),this.blurMaterial.dispose(),this.copyMaterial.dispose(),this.depthRenderMaterial.dispose(),this.fsQuad.dispose()}render(e,t,n){switch(this.overrideVisibility(),this.renderOverride(e,this.normalMaterial,this.normalRenderTarget,7829503,1),this.restoreVisibility(),this.ssaoMaterial.uniforms.kernelRadius.value=this.kernelRadius,this.ssaoMaterial.uniforms.minDistance.value=this.minDistance,this.ssaoMaterial.uniforms.maxDistance.value=this.maxDistance,this.renderPass(e,this.ssaoMaterial,this.ssaoRenderTarget),this.renderPass(e,this.blurMaterial,this.blurRenderTarget),this.output){case Di.OUTPUT.SSAO:this.copyMaterial.uniforms.tDiffuse.value=this.ssaoRenderTarget.texture,this.copyMaterial.blending=Jt,this.renderPass(e,this.copyMaterial,this.renderToScreen?null:n);break;case Di.OUTPUT.Blur:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=Jt,this.renderPass(e,this.copyMaterial,this.renderToScreen?null:n);break;case Di.OUTPUT.Depth:this.renderPass(e,this.depthRenderMaterial,this.renderToScreen?null:n);break;case Di.OUTPUT.Normal:this.copyMaterial.uniforms.tDiffuse.value=this.normalRenderTarget.texture,this.copyMaterial.blending=Jt,this.renderPass(e,this.copyMaterial,this.renderToScreen?null:n);break;case Di.OUTPUT.Default:this.copyMaterial.uniforms.tDiffuse.value=this.blurRenderTarget.texture,this.copyMaterial.blending=Pd,this.renderPass(e,this.copyMaterial,this.renderToScreen?null:n);break;default:console.warn("THREE.SSAOPass: Unknown output type.")}}renderPass(e,t,n,i,s){e.getClearColor(this.originalClearColor);const a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,i!=null&&(e.setClearColor(i),e.setClearAlpha(s||0),e.clear()),this.fsQuad.material=t,this.fsQuad.render(e),e.autoClear=o,e.setClearColor(this.originalClearColor),e.setClearAlpha(a)}renderOverride(e,t,n,i,s){e.getClearColor(this.originalClearColor);const a=e.getClearAlpha(),o=e.autoClear;e.setRenderTarget(n),e.autoClear=!1,i=t.clearColor||i,s=t.clearAlpha||s,i!=null&&(e.setClearColor(i),e.setClearAlpha(s||0),e.clear()),this.scene.overrideMaterial=t,e.render(this.scene,this.camera),this.scene.overrideMaterial=null,e.autoClear=o,e.setClearColor(this.originalClearColor),e.setClearAlpha(a)}setSize(e,t){this.width=e,this.height=t,this.ssaoRenderTarget.setSize(e,t),this.normalRenderTarget.setSize(e,t),this.blurRenderTarget.setSize(e,t),this.ssaoMaterial.uniforms.resolution.value.set(e,t),this.ssaoMaterial.uniforms.cameraProjectionMatrix.value.copy(this.camera.projectionMatrix),this.ssaoMaterial.uniforms.cameraInverseProjectionMatrix.value.copy(this.camera.projectionMatrixInverse),this.blurMaterial.uniforms.resolution.value.set(e,t)}generateSampleKernel(e){const t=this.kernel;for(let n=0;n<e;n++){const i=new C;i.x=Math.random()*2-1,i.y=Math.random()*2-1,i.z=Math.random(),i.normalize();let s=n/e;s=jt.lerp(.1,1,s*s),i.multiplyScalar(s),t.push(i)}}generateRandomKernelRotations(){const n=new V5,i=16,s=new Float32Array(i);for(let a=0;a<i;a++){const o=Math.random()*2-1,l=Math.random()*2-1,c=0;s[a]=n.noise3d(o,l,c)}this.noiseTexture=new Qc(s,4,4,Mo,wn),this.noiseTexture.wrapS=Rn,this.noiseTexture.wrapT=Rn,this.noiseTexture.needsUpdate=!0}overrideVisibility(){const e=this.scene,t=this._visibilityCache;e.traverse(function(n){t.set(n,n.visible),(n.isPoints||n.isLine)&&(n.visible=!1)})}restoreVisibility(){const e=this.scene,t=this._visibilityCache;e.traverse(function(n){const i=t.get(n);n.visible=i}),t.clear()}}Di.OUTPUT={Default:0,SSAO:1,Blur:2,Depth:3,Normal:4};const H5={defines:{DEPTH_PACKING:1,PERSPECTIVE_CAMERA:1},uniforms:{tColor:{value:null},tDepth:{value:null},focus:{value:1},aspect:{value:1},aperture:{value:.025},maxblur:{value:.01},nearClip:{value:1},farClip:{value:1e3}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		#include <common>

		varying vec2 vUv;

		uniform sampler2D tColor;
		uniform sampler2D tDepth;

		uniform float maxblur; // max blur amount
		uniform float aperture; // aperture - bigger values for shallower depth of field

		uniform float nearClip;
		uniform float farClip;

		uniform float focus;
		uniform float aspect;

		#include <packing>

		float getDepth( const in vec2 screenPosition ) {
			#if DEPTH_PACKING == 1
			return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
			#else
			return texture2D( tDepth, screenPosition ).x;
			#endif
		}

		float getViewZ( const in float depth ) {
			#if PERSPECTIVE_CAMERA == 1
			return perspectiveDepthToViewZ( depth, nearClip, farClip );
			#else
			return orthographicDepthToViewZ( depth, nearClip, farClip );
			#endif
		}


		void main() {

			vec2 aspectcorrect = vec2( 1.0, aspect );

			float viewZ = getViewZ( getDepth( vUv ) );

			float factor = ( focus + viewZ ); // viewZ is <= 0, so this is a difference equation

			vec2 dofblur = vec2 ( clamp( factor * aperture, -maxblur, maxblur ) );

			vec2 dofblur9 = dofblur * 0.9;
			vec2 dofblur7 = dofblur * 0.7;
			vec2 dofblur4 = dofblur * 0.4;

			vec4 col = vec4( 0.0 );

			col += texture2D( tColor, vUv.xy );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15, -0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.15,  0.37 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.37,  0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.37, -0.15 ) * aspectcorrect ) * dofblur9 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.15, -0.37 ) * aspectcorrect ) * dofblur9 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.40,  0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur7 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur7 );

			col += texture2D( tColor, vUv.xy + ( vec2(  0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,  -0.4  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29,  0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.4,   0.0  ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2( -0.29, -0.29 ) * aspectcorrect ) * dofblur4 );
			col += texture2D( tColor, vUv.xy + ( vec2(  0.0,   0.4  ) * aspectcorrect ) * dofblur4 );

			gl_FragColor = col / 41.0;
			gl_FragColor.a = 1.0;

		}`};class G5 extends ki{constructor(e,t,n){super(),this.scene=e,this.camera=t;const i=n.focus!==void 0?n.focus:1,s=n.aperture!==void 0?n.aperture:.025,a=n.maxblur!==void 0?n.maxblur:1;this.renderTargetDepth=new hn(1,1,{minFilter:kt,magFilter:kt,type:Cn}),this.renderTargetDepth.texture.name="BokehPass.depth",this.materialDepth=new df,this.materialDepth.depthPacking=$d,this.materialDepth.blending=Jt;const o=H5,l=Yn.clone(o.uniforms);l.tDepth.value=this.renderTargetDepth.texture,l.focus.value=i,l.aspect.value=t.aspect,l.aperture.value=s,l.maxblur.value=a,l.nearClip.value=t.near,l.farClip.value=t.far,this.materialBokeh=new At({defines:Object.assign({},o.defines),uniforms:l,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.uniforms=l,this.fsQuad=new Js(this.materialBokeh),this._oldClearColor=new Ae}render(e,t,n){this.scene.overrideMaterial=this.materialDepth,e.getClearColor(this._oldClearColor);const i=e.getClearAlpha(),s=e.autoClear;e.autoClear=!1,e.setClearColor(16777215),e.setClearAlpha(1),e.setRenderTarget(this.renderTargetDepth),e.clear(),e.render(this.scene,this.camera),this.uniforms.tColor.value=n.texture,this.uniforms.nearClip.value=this.camera.near,this.uniforms.farClip.value=this.camera.far,this.renderToScreen?(e.setRenderTarget(null),this.fsQuad.render(e)):(e.setRenderTarget(t),e.clear(),this.fsQuad.render(e)),this.scene.overrideMaterial=null,e.setClearColor(this._oldClearColor),e.setClearAlpha(i),e.autoClear=s}setSize(e,t){this.materialBokeh.uniforms.aspect.value=e/t,this.renderTargetDepth.setSize(e,t)}dispose(){this.renderTargetDepth.dispose(),this.materialDepth.dispose(),this.materialBokeh.dispose(),this.fsQuad.dispose()}}const W5={name:"FXAAShader",uniforms:{tDiffuse:{value:null},resolution:{value:new Ue(1/1024,1/512)}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		// FXAA algorithm from NVIDIA, C# implementation by Jasper Flick, GLSL port by Dave Hoskins
		// http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
		// https://catlikecoding.com/unity/tutorials/advanced-rendering/fxaa/

		uniform sampler2D tDiffuse;
		uniform vec2 resolution;
		varying vec2 vUv;

		#define EDGE_STEP_COUNT 6
		#define EDGE_GUESS 8.0
		#define EDGE_STEPS 1.0, 1.5, 2.0, 2.0, 2.0, 4.0
		const float edgeSteps[EDGE_STEP_COUNT] = float[EDGE_STEP_COUNT]( EDGE_STEPS );

		float _ContrastThreshold = 0.0312;
		float _RelativeThreshold = 0.063;
		float _SubpixelBlending = 1.0;

		vec4 Sample( sampler2D  tex2D, vec2 uv ) {

			return texture( tex2D, uv );

		}

		float SampleLuminance( sampler2D tex2D, vec2 uv ) {

			return dot( Sample( tex2D, uv ).rgb, vec3( 0.3, 0.59, 0.11 ) );

		}

		float SampleLuminance( sampler2D tex2D, vec2 texSize, vec2 uv, float uOffset, float vOffset ) {

			uv += texSize * vec2(uOffset, vOffset);
			return SampleLuminance(tex2D, uv);

		}

		struct LuminanceData {

			float m, n, e, s, w;
			float ne, nw, se, sw;
			float highest, lowest, contrast;

		};

		LuminanceData SampleLuminanceNeighborhood( sampler2D tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData l;
			l.m = SampleLuminance( tex2D, uv );
			l.n = SampleLuminance( tex2D, texSize, uv,  0.0,  1.0 );
			l.e = SampleLuminance( tex2D, texSize, uv,  1.0,  0.0 );
			l.s = SampleLuminance( tex2D, texSize, uv,  0.0, -1.0 );
			l.w = SampleLuminance( tex2D, texSize, uv, -1.0,  0.0 );

			l.ne = SampleLuminance( tex2D, texSize, uv,  1.0,  1.0 );
			l.nw = SampleLuminance( tex2D, texSize, uv, -1.0,  1.0 );
			l.se = SampleLuminance( tex2D, texSize, uv,  1.0, -1.0 );
			l.sw = SampleLuminance( tex2D, texSize, uv, -1.0, -1.0 );

			l.highest = max( max( max( max( l.n, l.e ), l.s ), l.w ), l.m );
			l.lowest = min( min( min( min( l.n, l.e ), l.s ), l.w ), l.m );
			l.contrast = l.highest - l.lowest;
			return l;

		}

		bool ShouldSkipPixel( LuminanceData l ) {

			float threshold = max( _ContrastThreshold, _RelativeThreshold * l.highest );
			return l.contrast < threshold;

		}

		float DeterminePixelBlendFactor( LuminanceData l ) {

			float f = 2.0 * ( l.n + l.e + l.s + l.w );
			f += l.ne + l.nw + l.se + l.sw;
			f *= 1.0 / 12.0;
			f = abs( f - l.m );
			f = clamp( f / l.contrast, 0.0, 1.0 );

			float blendFactor = smoothstep( 0.0, 1.0, f );
			return blendFactor * blendFactor * _SubpixelBlending;

		}

		struct EdgeData {

			bool isHorizontal;
			float pixelStep;
			float oppositeLuminance, gradient;

		};

		EdgeData DetermineEdge( vec2 texSize, LuminanceData l ) {

			EdgeData e;
			float horizontal =
				abs( l.n + l.s - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.se - 2.0 * l.e ) +
				abs( l.nw + l.sw - 2.0 * l.w );
			float vertical =
				abs( l.e + l.w - 2.0 * l.m ) * 2.0 +
				abs( l.ne + l.nw - 2.0 * l.n ) +
				abs( l.se + l.sw - 2.0 * l.s );
			e.isHorizontal = horizontal >= vertical;

			float pLuminance = e.isHorizontal ? l.n : l.e;
			float nLuminance = e.isHorizontal ? l.s : l.w;
			float pGradient = abs( pLuminance - l.m );
			float nGradient = abs( nLuminance - l.m );

			e.pixelStep = e.isHorizontal ? texSize.y : texSize.x;
			
			if (pGradient < nGradient) {

				e.pixelStep = -e.pixelStep;
				e.oppositeLuminance = nLuminance;
				e.gradient = nGradient;

			} else {

				e.oppositeLuminance = pLuminance;
				e.gradient = pGradient;

			}

			return e;

		}

		float DetermineEdgeBlendFactor( sampler2D  tex2D, vec2 texSize, LuminanceData l, EdgeData e, vec2 uv ) {

			vec2 uvEdge = uv;
			vec2 edgeStep;
			if (e.isHorizontal) {

				uvEdge.y += e.pixelStep * 0.5;
				edgeStep = vec2( texSize.x, 0.0 );

			} else {

				uvEdge.x += e.pixelStep * 0.5;
				edgeStep = vec2( 0.0, texSize.y );

			}

			float edgeLuminance = ( l.m + e.oppositeLuminance ) * 0.5;
			float gradientThreshold = e.gradient * 0.25;

			vec2 puv = uvEdge + edgeStep * edgeSteps[0];
			float pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
			bool pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !pAtEnd; i++ ) {

				puv += edgeStep * edgeSteps[i];
				pLuminanceDelta = SampleLuminance( tex2D, puv ) - edgeLuminance;
				pAtEnd = abs( pLuminanceDelta ) >= gradientThreshold;

			}

			if ( !pAtEnd ) {

				puv += edgeStep * EDGE_GUESS;

			}

			vec2 nuv = uvEdge - edgeStep * edgeSteps[0];
			float nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
			bool nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			for ( int i = 1; i < EDGE_STEP_COUNT && !nAtEnd; i++ ) {

				nuv -= edgeStep * edgeSteps[i];
				nLuminanceDelta = SampleLuminance( tex2D, nuv ) - edgeLuminance;
				nAtEnd = abs( nLuminanceDelta ) >= gradientThreshold;

			}

			if ( !nAtEnd ) {

				nuv -= edgeStep * EDGE_GUESS;

			}

			float pDistance, nDistance;
			if ( e.isHorizontal ) {

				pDistance = puv.x - uv.x;
				nDistance = uv.x - nuv.x;

			} else {
				
				pDistance = puv.y - uv.y;
				nDistance = uv.y - nuv.y;

			}

			float shortestDistance;
			bool deltaSign;
			if ( pDistance <= nDistance ) {

				shortestDistance = pDistance;
				deltaSign = pLuminanceDelta >= 0.0;

			} else {

				shortestDistance = nDistance;
				deltaSign = nLuminanceDelta >= 0.0;

			}

			if ( deltaSign == ( l.m - edgeLuminance >= 0.0 ) ) {

				return 0.0;

			}

			return 0.5 - shortestDistance / ( pDistance + nDistance );

		}

		vec4 ApplyFXAA( sampler2D  tex2D, vec2 texSize, vec2 uv ) {

			LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
			if ( ShouldSkipPixel( luminance ) ) {

				return Sample( tex2D, uv );

			}

			float pixelBlend = DeterminePixelBlendFactor( luminance );
			EdgeData edge = DetermineEdge( texSize, luminance );
			float edgeBlend = DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv );
			float finalBlend = max( pixelBlend, edgeBlend );

			if (edge.isHorizontal) {

				uv.y += edge.pixelStep * finalBlend;

			} else {

				uv.x += edge.pixelStep * finalBlend;

			}

			return Sample( tex2D, uv );

		}

		void main() {

			gl_FragColor = ApplyFXAA( tDiffuse, resolution.xy, vUv );
			
		}`},Ec=Object.freeze({quality:"auto",res:"auto",fps:"60",aa:!1,shadows:!0,shadowq:"auto",bloom:!1,ao:!1,grade:!0,dof:!1,time:"day",view:"normal",water:!1,foliage:!0,rain:!1,roofs:"auto",fx:"full"});function ou(r){if(!r||typeof r!="object"||Array.isArray(r))return{};const e={};for(const t of Ad)Object.hasOwn(Ec,t.id)&&!t.disabled&&Object.hasOwn(r,t.id)&&t.opts.some(([n])=>n===r[t.id])&&(e[t.id]=r[t.id]);return e}function X5(r){var e;try{return{...Ec,...ou(JSON.parse(((e=r??globalThis.localStorage)==null?void 0:e.getItem("racers-graphics"))||"null"))}}catch{return{...Ec}}}function j5(r,e){var t;try{(t=e??globalThis.localStorage)==null||t.setItem("racers-graphics",JSON.stringify(ou(r)))}catch{}}const Va={near:70,normal:110,far:170,max:240},q5={uniforms:{tDiffuse:{value:null}},vertexShader:"varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform sampler2D tDiffuse; varying vec2 vUv; void main(){vec3 c=texture2D(tDiffuse,vUv).rgb; c=mix(vec3(dot(c,vec3(.299,.587,.114))),c,1.08); c=(c-.5)*1.06+.5; c*=vec3(1.02,1.,.97); c*=1.-.2*smoothstep(.25,.85,distance(vUv,vec2(.5))); gl_FragColor=vec4(clamp(c,0.,1.),1.);}"};function Y5({renderer:r,scene:e,camera:t,sun:n,hemi:i,world:s,software:a=!1,storage:o}){const l=X5(o),c={},u=new ho(16756832,0,20,1.6);e.add(u),i??(i=e.children.find(_=>_.isHemisphereLight));let h=null,d=1,f=1,p=Math.min(globalThis.devicePixelRatio||1,1.25),v=0,g=0,m=!1;const S=Math.min(globalThis.devicePixelRatio||1,2);function y(){const _=l.res==="auto"?l.quality==="auto"?p:{low:.6,medium:1,high:S}[l.quality]:S*Number(l.res);return Math.min(_,a?1:2,Math.sqrt(4194304/(d*f)))}function x(_,M){if(!(_>0&&M>0)||m)return;d=_,f=M;const L=y();r.setPixelRatio(L),r.setSize(_,M,!1),t.aspect=_/M,t.updateProjectionMatrix(),h&&(h.setPixelRatio(L),h.setSize(_,M)),c.aa&&c.aa.uniforms.resolution.value.set(1/(_*L),1/(M*L))}function P(){const _=["ao","dof","bloom","grade","aa"].filter(M=>l[M]);if(_.length){h||(h=new F5(r),c.render=new O5(e,t),c.output=new k5);for(const M of _)c[M]||(M==="ao"&&(c.ao=new Di(e,t,1,1,8),c.ao.kernelRadius=.6,c.ao.minDistance=.001,c.ao.maxDistance=.08),M==="dof"&&(c.dof=new G5(e,t,{focus:12,aperture:15e-5,maxblur:.004})),M==="bloom"&&(c.bloom=new Zr(new Ue(1,1),.32,.42,.86)),M==="grade"&&(c.grade=new Tc(q5)),M==="aa"&&(c.aa=new Tc(W5)));h.passes=[c.render,...["ao","dof","bloom"].filter(M=>l[M]).map(M=>c[M]),c.output,...["grade","aa"].filter(M=>l[M]).map(M=>c[M])];for(const M of["ao","dof","bloom","grade","aa"])c[M]&&!l[M]&&c[M].setSize(1,1)}}function R(_={},M=!0){var N,F;Object.assign(l,ou(_)),r.shadowMap.enabled!==l.shadows&&e.traverse(k=>{if(k.material)for(const W of[].concat(k.material))W.needsUpdate=!0}),r.shadowMap.enabled=l.shadows,n.castShadow=l.shadows;const L=Math.min(a?1024:2048,{low:512,medium:1024,high:2048}[l.shadowq]||{low:512,high:2048}[l.quality]||1024);n.shadow.mapSize.x!==L&&((N=n.shadow.map)==null||N.dispose(),n.shadow.map=null,n.shadow.mapSize.set(L,L)),r.shadowMap.needsUpdate=!0,t.far=Va[l.view]+30,e.fog.near=Va[l.view]*.44,e.fog.far=Va[l.view];const U={day:[10143720,16773323,2.6,13428223,6844743,2],dusk:[12422794,16754784,1.9,16763040,4864592,1.1],night:[857638,10467583,.55,5269672,1315872,.55]}[l.time];return e.background.set(U[0]),e.fog.color.set(U[0]),n.color.set(U[1]),n.intensity=U[2],i&&(i.color.set(U[3]),i.groundColor.set(U[4]),i.intensity=U[5]),u.intensity=l.time==="night"?26:0,(F=s==null?void 0:s.applyGraphics)==null||F.call(s,{...l,distance:Va[l.view]}),P(),x(d,f),M&&j5(l,o),{...l}}function A(_,M){var L,U;M&&(u.position.set(M.x,(M.y??((L=s==null?void 0:s.collision)==null?void 0:L.ground(M.x,M.z))??0)+3,M.z),n.position.set(M.x+20,l.time==="dusk"?25:70,M.z+15),n.target.position.set(M.x,0,M.z),(U=s==null?void 0:s.updateGraphics)==null||U.call(s,M,_),c.dof&&(c.dof.uniforms.focus.value=Math.max(2,t.position.distanceTo(u.position))))}function I(_=0){if(!m&&(h&&["ao","dof","bloom","grade","aa"].some(M=>l[M])?h.render(_):r.render(e,t),l.quality==="auto"&&l.res==="auto"&&!a&&_>0&&_<1&&(v+=_,g++,v>=2))){const M=g/v,L=l.fps==="30"?30:60,U=M<L*.75?Math.max(.5,p-.15):M>L*.94?Math.min(Math.min(S,1.25),p+.1):p;v=g=0,U!==p&&(p=U,x(d,f))}}function T(){var _;m=!0;for(const M of Object.values(c))(_=M.dispose)==null||_.call(M);h==null||h.dispose(),e.remove(u),u.dispose()}return R({},!1),{apply:R,getSettings:()=>({...l}),resize:x,render:I,update:A,frameInterval:()=>Math.max(a?.2:0,l.fps==="max"?0:1/Number(l.fps)),inspect:()=>{var _;return{settings:{...l},pixelRatio:r.getPixelRatio(),far:t.far,fogFar:e.fog.far,shadowSize:n.shadow.mapSize.x,passes:Object.keys(c).filter(M=>l[M]),targetPixels:Math.round(d*f*r.getPixelRatio()**2),world:(_=s==null?void 0:s.graphicsInfo)==null?void 0:_.call(s)}},dispose:T}}const nd={menu:"Fresh_Beginnings",greentown:"Fresh_Beginnings",early:"Fresh_Beginnings",apache:"Adobe_Fantasy",mid:"Adobe_Fantasy"};function K5({storage:r,AudioClass:e=globalThis.Audio,AudioContextClass:t=globalThis.AudioContext||globalThis.webkitAudioContext}={}){let n=null,i=null,s=null,a=null,o=!1,l=!1,c=!1,u=!1,h=60,d="menu",f="",p=null,v=0,g=!1,m=!1;const S=N=>{var F;try{return(F=r??globalThis.localStorage)==null?void 0:F.getItem(N)}catch{return null}},y=(N,F)=>{var k;try{(k=r??globalThis.localStorage)==null||k.setItem(N,F)}catch{}};l=S("racers-muted")==="1";const x=S("racers-volume");x!=null&&x.trim()!==""&&Number.isFinite(Number(x))&&(h=Math.max(0,Math.min(100,Number(x))));const P=()=>l||c?0:.3*h/60*(u?1/3:1);function R(){s?s.gain.value=P():n&&(n.volume=P())}function A(){if(!o||c||g||!n||p)return Promise.resolve(!1);if(!n.paused&&!m)return Promise.resolve(!0);const N=v;let F;try{F=Promise.resolve(n.play())}catch(k){F=Promise.reject(k)}return p=F,F.then(()=>g||c?(n.pause(),!1):(N===v&&(m=!1,p===F&&(p=null)),!0),()=>(N===v&&(m=!0,p===F&&(p=null)),!1))}function I(N){if(!Object.hasOwn(nd,N)||g||(d=N,!n))return;const F=nd[N];return F!==f&&(v++,p=null,n.pause(),f=F,n.src="/assets/music/"+f+".mp3",R()),A()}async function T(N=!1){var W,V;if(!N||g||!e)return!1;if(o=!0,!n){if(n=new e,n.loop=!0,n.preload="metadata",n.crossOrigin="anonymous",t)try{i=new t,s=i.createGain(),a=i.createMediaElementSource(n),a.connect(s),s.connect(i.destination)}catch{i&&((V=(W=i.close())==null?void 0:W.catch)==null||V.call(W,()=>{})),i=null,s=null,a=null}R()}let F;try{F=i&&i.state!=="running"?Promise.resolve(i.resume()).catch(()=>{}):null}catch{}const k=I(d);return await F,k}function _(N){const F=Number(N);Number.isFinite(F)&&(h=Math.max(0,Math.min(100,Math.round(F))),y("racers-volume",String(h)),R())}function M(N){l=!!N,y("racers-muted",l?"1":"0"),R()}function L(N=!0){c=!!N,R(),c?(v++,p=null,n==null||n.pause()):A()}function U(){var N,F;g=!0,v++,p=null,n==null||n.pause(),n&&(n.removeAttribute("src"),n.load()),a==null||a.disconnect(),s==null||s.disconnect(),(F=(N=i==null?void 0:i.close())==null?void 0:N.catch)==null||F.call(N,()=>{})}return{unlock:T,play:I,setVolume:_,volume:()=>h,setMuted:M,get muted(){return l},pause:L,duck(N){u=!!N,R()},inspect:()=>({track:d,file:f,volume:h,muted:l,paused:c,ducked:u,unlocked:o,streams:n?1:0,playing:!!n&&!n.paused,level:P(),failed:m}),dispose:U}}const fo=Object.freeze({ground:1,stone:1.03,wood:.98,dirt:.92,grass:.88,sand:.84});function Z5(r,e,t){const n=typeof e=="string"&&Object.hasOwn(fo,e)?fo[e]:1;if(n===1&&r.grip===void 0)return 1;const i=Number.isFinite(r.grip)?Math.max(.84,Math.min(1.03,r.grip)):1,s=i+(n-i)*(1-Math.exp(-6*t));return r.grip=Math.abs(s-n)<1e-6?n:s,r.grip}const Cf=r=>r&&["x","z","yaw","speed","steer"].every(e=>Number.isFinite(r[e]))&&(r.grip===void 0||Number.isFinite(r.grip)&&r.grip>=fo.sand&&r.grip<=fo.stone),Co=/^[A-Za-z0-9_-]{16}$/,po=r=>typeof r=="string"&&(/^(?:[1-9]|1[0-4])$/.test(r)||r==="miata"),Qs=r=>typeof r=="string"&&r.length>=1&&r.length<=16&&r===r.trim()&&!/[\p{C}<>]/u.test(r);function Rf(r){if(!r||typeof r!="object"||Array.isArray(r)||typeof r.type!="string")return!1;const e={create:["type","version","name","kart"],join:["type","version","name","kart","room"],ready:["type","ready","kart"],start:["type"],input:["type","seq","throttle","brake","steer","handbrake"]},t=Object.hasOwn(e,r.type)?e[r.type]:null;return!t||Object.keys(r).length!==t.length||t.some(n=>!Object.hasOwn(r,n))?!1:r.type==="create"||r.type==="join"?typeof r.version=="string"&&r.version.length===12&&Qs(r.name)&&po(r.kart)&&(r.type==="create"||typeof r.room=="string"&&Co.test(r.room)):r.type==="ready"?typeof r.ready=="boolean"&&po(r.kart):r.type==="input"?Number.isSafeInteger(r.seq)&&r.seq>=0&&r.seq<2**31&&[r.throttle,r.brake].every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&Number.isFinite(r.steer)&&Math.abs(r.steer)<=1&&(r.handbrake===0||r.handbrake===1):!0}const Pf=()=>({throttle:0,brake:0,steer:0,handbrake:0}),$5=16,id=30,If=r=>["casual","guard","priest"].includes(r),Df=r=>!/[\p{C}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}\u2800]/u.test(r),lu=r=>Qs(r)&&Df(r),cu=r=>typeof r=="string"&&r.length>=1&&r.length<=160&&r===r.trim()&&Df(r);function pl(r){if(!r||typeof r!="object"||Array.isArray(r)||typeof r.type!="string")return!1;const e={joinHub:["type","version","name","kart","outfit"],leaveHub:["type"],hubInput:["type","seq","throttle","brake","steer","handbrake"],hubAppearance:["type","name","kart","outfit"],chat:["type","text"]},t=Object.hasOwn(e,r.type)?e[r.type]:null;return!t||Object.keys(r).length!==t.length||t.some(n=>!Object.hasOwn(r,n))?!1:r.type==="joinHub"||r.type==="hubAppearance"?lu(r.name)&&po(r.kart)&&If(r.outfit)&&(r.type!=="joinHub"||typeof r.version=="string"&&r.version.length===12):r.type==="hubInput"?Rf({...r,type:"input"}):r.type==="chat"?cu(r.text):!0}const Lf="sanko-racers-world-v2",J5="sanko-racers-world-v1",Ro=(r,e,t)=>({x:r,z:e,yaw:t,speed:0,steer:0,hit:!1});function Q5(r,e,t,n){const i=Math.sin(t),s=Math.cos(t);for(let a=-1.85;a<=1.86;a+=.37)for(let o=-.85;o<=.86;o+=.34)if(!n(r+i*a+s*o,e+s*a-i*o))return!1;return!0}const Ha=(r,e=0)=>Number.isFinite(r)&&Math.max(e,Math.min(1,r))||0;function ea(r,e,t,n,i){if(!Number.isFinite(t)||t<=0||!Number.isFinite(r.x)||!Number.isFinite(r.z)||!Number.isFinite(r.yaw)||!Number.isFinite(r.speed))return 0;const s=Ha(e==null?void 0:e.throttle),a=Ha(e==null?void 0:e.brake),o=Ha(e==null?void 0:e.handbrake),l=r.speed,c=Z5(r,typeof i=="function"?i(r.x,r.z):"ground",t);Number.isFinite(r.steer)||(r.steer=0),r.steer+=(Ha(e==null?void 0:e.steer,-1)-r.steer)*Math.min(1,t*9);let u=s*(r.speed<-.1?12*c:7)-a*(r.speed>.1?16*c:4);!s&&!a&&(u-=Math.sign(r.speed)*Math.min(Math.abs(r.speed)/t,.8*(2-c))),u-=r.speed*Math.abs(r.speed)*.012,r.speed=Math.max(-5,Math.min(20,r.speed+u*t)),o&&(r.speed=l>0?Math.max(0,r.speed-4*t*c):l<0?Math.min(0,Math.max(r.speed,l)+4*t*c):Math.max(0,r.speed));let h=r.speed/2.45*Math.tan(-r.steer*.5/(1+Math.abs(r.speed)*.055))*t*c,d=Number.isFinite(r.slip)?Math.max(-.75,Math.min(.75,r.slip)):0;r.slip!==void 0&&!Number.isFinite(r.slip)&&(r.slip=0),!o&&c<1&&r.speed>2&&(d+=h*(1-c)*.8),o&&r.speed>2?(h*=1.5,d=Math.max(-.75,Math.min(.75,d*(1-t*1.2*c)+h*.7/c)),r.slip=d):d&&(d=Math.max(-.75,Math.min(.75,d*Math.max(0,1-t*4*c))),Math.abs(d)<.001&&(d=0),r.slip=d);const f=Math.max(1,Math.ceil(Math.abs(r.speed*t)/.12)),p=r.speed;let v=!1;r.hit=!1;for(let g=0;g<f;g++){const m=r.yaw+h/f,S=m-d,y=r.x+Math.sin(S)*r.speed*t/f,x=r.z+Math.cos(S)*r.speed*t/f;if(!n(y,x,m)){r.speed=0,r.hit=!0,d&&(r.slip=0);break}r.x=y,r.z=x,r.yaw=m,v=!0}return v?p:0}const ns=()=>({next:0,time:0,finished:!1,started:!1});function Po(r,e,t,n,i){if(r.finished||(Math.hypot(t.x-e.x,t.z-e.z)>1e-5&&(r.started=!0),!r.started))return;r.time+=n;const s=i[r.next],a=(e.x-s.x)*s.nx+(e.z-s.z)*s.nz,o=(t.x-s.x)*s.nx+(t.z-s.z)*s.nz;if(a<0&&o>=0){const l=-a/(o-a),c=e.x+(t.x-e.x)*l,u=e.z+(t.z-e.z)*l;Math.abs((c-s.x)*s.nz-(u-s.z)*s.nx)<s.width/2&&(r.next++,r.next===i.length&&(r.finished=!0,r.time-=n*(1-l)))}}function Uf(r,e=Lf){try{const t=Number(r.getItem(e));return Number.isFinite(t)&&t>0?t:null}catch{return null}}function ey(r,e,t){if(!Number.isFinite(e)||e<=0||t!==null&&e>=t)return t;try{r.setItem(Lf,String(e))}catch{}return e}const ty="8549602086d2",wc={version:ty},rd=r=>r&&typeof r.id=="string"&&r.id.length<=32&&typeof r.from=="string"&&r.from.length<=32&&lu(r.name)&&cu(r.text);function ny(r){const e={id:null,players:[],messages:[],status:"Public hub offline.",connected:!1,car:null,correction:{x:0,z:0}};let t=null,n=0,i=-1/0,s=0,a=null,o=null,l=null,c=-1/0;const u=x=>(t==null?void 0:t.readyState)!==1||t.bufferedAmount>16384?!1:(t.send(JSON.stringify(x)),!0);function h(){clearTimeout(a),a=null,o=null,l=null,c=-1/0}function d(){s++,h(),t==null||t.close(),t=null,e.id=null,e.players=[],e.messages=[],e.car=null,e.correction={x:0,z:0},e.connected=!1,e.status="Public hub offline.",r(e)}function f({name:x,kart:P,outfit:R="casual"}){const A={type:"joinHub",version:wc.version,name:x,kart:P,outfit:R};if(!pl(A))return e.status="Choose a valid driver name, kart and outfit.",r(e),!1;d();const I=s;e.status="Connecting to the public hub…",r(e);try{t=new WebSocket("wss://sankosurvivors-coop.spidertag.app/racers")}catch{return e.status="Could not connect. Try again.",r(e),!1}const T=t;return T.onopen=()=>{I===s&&(n=0,i=-1/0,u(A),l=A)},T.onmessage=_=>{if(I!==s)return;let M;try{M=JSON.parse(_.data)}catch{return}if(!(!M||typeof M!="object")){if(M.type==="hubJoined"&&typeof M.id=="string"&&M.version===wc.version&&Array.isArray(M.messages)&&M.messages.length<=id&&M.messages.every(rd)&&(e.id=M.id,e.messages=M.messages,e.connected=!0,e.status="Public hub · names are unverified."),M.type==="hub"&&e.connected&&Array.isArray(M.players)&&M.players.length<=$5&&M.players.every(L=>L&&typeof L.id=="string"&&lu(L.name)&&po(L.kart)&&If(L.outfit)&&Cf(L.car))){const L=M.players.find(k=>k.id===e.id);if(!L)return;const U=e.car,N=((U==null?void 0:U.x)??L.car.x)+e.correction.x-L.car.x,F=((U==null?void 0:U.z)??L.car.z)+e.correction.z-L.car.z;e.correction=Math.hypot(N,F)<3?{x:N,z:F}:{x:0,z:0},e.car={...L.car},e.players=M.players}if(M.type==="hubChat"&&e.connected&&rd(M.message)&&(e.messages.push(M.message),e.messages.length>id&&e.messages.shift()),M.type==="error"&&typeof M.message=="string"&&(e.status=M.message,e.connected||T.close()),M.type==="hubLeft"){d();return}r(e)}},T.onerror=()=>{I===s&&(e.status="Hub connection failed. Try connecting again.",r(e))},T.onclose=_=>{if(I!==s)return;h();const M=e.connected;e.connected=!1,e.id=null,e.players=[],e.car=null,e.correction={x:0,z:0},M?e.status=_.reason==="Hub idle timeout"?"Hub disconnected after thirty minutes idle.":"Hub disconnected. Connect again to return.":e.status==="Connecting to the public hub…"&&(e.status="Could not connect. Try again."),r(e)},!0}function p(x,P=!1){const R=performance.now(),A={type:"hubInput",seq:n,...x};return!e.connected||!P&&R-i<50||!pl(A)||!u(A)?!1:(n++,i=R,!0)}function v(x,P,R,A){if(e.connected&&e.car&&Number.isFinite(x)&&x>0){ea(e.car,P,Math.min(x,.1),R,A);const I=Math.exp(-12*x);e.correction.x*=I,e.correction.z*=I}}function g(x){const P=s;a=setTimeout(()=>{P===s&&(a=null,m())},x)}function m(){if(!(!e.connected||!o)){if(!u(o)){g(1050);return}l=o,o=null,c=performance.now()}}function S({name:x,kart:P,outfit:R="casual"}){const A={type:"hubAppearance",name:x,kart:P,outfit:R};if(!e.connected||!pl(A))return!1;if(clearTimeout(a),a=null,o=null,l&&["name","kart","outfit"].every(T=>A[T]===l[T]))return!0;o=A;const I=1050-(performance.now()-c);return I>0?g(I):m(),!0}function y(x){return e.connected&&cu(x)&&u({type:"chat",text:x})}return{state:e,connect:f,leave:d,input:p,advance:v,appearance:S,sendChat:y,neutral:()=>p(Pf(),!0)}}const sd={confirm:0,back:1,pause:9,view:3,recenter:11},ys=(r,e,t)=>Number.isFinite(r)?Math.max(e,Math.min(t,r)):0,ml=r=>{const e=ys(r,-1,1);return Math.abs(e)>.2?(e-Math.sign(e)*.2)/.8:0},ad=r=>r.index+":"+r.id;function iy({getPads:r=()=>{var e,t;return(t=(e=globalThis.navigator)==null?void 0:e.getGamepads)==null?void 0:t.call(e)}}={}){let e=null,t=!1,n={},i={x:0,y:0},s=1/0;return{poll(a,o=!0){var P,R,A,I;let l=[];try{l=Array.from(r()||[]).filter(T=>(T==null?void 0:T.connected)&&T.mapping==="standard")}catch{}const c=l[0],u=c?ad(c):null,h=u!==e||!t||!o,d={connected:!!c,lost:e!==null&&!l.some(T=>ad(T)===e),input:{throttle:0,brake:0,steer:0,handbrake:0},pressed:{confirm:!1,back:!1,pause:!1,view:!1,recenter:!1},direction:{x:0,y:0},look:{x:0,y:0}},f=T=>{var _,M;return ys((M=(_=c==null?void 0:c.buttons)==null?void 0:_[T])==null?void 0:M.value,0,1)},p=T=>{var _,M;return((M=(_=c==null?void 0:c.buttons)==null?void 0:_[T])==null?void 0:M.pressed)===!0||f(T)>.5},v=Object.fromEntries(Object.entries(sd).map(([T,_])=>[T,p(_)])),g=ys((P=c==null?void 0:c.axes)==null?void 0:P[0],-1,1),m=ys((R=c==null?void 0:c.axes)==null?void 0:R[1],-1,1),S=Number(p(15))-Number(p(14)),y=Number(p(13))-Number(p(12)),x={x:S||(Math.abs(g)>.45?Math.sign(g):0),y:y||(Math.abs(m)>.45?Math.sign(m):0)};if(c&&o&&(d.input={throttle:f(7),brake:f(6),steer:ml(g)||S,handbrake:Number(p(2))},d.look={x:ml((A=c.axes)==null?void 0:A[2]),y:ml((I=c.axes)==null?void 0:I[3])},!h)){for(const T in sd)d.pressed[T]=v[T]&&!n[T];x.x||x.y?x.x!==i.x||x.y!==i.y?(d.direction=x,s=.32):(s-=ys(a,0,.1),s<=1e-9&&(d.direction=x,s+=.16)):s=1/0}return h&&(s=1/0),e=u,t=!!o,n=v,i=x,d}}}function ry(r){const e={id:null,room:null,closed:!1,status:"Create a room or paste an invite code.",car:null,correction:{x:0,z:0}};let t=null,n=0,i=0,s=0;const a=h=>(t==null?void 0:t.readyState)!==1||t.bufferedAmount>16384||!Rf(h)?!1:(t.send(JSON.stringify(h)),!0);function o(){s++,t==null||t.close(),t=null,e.id=null,e.room=null,e.closed=!1,e.car=null,e.correction={x:0,z:0},e.status="Create a room or paste an invite code.",r(e)}function l(h,d,f,p){o();const v=s;e.status="Connecting…",r(e);try{t=new WebSocket("wss://sankosurvivors-coop.spidertag.app/racers")}catch{e.status="Could not connect. Try again.",r(e);return}const g=t;g.onopen=()=>{v===s&&(n=0,a({type:h,version:wc.version,name:d,kart:f,...h==="join"?{room:p}:{}}))},g.onmessage=m=>{if(v!==s)return;let S;try{S=JSON.parse(m.data)}catch{return}if(!(!S||typeof S!="object")){if(S.type==="joined"&&(e.id=S.id),S.type==="error"&&(e.status=S.message),S.type==="closed"&&(e.closed=!0,e.room=S.finalRoom||null,e.car=null,e.correction={x:0,z:0},e.status=S.message),S.type==="room"&&Array.isArray(S.players)&&S.players.length<=4){const y=S.players.find(x=>(x==null?void 0:x.id)===e.id);if(!y||S.players.some(x=>!x||x.car&&!Cf(x.car)))return;if(y.car){const x=e.car,P=((x==null?void 0:x.x)??y.car.x)+e.correction.x-y.car.x,R=((x==null?void 0:x.z)??y.car.z)+e.correction.z-y.car.z;e.correction=Math.hypot(P,R)<3?{x:P,z:R}:{x:0,z:0},e.car={...y.car}}e.room=S,e.status=S.message||{lobby:"Everyone ready? The host starts the race.",countdown:"Get ready!",racing:"Race live · menus do not pause other racers.",ended:"Race ended."}[S.phase]||""}r(e)}},g.onerror=()=>{v===s&&(e.status="Connection failed. Leave and try again.",r(e))},g.onclose=()=>{v===s&&(e.closed=!0,e.room&&(e.room={...e.room,phase:"ended",message:"Disconnected. Recorded finishes are shown below; unfinished racers did not finish.",players:e.room.players.map(m=>({...m,dnf:!m.race.finished}))}),e.status="Disconnected. Leave this room to create or join another.",r(e))}}function c(h,d=!1){const f=performance.now();if(!(!e.room||!["countdown","racing"].includes(e.room.phase)||!d&&f-i<50))return a({type:"input",seq:n,...h})?(n++,i=f,!0):!1}function u(h,d,f,p){var m,S;if(!Number.isFinite(h)||h<=0)return;h=Math.min(h,.1);const v=(m=e.room)==null?void 0:m.players.find(y=>y.id===e.id);e.car&&((S=e.room)==null?void 0:S.phase)==="racing"&&!(v!=null&&v.race.finished)&&!(v!=null&&v.dnf)&&ea(e.car,d,h,f,p);const g=Math.exp(-12*h);e.correction.x*=g,e.correction.z*=g}return{state:e,connect:l,leave:o,input:c,advance:u,ready:(h,d)=>a({type:"ready",ready:h,kart:d}),start:()=>a({type:"start"}),neutral:()=>c(Pf(),!0)}}const sy=()=>({firstPerson:!1,yaw:0,pitch:0});function Nf(r,e,t,n=!1){!Number.isFinite(e)||!Number.isFinite(t)||(r.yaw=(r.yaw-e*.005)%(Math.PI*2),r.pitch=Math.max(-.65,Math.min(.65,r.pitch+(r.firstPerson&&!n?-t:t)*.005)))}function uu(r){r.yaw=0,r.pitch=0}function ay(r,e){const t=e+r.yaw,n=Math.cos(r.pitch);return{x:Math.sin(t)*n,y:Math.sin(r.pitch),z:Math.cos(t)*n}}function hu(r,e){return{...r,x:r.x+((e==null?void 0:e.x)||0),z:r.z+((e==null?void 0:e.z)||0)}}function oy(r,e){const t=Math.min(Math.abs(r)/20,1);return{distance:5.2+1.6*t,height:2.3+.5*t,ahead:r<0?-2*t:4+5*t,fov:57+(e?0:6*t)}}function ly(r=1){const n=new Float32Array(1728),i=new Float32Array(576),s=new Float32Array(96),a=new Float32Array(192),o=new Float32Array(64),l=new Float32Array(64),c=new Float32Array(192),u=new It,h=new It;u.setAttribute("position",new wt(n,3).setUsage(sa)),u.setAttribute("opacity",new wt(i,1).setUsage(sa)),h.setAttribute("position",new wt(a,3).setUsage(sa)),h.setAttribute("opacity",new wt(o,1).setUsage(sa));const d="attribute float opacity;varying float fade;void main(){fade=opacity;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",f=`uniform vec3 color;varying float fade;void main(){if(fade<0.002)discard;gl_FragColor=vec4(color,fade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,p=new At({uniforms:{color:{value:new Ae(2564120)}},vertexShader:d,fragmentShader:f,transparent:!0,depthWrite:!1,side:bn}),v=new At({uniforms:{color:{value:new Ae(11837828)},pixelRatio:{value:r}},vertexShader:"attribute float opacity;uniform float pixelRatio;varying float fade;void main(){fade=opacity;vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_PointSize=clamp(70.0*pixelRatio/max(0.1,-p.z),2.0,18.0);}",fragmentShader:`uniform vec3 color;varying float fade;void main(){float a=fade*(1.0-smoothstep(0.12,0.5,length(gl_PointCoord-vec2(0.5))));if(a<0.002)discard;gl_FragColor=vec4(color,a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,transparent:!0,depthWrite:!1}),g=new Ft(u,p),m=new _f(h,v);g.frustumCulled=m.frustumCulled=!1,g.renderOrder=m.renderOrder=1;let S=0,y=0,x=711,P=0,R=!1,A=0;const I=[null,null],T=()=>(x=Math.imul(x,1664525)+1013904223>>>0,x/4294967296);function _(N,F){for(let k=0;k<F;k++){const W=y++%64,V=W*3;a[V]=N.x+(T()-.5)*.16,a[V+1]=N.y+.08,a[V+2]=N.z+(T()-.5)*.16,c[V]=(T()-.5)*.5,c[V+1]=.25+T()*.35,c[V+2]=(T()-.5)*.5,l[W]=.6,o[W]=.2}}function M(N,F){const k=F.x-N.x,W=F.z-N.z,V=Math.hypot(k,W);if(V<.18||V>2.5)return!1;const K=-W/V*.055,$=k/V*.055,J=S++%96;return n.set([N.x+K,N.y+.025,N.z+$,N.x-K,N.y+.025,N.z-$,F.x+K,F.y+.025,F.z+$,F.x+K,F.y+.025,F.z+$,N.x-K,N.y+.025,N.z-$,F.x-K,F.y+.025,F.z-$],J*18),s[J]=6,i.fill(.32,J*6,J*6+6),!0}function L(){s.fill(0),i.fill(0),l.fill(0),o.fill(0),I.fill(null),S=y=0,P=0,R=!1,A=0,u.attributes.opacity.needsUpdate=h.attributes.opacity.needsUpdate=!0}function U(N,F,k,W,V){if(!Number.isFinite(W)||W<=0)return;W=Math.min(W,.1),P=Math.max(0,P-W);for(let $=0;$<96;$++)s[$]>0&&(s[$]=Math.max(0,s[$]-W),i.fill(.32*s[$]/6,$*6,$*6+6));for(let $=0;$<64;$++)if(l[$]>0){l[$]=Math.max(0,l[$]-W),o[$]=.2*l[$]/.6;const J=$*3;for(let oe=0;oe<3;oe++)a[J+oe]+=c[J+oe]*W}const K=Math.abs(N.speed)>3&&(Math.abs(N.slip||0)>.025||F.brake||F.handbrake);for(let $=0;$<Math.min(2,k.length);$++){const J=k[$],oe=I[$],Re=oe?Math.hypot(J.x-oe.x,J.z-oe.z):0;K&&oe&&M(oe,J),!V&&K&&oe&&Re>=.03&&Re<=2.5&&P===0&&_(J,2),!V&&N.hit&&!R&&A>3&&_(J,4),(!oe||Re>=.18||!K)&&(I[$]={x:J.x,y:J.y,z:J.z})}K&&P===0&&(P=.08),R=N.hit,A=Math.abs(N.speed),u.attributes.position.needsUpdate=u.attributes.opacity.needsUpdate=h.attributes.position.needsUpdate=h.attributes.opacity.needsUpdate=!0}return{markMesh:g,dustMesh:m,update:U,clear:L,inspect:()=>({marks:s.reduce((N,F)=>N+(F>0),0),dust:l.reduce((N,F)=>N+(F>0),0),allocatedBytes:[n,i,s,a,o,l,c].reduce((N,F)=>N+F.byteLength,0)})}}function od(r,e){if(e===qp)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),r;if(e===pc||e===Zd){let t=r.getIndex();if(t===null){const a=[],o=r.getAttribute("position");if(o!==void 0){for(let l=0;l<o.count;l++)a.push(l);r.setIndex(a),t=r.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),r}const n=t.count-2,i=[];if(e===pc)for(let a=1;a<=n;a++)i.push(t.getX(0)),i.push(t.getX(a)),i.push(t.getX(a+1));else for(let a=0;a<n;a++)a%2===0?(i.push(t.getX(a)),i.push(t.getX(a+1)),i.push(t.getX(a+2))):(i.push(t.getX(a+2)),i.push(t.getX(a+1)),i.push(t.getX(a)));i.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=r.clone();return s.setIndex(i),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),r}class cy extends Zn{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new py(t)}),this.register(function(t){return new my(t)}),this.register(function(t){return new Ty(t)}),this.register(function(t){return new Ey(t)}),this.register(function(t){return new wy(t)}),this.register(function(t){return new vy(t)}),this.register(function(t){return new xy(t)}),this.register(function(t){return new _y(t)}),this.register(function(t){return new yy(t)}),this.register(function(t){return new fy(t)}),this.register(function(t){return new My(t)}),this.register(function(t){return new gy(t)}),this.register(function(t){return new by(t)}),this.register(function(t){return new Sy(t)}),this.register(function(t){return new hy(t)}),this.register(function(t){return new Ay(t)}),this.register(function(t){return new Cy(t)})}load(e,t,n,i){const s=this;let a;if(this.resourcePath!=="")a=this.resourcePath;else if(this.path!==""){const c=Hr.extractUrlBase(e);a=Hr.resolveURL(c,this.path)}else a=Hr.extractUrlBase(e);this.manager.itemStart(e);const o=function(c){i?i(c):console.error(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new zs(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,a,function(u){t(u),s.manager.itemEnd(e)},o)}catch(u){o(u)}},n,o)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,i){let s;const a={},o={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===Ff){try{a[nt.KHR_BINARY_GLTF]=new Ry(e)}catch(h){i&&i(h);return}s=JSON.parse(a[nt.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){i&&i(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new Hy(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){const h=this.pluginCallbacks[u](c);h.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),o[h.name]=h,a[h.name]=!0}if(s.extensionsUsed)for(let u=0;u<s.extensionsUsed.length;++u){const h=s.extensionsUsed[u],d=s.extensionsRequired||[];switch(h){case nt.KHR_MATERIALS_UNLIT:a[h]=new dy;break;case nt.KHR_DRACO_MESH_COMPRESSION:a[h]=new Py(s,this.dracoLoader);break;case nt.KHR_TEXTURE_TRANSFORM:a[h]=new Iy;break;case nt.KHR_MESH_QUANTIZATION:a[h]=new Dy;break;default:d.indexOf(h)>=0&&o[h]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+h+'".')}}c.setExtensions(a),c.setPlugins(o),c.parse(n,i)}parseAsync(e,t){const n=this;return new Promise(function(i,s){n.parse(e,t,i,s)})}}function uy(){let r={};return{get:function(e){return r[e]},add:function(e,t){r[e]=t},remove:function(e){delete r[e]},removeAll:function(){r={}}}}const nt={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class hy{constructor(e){this.parser=e,this.name=nt.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let n=0,i=t.length;n<i;n++){const s=t[n];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){const t=this.parser,n="light:"+e;let i=t.cache.get(n);if(i)return i;const s=t.json,l=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e];let c;const u=new Ae(16777215);l.color!==void 0&&u.setRGB(l.color[0],l.color[1],l.color[2],nn);const h=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new ru(u),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new ho(u),c.distance=h;break;case"spot":c=new Af(u),c.distance=h,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),c.decay=2,hi(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),i=Promise.resolve(c),t.cache.add(n,i),i}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,n=this.parser,s=n.json.nodes[e],o=(s.extensions&&s.extensions[this.name]||{}).light;return o===void 0?null:this._loadLight(o).then(function(l){return n._getNodeRef(t.cache,o,l)})}}class dy{constructor(){this.name=nt.KHR_MATERIALS_UNLIT}getMaterialType(){return vi}extendParams(e,t,n){const i=[];e.color=new Ae(1,1,1),e.opacity=1;const s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const a=s.baseColorFactor;e.color.setRGB(a[0],a[1],a[2],nn),e.opacity=a[3]}s.baseColorTexture!==void 0&&i.push(n.assignTexture(e,"map",s.baseColorTexture,at))}return Promise.all(i)}}class fy{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name].emissiveStrength;return s!==void 0&&(t.emissiveIntensity=s),Promise.resolve()}}class py{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];if(a.clearcoatFactor!==void 0&&(t.clearcoat=a.clearcoatFactor),a.clearcoatTexture!==void 0&&s.push(n.assignTexture(t,"clearcoatMap",a.clearcoatTexture)),a.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=a.clearcoatRoughnessFactor),a.clearcoatRoughnessTexture!==void 0&&s.push(n.assignTexture(t,"clearcoatRoughnessMap",a.clearcoatRoughnessTexture)),a.clearcoatNormalTexture!==void 0&&(s.push(n.assignTexture(t,"clearcoatNormalMap",a.clearcoatNormalTexture)),a.clearcoatNormalTexture.scale!==void 0)){const o=a.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new Ue(o,o)}return Promise.all(s)}}class my{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_DISPERSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return t.dispersion=s.dispersion!==void 0?s.dispersion:0,Promise.resolve()}}class gy{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];return a.iridescenceFactor!==void 0&&(t.iridescence=a.iridescenceFactor),a.iridescenceTexture!==void 0&&s.push(n.assignTexture(t,"iridescenceMap",a.iridescenceTexture)),a.iridescenceIor!==void 0&&(t.iridescenceIOR=a.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),a.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=a.iridescenceThicknessMinimum),a.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=a.iridescenceThicknessMaximum),a.iridescenceThicknessTexture!==void 0&&s.push(n.assignTexture(t,"iridescenceThicknessMap",a.iridescenceThicknessTexture)),Promise.all(s)}}class vy{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_SHEEN}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[];t.sheenColor=new Ae(0,0,0),t.sheenRoughness=0,t.sheen=1;const a=i.extensions[this.name];if(a.sheenColorFactor!==void 0){const o=a.sheenColorFactor;t.sheenColor.setRGB(o[0],o[1],o[2],nn)}return a.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=a.sheenRoughnessFactor),a.sheenColorTexture!==void 0&&s.push(n.assignTexture(t,"sheenColorMap",a.sheenColorTexture,at)),a.sheenRoughnessTexture!==void 0&&s.push(n.assignTexture(t,"sheenRoughnessMap",a.sheenRoughnessTexture)),Promise.all(s)}}class xy{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];return a.transmissionFactor!==void 0&&(t.transmission=a.transmissionFactor),a.transmissionTexture!==void 0&&s.push(n.assignTexture(t,"transmissionMap",a.transmissionTexture)),Promise.all(s)}}class _y{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_VOLUME}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];t.thickness=a.thicknessFactor!==void 0?a.thicknessFactor:0,a.thicknessTexture!==void 0&&s.push(n.assignTexture(t,"thicknessMap",a.thicknessTexture)),t.attenuationDistance=a.attenuationDistance||1/0;const o=a.attenuationColor||[1,1,1];return t.attenuationColor=new Ae().setRGB(o[0],o[1],o[2],nn),Promise.all(s)}}class yy{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_IOR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const i=this.parser.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=i.extensions[this.name];return t.ior=s.ior!==void 0?s.ior:1.5,Promise.resolve()}}class My{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_SPECULAR}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];t.specularIntensity=a.specularFactor!==void 0?a.specularFactor:1,a.specularTexture!==void 0&&s.push(n.assignTexture(t,"specularIntensityMap",a.specularTexture));const o=a.specularColorFactor||[1,1,1];return t.specularColor=new Ae().setRGB(o[0],o[1],o[2],nn),a.specularColorTexture!==void 0&&s.push(n.assignTexture(t,"specularColorMap",a.specularColorTexture,at)),Promise.all(s)}}class Sy{constructor(e){this.parser=e,this.name=nt.EXT_MATERIALS_BUMP}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];return t.bumpScale=a.bumpFactor!==void 0?a.bumpFactor:1,a.bumpTexture!==void 0&&s.push(n.assignTexture(t,"bumpMap",a.bumpTexture)),Promise.all(s)}}class by{constructor(e){this.parser=e,this.name=nt.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){const n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:ei}extendMaterialParams(e,t){const n=this.parser,i=n.json.materials[e];if(!i.extensions||!i.extensions[this.name])return Promise.resolve();const s=[],a=i.extensions[this.name];return a.anisotropyStrength!==void 0&&(t.anisotropy=a.anisotropyStrength),a.anisotropyRotation!==void 0&&(t.anisotropyRotation=a.anisotropyRotation),a.anisotropyTexture!==void 0&&s.push(n.assignTexture(t,"anisotropyMap",a.anisotropyTexture)),Promise.all(s)}}class Ty{constructor(e){this.parser=e,this.name=nt.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,n=t.json,i=n.textures[e];if(!i.extensions||!i.extensions[this.name])return null;const s=i.extensions[this.name],a=t.options.ktx2Loader;if(!a){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,a)}}class Ey{constructor(e){this.parser=e,this.name=nt.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,i=n.json,s=i.textures[e];if(!s.extensions||!s.extensions[t])return null;const a=s.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(e,a.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class wy{constructor(e){this.parser=e,this.name=nt.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){const t=this.name,n=this.parser,i=n.json,s=i.textures[e];if(!s.extensions||!s.extensions[t])return null;const a=s.extensions[t],o=i.images[a.source];let l=n.textureLoader;if(o.uri){const c=n.options.manager.getHandler(o.uri);c!==null&&(l=c)}return this.detectSupport().then(function(c){if(c)return n.loadTextureImage(e,a.source,l);if(i.extensionsRequired&&i.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}}class Ay{constructor(e){this.name=nt.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){const t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){const i=n.extensions[this.name],s=this.parser.getDependency("buffer",i.buffer),a=this.parser.options.meshoptDecoder;if(!a||!a.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(o){const l=i.byteOffset||0,c=i.byteLength||0,u=i.count,h=i.byteStride,d=new Uint8Array(o,l,c);return a.decodeGltfBufferAsync?a.decodeGltfBufferAsync(u,h,d,i.mode,i.filter).then(function(f){return f.buffer}):a.ready.then(function(){const f=new ArrayBuffer(u*h);return a.decodeGltfBuffer(new Uint8Array(f),u,h,d,i.mode,i.filter),f})})}else return null}}class Cy{constructor(e){this.name=nt.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;const i=t.meshes[n.mesh];for(const c of i.primitives)if(c.mode!==yn.TRIANGLES&&c.mode!==yn.TRIANGLE_STRIP&&c.mode!==yn.TRIANGLE_FAN&&c.mode!==void 0)return null;const a=n.extensions[this.name].attributes,o=[],l={};for(const c in a)o.push(this.parser.getDependency("accessor",a[c]).then(u=>(l[c]=u,l[c])));return o.length<1?null:(o.push(this.parser.createNodeMesh(e)),Promise.all(o).then(c=>{const u=c.pop(),h=u.isGroup?u.children:[u],d=c[0].count,f=[];for(const p of h){const v=new me,g=new C,m=new ht,S=new C(1,1,1),y=new xc(p.geometry,p.material,d);for(let x=0;x<d;x++)l.TRANSLATION&&g.fromBufferAttribute(l.TRANSLATION,x),l.ROTATION&&m.fromBufferAttribute(l.ROTATION,x),l.SCALE&&S.fromBufferAttribute(l.SCALE,x),y.setMatrixAt(x,v.compose(g,m,S));for(const x in l)if(x==="_COLOR_0"){const P=l[x];y.instanceColor=new vc(P.array,P.itemSize,P.normalized)}else x!=="TRANSLATION"&&x!=="ROTATION"&&x!=="SCALE"&&p.geometry.setAttribute(x,l[x]);dt.prototype.copy.call(y,p),this.parser.assignFinalMaterial(y),f.push(y)}return u.isGroup?(u.clear(),u.add(...f),u):f[0]}))}}const Ff="glTF",gs=12,ld={JSON:1313821514,BIN:5130562};class Ry{constructor(e){this.name=nt.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,gs),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Ff)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const i=this.header.length-gs,s=new DataView(e,gs);let a=0;for(;a<i;){const o=s.getUint32(a,!0);a+=4;const l=s.getUint32(a,!0);if(a+=4,l===ld.JSON){const c=new Uint8Array(e,gs+a,o);this.content=n.decode(c)}else if(l===ld.BIN){const c=gs+a;this.body=e.slice(c,c+o)}a+=o}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class Py{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=nt.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const n=this.json,i=this.dracoLoader,s=e.extensions[this.name].bufferView,a=e.extensions[this.name].attributes,o={},l={},c={};for(const u in a){const h=Ac[u]||u.toLowerCase();o[h]=a[u]}for(const u in e.attributes){const h=Ac[u]||u.toLowerCase();if(a[u]!==void 0){const d=n.accessors[e.attributes[u]],f=Gr[d.componentType];c[h]=f.name,l[h]=d.normalized===!0}}return t.getDependency("bufferView",s).then(function(u){return new Promise(function(h,d){i.decodeDracoFile(u,function(f){for(const p in f.attributes){const v=f.attributes[p],g=l[p];g!==void 0&&(v.normalized=g)}h(f)},o,c,nn,d)})})}}class Iy{constructor(){this.name=nt.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class Dy{constructor(){this.name=nt.KHR_MESH_QUANTIZATION}}class Of extends Zs{constructor(e,t,n,i){super(e,t,n,i)}copySampleValue_(e){const t=this.resultBuffer,n=this.sampleValues,i=this.valueSize,s=e*i*3+i;for(let a=0;a!==i;a++)t[a]=n[s+a];return t}interpolate_(e,t,n,i){const s=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=o*2,c=o*3,u=i-t,h=(n-t)/u,d=h*h,f=d*h,p=e*c,v=p-c,g=-2*f+3*d,m=f-d,S=1-g,y=m-d+h;for(let x=0;x!==o;x++){const P=a[v+x+o],R=a[v+x+l]*u,A=a[p+x+o],I=a[p+x]*u;s[x]=S*P+y*R+g*A+m*I}return s}}const Ly=new ht;class Uy extends Of{interpolate_(e,t,n,i){const s=super.interpolate_(e,t,n,i);return Ly.fromArray(s).normalize().toArray(s),s}}const yn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Gr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},cd={9728:kt,9729:en,9984:kd,9985:Ya,9986:vs,9987:qn},ud={33071:jn,33648:ro,10497:Rn},gl={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Ac={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Pi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},Ny={CUBICSPLINE:void 0,LINEAR:Ls,STEP:Ds},vl={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function Fy(r){return r.DefaultMaterial===void 0&&(r.DefaultMaterial=new Ks({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:_i})),r.DefaultMaterial}function Yi(r,e,t){for(const n in t.extensions)r[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function hi(r,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(r.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Oy(r,e,t){let n=!1,i=!1,s=!1;for(let c=0,u=e.length;c<u;c++){const h=e[c];if(h.POSITION!==void 0&&(n=!0),h.NORMAL!==void 0&&(i=!0),h.COLOR_0!==void 0&&(s=!0),n&&i&&s)break}if(!n&&!i&&!s)return Promise.resolve(r);const a=[],o=[],l=[];for(let c=0,u=e.length;c<u;c++){const h=e[c];if(n){const d=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):r.attributes.position;a.push(d)}if(i){const d=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):r.attributes.normal;o.push(d)}if(s){const d=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):r.attributes.color;l.push(d)}}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l)]).then(function(c){const u=c[0],h=c[1],d=c[2];return n&&(r.morphAttributes.position=u),i&&(r.morphAttributes.normal=h),s&&(r.morphAttributes.color=d),r.morphTargetsRelative=!0,r})}function By(r,e){if(r.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)r.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(r.morphTargetInfluences.length===t.length){r.morphTargetDictionary={};for(let n=0,i=t.length;n<i;n++)r.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function ky(r){let e;const t=r.extensions&&r.extensions[nt.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+xl(t.attributes):e=r.indices+":"+xl(r.attributes)+":"+r.mode,r.targets!==void 0)for(let n=0,i=r.targets.length;n<i;n++)e+=":"+xl(r.targets[n]);return e}function xl(r){let e="";const t=Object.keys(r).sort();for(let n=0,i=t.length;n<i;n++)e+=t[n]+":"+r[t[n]]+";";return e}function Cc(r){switch(r){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function zy(r){return r.search(/\.jpe?g($|\?)/i)>0||r.search(/^data\:image\/jpeg/)===0?"image/jpeg":r.search(/\.webp($|\?)/i)>0||r.search(/^data\:image\/webp/)===0?"image/webp":r.search(/\.ktx2($|\?)/i)>0||r.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const Vy=new me;class Hy{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new uy,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,i=-1,s=!1,a=-1;if(typeof navigator<"u"){const o=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(o)===!0;const l=o.match(/Version\/(\d+)/);i=n&&l?parseInt(l[1],10):-1,s=o.indexOf("Firefox")>-1,a=s?o.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&i<17||s&&a<98?this.textureLoader=new wf(this.options.manager):this.textureLoader=new v5(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new zs(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const n=this,i=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(a){return a._markDefs&&a._markDefs()}),Promise.all(this._invokeAll(function(a){return a.beforeRoot&&a.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(a){const o={scene:a[0][i.scene||0],scenes:a[0],animations:a[1],cameras:a[2],asset:i.asset,parser:n,userData:{}};return Yi(s,o,i),hi(o,i),Promise.all(n._invokeAll(function(l){return l.afterRoot&&l.afterRoot(o)})).then(function(){for(const l of o.scenes)l.updateMatrixWorld();e(o)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let i=0,s=t.length;i<s;i++){const a=t[i].joints;for(let o=0,l=a.length;o<l;o++)e[a[o]].isBone=!0}for(let i=0,s=e.length;i<s;i++){const a=e[i];a.mesh!==void 0&&(this._addNodeRef(this.meshCache,a.mesh),a.skin!==void 0&&(n[a.mesh].isSkinnedMesh=!0)),a.camera!==void 0&&this._addNodeRef(this.cameraCache,a.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;const i=n.clone(),s=(a,o)=>{const l=this.associations.get(a);l!=null&&this.associations.set(o,l);for(const[c,u]of a.children.entries())s(u,o.children[c])};return s(n,i),i.name+="_instance_"+e.uses[t]++,i}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){const i=e(t[n]);if(i)return i}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const n=[];for(let i=0;i<t.length;i++){const s=e(t[i]);s&&n.push(s)}return n}getDependency(e,t){const n=e+":"+t;let i=this.cache.get(n);if(!i){switch(e){case"scene":i=this.loadScene(t);break;case"node":i=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":i=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":i=this.loadAccessor(t);break;case"bufferView":i=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":i=this.loadBuffer(t);break;case"material":i=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":i=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":i=this.loadSkin(t);break;case"animation":i=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":i=this.loadCamera(t);break;default:if(i=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!i)throw new Error("Unknown type: "+e);break}this.cache.add(n,i)}return i}getDependencies(e){let t=this.cache.get(e);if(!t){const n=this,i=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(i.map(function(s,a){return n.getDependency(e,a)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[nt.KHR_BINARY_GLTF].body);const i=this.options;return new Promise(function(s,a){n.load(Hr.resolveURL(t.uri,i.path),s,void 0,function(){a(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){const i=t.byteLength||0,s=t.byteOffset||0;return n.slice(s,s+i)})}loadAccessor(e){const t=this,n=this.json,i=this.json.accessors[e];if(i.bufferView===void 0&&i.sparse===void 0){const a=gl[i.type],o=Gr[i.componentType],l=i.normalized===!0,c=new o(i.count*a);return Promise.resolve(new wt(c,a,l))}const s=[];return i.bufferView!==void 0?s.push(this.getDependency("bufferView",i.bufferView)):s.push(null),i.sparse!==void 0&&(s.push(this.getDependency("bufferView",i.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",i.sparse.values.bufferView))),Promise.all(s).then(function(a){const o=a[0],l=gl[i.type],c=Gr[i.componentType],u=c.BYTES_PER_ELEMENT,h=u*l,d=i.byteOffset||0,f=i.bufferView!==void 0?n.bufferViews[i.bufferView].byteStride:void 0,p=i.normalized===!0;let v,g;if(f&&f!==h){const m=Math.floor(d/f),S="InterleavedBuffer:"+i.bufferView+":"+i.componentType+":"+m+":"+i.count;let y=t.cache.get(S);y||(v=new c(o,m*f,i.count*f/u),y=new ff(v,f/u),t.cache.add(S,y)),g=new Ns(y,l,d%f/u,p)}else o===null?v=new c(i.count*l):v=new c(o,d,i.count*l),g=new wt(v,l,p);if(i.sparse!==void 0){const m=gl.SCALAR,S=Gr[i.sparse.indices.componentType],y=i.sparse.indices.byteOffset||0,x=i.sparse.values.byteOffset||0,P=new S(a[1],y,i.sparse.count*m),R=new c(a[2],x,i.sparse.count*l);o!==null&&(g=new wt(g.array.slice(),g.itemSize,g.normalized)),g.normalized=!1;for(let A=0,I=P.length;A<I;A++){const T=P[A];if(g.setX(T,R[A*l]),l>=2&&g.setY(T,R[A*l+1]),l>=3&&g.setZ(T,R[A*l+2]),l>=4&&g.setW(T,R[A*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}g.normalized=p}return g})}loadTexture(e){const t=this.json,n=this.options,s=t.textures[e].source,a=t.images[s];let o=this.textureLoader;if(a.uri){const l=n.manager.getHandler(a.uri);l!==null&&(o=l)}return this.loadTextureImage(e,s,o)}loadTextureImage(e,t,n){const i=this,s=this.json,a=s.textures[e],o=s.images[t],l=(o.uri||o.bufferView)+":"+a.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,n).then(function(u){u.flipY=!1,u.name=a.name||o.name||"",u.name===""&&typeof o.uri=="string"&&o.uri.startsWith("data:image/")===!1&&(u.name=o.uri);const d=(s.samplers||{})[a.sampler]||{};return u.magFilter=cd[d.magFilter]||en,u.minFilter=cd[d.minFilter]||qn,u.wrapS=ud[d.wrapS]||Rn,u.wrapT=ud[d.wrapT]||Rn,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==kt&&u.minFilter!==en,i.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const n=this,i=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());const a=i.images[e],o=self.URL||self.webkitURL;let l=a.uri||"",c=!1;if(a.bufferView!==void 0)l=n.getDependency("bufferView",a.bufferView).then(function(h){c=!0;const d=new Blob([h],{type:a.mimeType});return l=o.createObjectURL(d),l});else if(a.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const u=Promise.resolve(l).then(function(h){return new Promise(function(d,f){let p=d;t.isImageBitmapLoader===!0&&(p=function(v){const g=new Pt(v);g.needsUpdate=!0,d(g)}),t.load(Hr.resolveURL(h,s.path),p,void 0,f)})}).then(function(h){return c===!0&&o.revokeObjectURL(l),hi(h,a),h.userData.mimeType=a.mimeType||zy(a.uri),h}).catch(function(h){throw console.error("THREE.GLTFLoader: Couldn't load texture",l),h});return this.sourceCache[e]=u,u}assignTexture(e,t,n,i){const s=this;return this.getDependency("texture",n.index).then(function(a){if(!a)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(a=a.clone(),a.channel=n.texCoord),s.extensions[nt.KHR_TEXTURE_TRANSFORM]){const o=n.extensions!==void 0?n.extensions[nt.KHR_TEXTURE_TRANSFORM]:void 0;if(o){const l=s.associations.get(a);a=s.extensions[nt.KHR_TEXTURE_TRANSFORM].extendTexture(a,o),s.associations.set(a,l)}}return i!==void 0&&(a.colorSpace=i),e[t]=a,a})}assignFinalMaterial(e){const t=e.geometry;let n=e.material;const i=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,a=t.attributes.normal===void 0;if(e.isPoints){const o="PointsMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new xf,dn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,l.sizeAttenuation=!1,this.cache.add(o,l)),n=l}else if(e.isLine){const o="LineBasicMaterial:"+n.uuid;let l=this.cache.get(o);l||(l=new Fs,dn.prototype.copy.call(l,n),l.color.copy(n.color),l.map=n.map,this.cache.add(o,l)),n=l}if(i||s||a){let o="ClonedMaterial:"+n.uuid+":";i&&(o+="derivative-tangents:"),s&&(o+="vertex-colors:"),a&&(o+="flat-shading:");let l=this.cache.get(o);l||(l=n.clone(),s&&(l.vertexColors=!0),a&&(l.flatShading=!0),i&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(o,l),this.associations.set(l,this.associations.get(n))),n=l}e.material=n}getMaterialType(){return Ks}loadMaterial(e){const t=this,n=this.json,i=this.extensions,s=n.materials[e];let a;const o={},l=s.extensions||{},c=[];if(l[nt.KHR_MATERIALS_UNLIT]){const h=i[nt.KHR_MATERIALS_UNLIT];a=h.getMaterialType(),c.push(h.extendParams(o,s,t))}else{const h=s.pbrMetallicRoughness||{};if(o.color=new Ae(1,1,1),o.opacity=1,Array.isArray(h.baseColorFactor)){const d=h.baseColorFactor;o.color.setRGB(d[0],d[1],d[2],nn),o.opacity=d[3]}h.baseColorTexture!==void 0&&c.push(t.assignTexture(o,"map",h.baseColorTexture,at)),o.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,o.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(o,"metalnessMap",h.metallicRoughnessTexture)),c.push(t.assignTexture(o,"roughnessMap",h.metallicRoughnessTexture))),a=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,o)})))}s.doubleSided===!0&&(o.side=bn);const u=s.alphaMode||vl.OPAQUE;if(u===vl.BLEND?(o.transparent=!0,o.depthWrite=!1):(o.transparent=!1,u===vl.MASK&&(o.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&a!==vi&&(c.push(t.assignTexture(o,"normalMap",s.normalTexture)),o.normalScale=new Ue(1,1),s.normalTexture.scale!==void 0)){const h=s.normalTexture.scale;o.normalScale.set(h,h)}if(s.occlusionTexture!==void 0&&a!==vi&&(c.push(t.assignTexture(o,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(o.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&a!==vi){const h=s.emissiveFactor;o.emissive=new Ae().setRGB(h[0],h[1],h[2],nn)}return s.emissiveTexture!==void 0&&a!==vi&&c.push(t.assignTexture(o,"emissiveMap",s.emissiveTexture,at)),Promise.all(c).then(function(){const h=new a(o);return s.name&&(h.name=s.name),hi(h,s),t.associations.set(h,{materials:e}),s.extensions&&Yi(i,h,s),h})}createUniqueName(e){const t=ot.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,n=this.extensions,i=this.primitiveCache;function s(o){return n[nt.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(o,t).then(function(l){return hd(l,o,t)})}const a=[];for(let o=0,l=e.length;o<l;o++){const c=e[o],u=ky(c),h=i[u];if(h)a.push(h.promise);else{let d;c.extensions&&c.extensions[nt.KHR_DRACO_MESH_COMPRESSION]?d=s(c):d=hd(new It,c,t),i[u]={primitive:c,promise:d},a.push(d)}}return Promise.all(a)}loadMesh(e){const t=this,n=this.json,i=this.extensions,s=n.meshes[e],a=s.primitives,o=[];for(let l=0,c=a.length;l<c;l++){const u=a[l].material===void 0?Fy(this.cache):this.getDependency("material",a[l].material);o.push(u)}return o.push(t.loadGeometries(a)),Promise.all(o).then(function(l){const c=l.slice(0,l.length-1),u=l[l.length-1],h=[];for(let f=0,p=u.length;f<p;f++){const v=u[f],g=a[f];let m;const S=c[f];if(g.mode===yn.TRIANGLES||g.mode===yn.TRIANGLE_STRIP||g.mode===yn.TRIANGLE_FAN||g.mode===void 0)m=s.isSkinnedMesh===!0?new mf(v,S):new Ft(v,S),m.isSkinnedMesh===!0&&m.normalizeSkinWeights(),g.mode===yn.TRIANGLE_STRIP?m.geometry=od(m.geometry,Zd):g.mode===yn.TRIANGLE_FAN&&(m.geometry=od(m.geometry,pc));else if(g.mode===yn.LINES)m=new gf(v,S);else if(g.mode===yn.LINE_STRIP)m=new wo(v,S);else if(g.mode===yn.LINE_LOOP)m=new vf(v,S);else if(g.mode===yn.POINTS)m=new _f(v,S);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+g.mode);Object.keys(m.geometry.morphAttributes).length>0&&By(m,s),m.name=t.createUniqueName(s.name||"mesh_"+e),hi(m,s),g.extensions&&Yi(i,m,g),t.assignFinalMaterial(m),h.push(m)}for(let f=0,p=h.length;f<p;f++)t.associations.set(h[f],{meshes:e,primitives:f});if(h.length===1)return s.extensions&&Yi(i,h[0],s),h[0];const d=new Yt;s.extensions&&Yi(i,d,s),t.associations.set(d,{meshes:e});for(let f=0,p=h.length;f<p;f++)d.add(h[f]);return d})}loadCamera(e){let t;const n=this.json.cameras[e],i=n[n.type];if(!i){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Qt(jt.radToDeg(i.yfov),i.aspectRatio||1,i.znear||1,i.zfar||2e6):n.type==="orthographic"&&(t=new bo(-i.xmag,i.xmag,i.ymag,-i.ymag,i.znear,i.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),hi(t,n),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],n=[];for(let i=0,s=t.joints.length;i<s;i++)n.push(this._loadNodeShallow(t.joints[i]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(i){const s=i.pop(),a=i,o=[],l=[];for(let c=0,u=a.length;c<u;c++){const h=a[c];if(h){o.push(h);const d=new me;s!==null&&d.fromArray(s.array,c*16),l.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[c])}return new Ys(o,l)})}loadAnimation(e){const t=this.json,n=this,i=t.animations[e],s=i.name?i.name:"animation_"+e,a=[],o=[],l=[],c=[],u=[];for(let h=0,d=i.channels.length;h<d;h++){const f=i.channels[h],p=i.samplers[f.sampler],v=f.target,g=v.node,m=i.parameters!==void 0?i.parameters[p.input]:p.input,S=i.parameters!==void 0?i.parameters[p.output]:p.output;v.node!==void 0&&(a.push(this.getDependency("node",g)),o.push(this.getDependency("accessor",m)),l.push(this.getDependency("accessor",S)),c.push(p),u.push(v))}return Promise.all([Promise.all(a),Promise.all(o),Promise.all(l),Promise.all(c),Promise.all(u)]).then(function(h){const d=h[0],f=h[1],p=h[2],v=h[3],g=h[4],m=[];for(let S=0,y=d.length;S<y;S++){const x=d[S],P=f[S],R=p[S],A=v[S],I=g[S];if(x===void 0)continue;x.updateMatrix&&x.updateMatrix();const T=n._createAnimationTracks(x,P,R,A,I);if(T)for(let _=0;_<T.length;_++)m.push(T[_])}return new uo(s,void 0,m)})}createNodeMesh(e){const t=this.json,n=this,i=t.nodes[e];return i.mesh===void 0?null:n.getDependency("mesh",i.mesh).then(function(s){const a=n._getNodeRef(n.meshCache,i.mesh,s);return i.weights!==void 0&&a.traverse(function(o){if(o.isMesh)for(let l=0,c=i.weights.length;l<c;l++)o.morphTargetInfluences[l]=i.weights[l]}),a})}loadNode(e){const t=this.json,n=this,i=t.nodes[e],s=n._loadNodeShallow(e),a=[],o=i.children||[];for(let c=0,u=o.length;c<u;c++)a.push(n.getDependency("node",o[c]));const l=i.skin===void 0?Promise.resolve(null):n.getDependency("skin",i.skin);return Promise.all([s,Promise.all(a),l]).then(function(c){const u=c[0],h=c[1],d=c[2];d!==null&&u.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Vy)});for(let f=0,p=h.length;f<p;f++)u.add(h[f]);return u})}_loadNodeShallow(e){const t=this.json,n=this.extensions,i=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const s=t.nodes[e],a=s.name?i.createUniqueName(s.name):"",o=[],l=i._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&o.push(l),s.camera!==void 0&&o.push(i.getDependency("camera",s.camera).then(function(c){return i._getNodeRef(i.cameraCache,s.camera,c)})),i._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){o.push(c)}),this.nodeCache[e]=Promise.all(o).then(function(c){let u;if(s.isBone===!0?u=new oo:c.length>1?u=new Yt:c.length===1?u=c[0]:u=new dt,u!==c[0])for(let h=0,d=c.length;h<d;h++)u.add(c[h]);if(s.name&&(u.userData.name=s.name,u.name=a),hi(u,s),s.extensions&&Yi(n,u,s),s.matrix!==void 0){const h=new me;h.fromArray(s.matrix),u.applyMatrix4(h)}else s.translation!==void 0&&u.position.fromArray(s.translation),s.rotation!==void 0&&u.quaternion.fromArray(s.rotation),s.scale!==void 0&&u.scale.fromArray(s.scale);return i.associations.has(u)||i.associations.set(u,{}),i.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){const t=this.extensions,n=this.json.scenes[e],i=this,s=new Yt;n.name&&(s.name=i.createUniqueName(n.name)),hi(s,n),n.extensions&&Yi(t,s,n);const a=n.nodes||[],o=[];for(let l=0,c=a.length;l<c;l++)o.push(i.getDependency("node",a[l]));return Promise.all(o).then(function(l){for(let u=0,h=l.length;u<h;u++)s.add(l[u]);const c=u=>{const h=new Map;for(const[d,f]of i.associations)(d instanceof dn||d instanceof Pt)&&h.set(d,f);return u.traverse(d=>{const f=i.associations.get(d);f!=null&&h.set(d,f)}),h};return i.associations=c(s),s})}_createAnimationTracks(e,t,n,i,s){const a=[],o=e.name?e.name:e.uuid,l=[];Pi[s.path]===Pi.weights?e.traverse(function(d){d.morphTargetInfluences&&l.push(d.name?d.name:d.uuid)}):l.push(o);let c;switch(Pi[s.path]){case Pi.weights:c=rr;break;case Pi.rotation:c=Oi;break;case Pi.position:case Pi.scale:c=sr;break;default:switch(n.itemSize){case 1:c=rr;break;case 2:case 3:default:c=sr;break}break}const u=i.interpolation!==void 0?Ny[i.interpolation]:Ls,h=this._getArrayFromAccessor(n);for(let d=0,f=l.length;d<f;d++){const p=new c(l[d]+"."+Pi[s.path],t.array,h,u);i.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(p),a.push(p)}return a}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const n=Cc(t.constructor),i=new Float32Array(t.length);for(let s=0,a=t.length;s<a;s++)i[s]=t[s]*n;t=i}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){const i=this instanceof Oi?Uy:Of;return new i(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function Gy(r,e,t){const n=e.attributes,i=new Xt;if(n.POSITION!==void 0){const o=t.json.accessors[n.POSITION],l=o.min,c=o.max;if(l!==void 0&&c!==void 0){if(i.set(new C(l[0],l[1],l[2]),new C(c[0],c[1],c[2])),o.normalized){const u=Cc(Gr[o.componentType]);i.min.multiplyScalar(u),i.max.multiplyScalar(u)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=e.targets;if(s!==void 0){const o=new C,l=new C;for(let c=0,u=s.length;c<u;c++){const h=s[c];if(h.POSITION!==void 0){const d=t.json.accessors[h.POSITION],f=d.min,p=d.max;if(f!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(f[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(f[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(f[2]),Math.abs(p[2]))),d.normalized){const v=Cc(Gr[d.componentType]);l.multiplyScalar(v)}o.max(l)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}i.expandByVector(o)}r.boundingBox=i;const a=new Qn;i.getCenter(a.center),a.radius=i.min.distanceTo(i.max)/2,r.boundingSphere=a}function hd(r,e,t){const n=e.attributes,i=[];function s(a,o){return t.getDependency("accessor",a).then(function(l){r.setAttribute(o,l)})}for(const a in n){const o=Ac[a]||a.toLowerCase();o in r.attributes||i.push(s(n[a],o))}if(e.indices!==void 0&&!r.index){const a=t.getDependency("accessor",e.indices).then(function(o){r.setIndex(o)});i.push(a)}return Xe.workingColorSpace!==nn&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Xe.workingColorSpace}" not supported.`),hi(r,e),Gy(r,e,t),Promise.all(i).then(function(){return e.targets!==void 0?Oy(r,e.targets,t):r})}const _l=new WeakMap;class Wy extends Zn{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,n,i){const s=new zs(this.manager);s.setPath(this.path),s.setResponseType("arraybuffer"),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,a=>{this.parse(a,t,i)},n,i)}parse(e,t,n=()=>{}){this.decodeDracoFile(e,t,null,null,at,n).catch(n)}decodeDracoFile(e,t,n,i,s=nn,a=()=>{}){const o={attributeIDs:n||this.defaultAttributeIDs,attributeTypes:i||this.defaultAttributeTypes,useUniqueIDs:!!n,vertexColorSpace:s};return this.decodeGeometry(e,o).then(t).catch(a)}decodeGeometry(e,t){const n=JSON.stringify(t);if(_l.has(e)){const l=_l.get(e);if(l.key===n)return l.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let i;const s=this.workerNextTaskID++,a=e.byteLength,o=this._getWorker(s,a).then(l=>(i=l,new Promise((c,u)=>{i._callbacks[s]={resolve:c,reject:u},i.postMessage({type:"decode",id:s,taskConfig:t,buffer:e},[e])}))).then(l=>this._createGeometry(l.geometry));return o.catch(()=>!0).then(()=>{i&&s&&this._releaseTask(i,s)}),_l.set(e,{key:n,promise:o}),o}_createGeometry(e){const t=new It;e.index&&t.setIndex(new wt(e.index.array,1));for(let n=0;n<e.attributes.length;n++){const i=e.attributes[n],s=i.name,a=i.array,o=i.itemSize,l=new wt(a,o);s==="color"&&(this._assignVertexColorSpace(l,i.vertexColorSpace),l.normalized=!(a instanceof Float32Array)),t.setAttribute(s,l)}return t}_assignVertexColorSpace(e,t){if(t!==at)return;const n=new Ae;for(let i=0,s=e.count;i<s;i++)n.fromBufferAttribute(e,i),Xe.toWorkingColorSpace(n,at),e.setXYZ(i,n.r,n.g,n.b)}_loadLibrary(e,t){const n=new zs(this.manager);return n.setPath(this.decoderPath),n.setResponseType(t),n.setWithCredentials(this.withCredentials),new Promise((i,s)=>{n.load(e,i,void 0,s)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(n=>{const i=n[0];e||(this.decoderConfig.wasmBinary=n[1]);const s=Xy.toString(),a=["/* draco decoder */",i,"","/* worker */",s.substring(s.indexOf("{")+1,s.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([a]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const i=new Worker(this.workerSourceURL);i._callbacks={},i._taskCosts={},i._taskLoad=0,i.postMessage({type:"init",decoderConfig:this.decoderConfig}),i.onmessage=function(s){const a=s.data;switch(a.type){case"decode":i._callbacks[a.id].resolve(a);break;case"error":i._callbacks[a.id].reject(a);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+a.type+'"')}},this.workerPool.push(i)}else this.workerPool.sort(function(i,s){return i._taskLoad>s._taskLoad?-1:1});const n=this.workerPool[this.workerPool.length-1];return n._taskCosts[e]=t,n._taskLoad+=t,n})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function Xy(){let r,e;onmessage=function(a){const o=a.data;switch(o.type){case"init":r=o.decoderConfig,e=new Promise(function(u){r.onModuleLoaded=function(h){u({draco:h})},DracoDecoderModule(r)});break;case"decode":const l=o.buffer,c=o.taskConfig;e.then(u=>{const h=u.draco,d=new h.Decoder;try{const f=t(h,d,new Int8Array(l),c),p=f.attributes.map(v=>v.array.buffer);f.index&&p.push(f.index.array.buffer),self.postMessage({type:"decode",id:o.id,geometry:f},p)}catch(f){console.error(f),self.postMessage({type:"error",id:o.id,error:f.message})}finally{h.destroy(d)}});break}};function t(a,o,l,c){const u=c.attributeIDs,h=c.attributeTypes;let d,f;const p=o.GetEncodedGeometryType(l);if(p===a.TRIANGULAR_MESH)d=new a.Mesh,f=o.DecodeArrayToMesh(l,l.byteLength,d);else if(p===a.POINT_CLOUD)d=new a.PointCloud,f=o.DecodeArrayToPointCloud(l,l.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!f.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+f.error_msg());const v={index:null,attributes:[]};for(const g in u){const m=self[h[g]];let S,y;if(c.useUniqueIDs)y=u[g],S=o.GetAttributeByUniqueId(d,y);else{if(y=o.GetAttributeId(d,a[u[g]]),y===-1)continue;S=o.GetAttribute(d,y)}const x=i(a,o,d,g,m,S);g==="color"&&(x.vertexColorSpace=c.vertexColorSpace),v.attributes.push(x)}return p===a.TRIANGULAR_MESH&&(v.index=n(a,o,d)),a.destroy(d),v}function n(a,o,l){const u=l.num_faces()*3,h=u*4,d=a._malloc(h);o.GetTrianglesUInt32Array(l,h,d);const f=new Uint32Array(a.HEAPF32.buffer,d,u).slice();return a._free(d),{array:f,itemSize:1}}function i(a,o,l,c,u,h){const d=h.num_components(),p=l.num_points()*d,v=p*u.BYTES_PER_ELEMENT,g=s(a,u),m=a._malloc(v);o.GetAttributeDataArrayForAllPoints(l,h,g,v,m);const S=new u(a.HEAPF32.buffer,m,p).slice();return a._free(m),{name:c,array:S,itemSize:d}}function s(a,o){switch(o){case Float32Array:return a.DT_FLOAT32;case Int8Array:return a.DT_INT8;case Int16Array:return a.DT_INT16;case Int32Array:return a.DT_INT32;case Uint8Array:return a.DT_UINT8;case Uint16Array:return a.DT_UINT16;case Uint32Array:return a.DT_UINT32}}}function Bf(r){const e=new Map,t=new Map,n=r.clone();return kf(r,n,function(i,s){e.set(s,i),t.set(i,s)}),n.traverse(function(i){if(!i.isSkinnedMesh)return;const s=i,a=e.get(i),o=a.skeleton.bones;s.skeleton=a.skeleton.clone(),s.bindMatrix.copy(a.bindMatrix),s.skeleton.bones=o.map(function(l){return t.get(l)}),s.bind(s.skeleton,s.bindMatrix)}),n}function kf(r,e,t){t(r,e);for(let n=0;n<r.children.length;n++)kf(r.children[n],e.children[n],t)}async function jy(r,e,t){const n=f=>"/assets/"+f,i=[["grass-subtle-512-v2.jpg",0,1,0],["rock-512.jpg",100,1,0],["sand-512-color.jpg",200,1,0],["tile1-rpg-v3.png",300,0,0],["stone-path.jpg",500,1,0],["wood-floor.jpg",600,1,0],["wood-floor2.jpg",700,0,0],["dirt-512.jpg",800,0,0],["stone-interior.jpg",900,1,0],["lab-floor.jpg",900,0,0],["cliff-rpg-v3.png",0,0,0],["haunted-flagstone.jpg",0,0,1]],s=256,a=await Promise.all(i.map(([f])=>t(n("world/terrain/"+f)))),o=new Uint8Array(s*s*4*i.length);{const f=document.createElement("canvas");f.width=f.height=s;const p=f.getContext("2d",{willReadFrequently:!0});a.forEach((v,g)=>{p.clearRect(0,0,s,s),p.drawImage(v,0,0,s,s),o.set(p.getImageData(0,0,s,s).data,g*s*s*4)})}const l=new Xc(o,s,s,i.length);Object.assign(l,{colorSpace:at,wrapS:Rn,wrapT:Rn,minFilter:qn,magFilter:en,generateMipmaps:!0,anisotropy:4}),l.needsUpdate=!0;const c=f=>{const p=new Pt(f);return Object.assign(p,{colorSpace:mi,premultiplyAlpha:!1,flipY:!1,generateMipmaps:!1,minFilter:en,magFilter:en}),p.needsUpdate=!0,p},u=c(r),h=c(e),d=new Ks({color:16777215,roughness:1,metalness:0,envMapIntensity:.6});return d.onBeforeCompile=f=>{Object.assign(f.uniforms,{uDiff:{value:u},uOver:{value:h},uTex:{value:l},uSeed:{value:i.map(p=>p[1])},uRot:{value:i.map(p=>p[2])},uMir:{value:i.map(p=>p[3])},uWet:{value:d.userData.wet||0}}),d.userData.sh=f,f.vertexShader=f.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWP; varying vec3 vWN;`).replace("#include <begin_vertex>",`#include <begin_vertex>
vWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);`),f.fragmentShader=f.fragmentShader.replace("#include <common>",`#include <common>
        uniform sampler2D uDiff, uOver; uniform highp sampler2DArray uTex; uniform float uSeed[12], uRot[12], uMir[12], uWet;
        varying vec3 vWP; varying vec3 vWN;
        float gPuddle = 0.0;
        float gPit = 0.0; // 1 deep in the dark pit around an underground area (the overworld never dips below 0)
        float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5453);
          float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5453);
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
        vec3 s2l(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
        vec2 layerUV(vec2 uv, int i) {
          if (uRot[i] > 0.5) { vec2 b = floor(vWP.xz / 10.0 + uSeed[i]); float a = fract(sin(b.x * 12.9898 + b.y * 78.233) * 43758.5453) * 6.2831853;
            vec2 n = uv - 0.5; uv = vec2(n.x * cos(a) - n.y * sin(a), n.x * sin(a) + n.y * cos(a)) + 0.5; }
          if (uMir[i] > 0.5) uv = abs(fract(uv * 0.5) * 2.0 - 1.0);
          return uv;
        }
        vec3 layer(int i, vec2 uv) { return texture(uTex, vec3(layerUV(uv, i), float(i))).rgb; }
        float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
        int ovLayer(float id) { return id < 1.5 ? 1 : id < 2.5 ? 2 : id < 3.5 ? 0 : int(id) - 1; }
        float ovShape(vec4 ov, vec2 f) { // the game's part-cell cuts
          float a = floor(ov.g * 255.0 + 0.5), o = floor(ov.b * 255.0 + 0.5);
          float n = f.x, l = 1.0 - f.y, u = 1.0 - n, p = 1.0 - l, s = o - step(4.0, o) * 4.0, m = step(3.5, o);
          float c1 = step(0.5, s) * step(s, 1.5), c2 = step(1.5, s) * step(s, 2.5), c3 = step(2.5, s) * step(s, 3.5);
          float N = mix(mix(mix(n, p, c1), u, c2), l, c3), S = mix(mix(mix(l, n, c1), p, c2), u, c3);
          float T = mix(N, 1.0 - N, m), C = T + S;
          float D = 1.0;
          D = mix(D, step(C, 1.0), step(0.5, a) * step(a, 1.5)); D = mix(D, step(C, 0.5), step(1.5, a) * step(a, 2.5));
          D = mix(D, step(T, 0.5), step(2.5, a) * step(a, 3.5)); D = mix(D, step(T * 0.5 + S, 1.0), step(3.5, a) * step(a, 4.5));
          D = mix(D, step(0.5, C), step(4.5, a) * step(a, 5.5)); D = mix(D, step(1.0, T * 0.5 + S), step(5.5, a) * step(a, 6.5));
          return step(0.5, floor(ov.r * 255.0 + 0.5)) * D;
        }
        float ovAt(vec2 xz, float id) { vec4 o = texelFetch(uOver, ivec2(clamp(floor(xz), 0.0, 511.0)), 0); return abs(floor(o.r * 255.0 + 0.5) - id) < 0.5 ? ovShape(o, fract(xz)) : 0.0; }`).replace("#include <map_fragment>",`#include <map_fragment>
        {
          vec2 xz = vWP.xz; ivec2 cell = ivec2(clamp(floor(xz), 0.0, 511.0));
          vec4 dc = texelFetch(uDiff, cell, 0); float a = floor(dc.a * 255.0 + 0.5);
          vec2 duv = xz / 4.0;
          vec3 base = s2l(texture(uDiff, (xz) / 512.0).rgb);
          float isTex = step(0.5, a) * step(a, 12.5), isCol = step(254.5, a);
          float green = isCol * step(dc.r * 1.15 + 0.01, dc.g) * step(dc.b * 1.15 + 0.01, dc.g);
          float grey = isCol * step(abs(dc.r - dc.g), 0.018) * step(abs(dc.g - dc.b), 0.018) * step(0.018, dc.r) * step(dc.r, 0.45);
          float L = mix(lum(layer(2, duv)), lum(layer(0, duv)), green);
          vec3 col = base * L * 1.65;
          // pure white squares are snow (the Payasan snow patch): cool white with the sand's grain, never glaring
          vec3 bsn = texture(uDiff, xz / 512.0).rgb; float snow = isCol * smoothstep(0.78, 0.97, min(bsn.r, min(bsn.g, bsn.b)));
          col = mix(col, vec3(0.56, 0.6, 0.66) * (0.78 + 0.45 * lum(layer(2, duv * 0.5))), snow);
          int ti = int(clamp(a - 1.0, 0.0, 11.0));
          col = mix(col, layer(ti, duv), isTex);
          // steep ground becomes cliff (projected from the side so it does not stretch)
          float steepish = step(abs(vWN.y), 0.6) * clamp(green + grey + step(0.5, a) * step(a, 2.5) + step(10.5, a) * step(a, 11.5), 0.0, 1.0);
          vec3 cliffUV = vWP * 0.125;
          vec3 cl = abs(vWN.x) > abs(vWN.z) ? texture(uTex, vec3(cliffUV.zy, 10.0)).rgb : texture(uTex, vec3(cliffUV.xy, 10.0)).rgb;
          col = mix(col, mix(vec3(0.22, 0.21, 0.19), cl, 0.55) * 1.5, steepish);
          // paths, floors and other painting on top
          vec4 ov = texelFetch(uOver, cell, 0); float oid = floor(ov.r * 255.0 + 0.5);
          if (oid > 0.5) {
            float cov = ovShape(ov, fract(xz));
            float e = 0.48, nb = ovAt(xz + vec2(-e, 0.0), oid) + ovAt(xz + vec2(e, 0.0), oid) + ovAt(xz + vec2(0.0, -e), oid) + ovAt(xz + vec2(0.0, e), oid);
            float edge = 1.0 - (cov * 0.36 + nb * 0.16);
            vec3 oc = layer(ovLayer(oid), duv) * mix(1.0, 0.58, clamp(edge, 0.0, 1.0));
            col = mix(col, oc, cov);
          }
          // rain: the ground darkens; puddles gather on flat open ground and paths, and mirror the sky
          float pn = vnoise(xz * 0.35) * 0.65 + vnoise(xz * 1.3) * 0.35;
          gPuddle = uWet * smoothstep(0.62, 0.7, pn) * smoothstep(0.985, 0.998, vWN.y);
          col *= mix(1.0, 0.68, uWet);
          col = mix(col, col * 0.35 + vec3(0.02, 0.025, 0.03), gPuddle);
          gPit = smoothstep(-0.4, -5.0, vWP.y);
          diffuseColor.rgb = col * (1.0 - gPit);
        }`).replace("#include <fog_fragment>",`gl_FragColor.rgb *= 1.0 - gPit;
#include <fog_fragment>`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
 roughnessFactor = mix(roughnessFactor, 0.55, uWet * 0.6); roughnessFactor = mix(roughnessFactor, 0.04, gPuddle);`)},d}const et={minX:0,maxX:512,minZ:0,maxZ:512},Ga={...et},zf={x:361.5,z:418.5,yaw:Math.PI},Rc=[{id:"greentown",name:"Greentown",...zf},{id:"goblins",name:"Goblin War",x:353.5,z:107.5,yaw:0},{id:"apache",name:"Apache Desert",x:203.5,z:94.5,yaw:Math.PI*1.5},{id:"tutorial",name:"Tutorial Island",x:81.5,z:247.5,yaw:Math.PI}];function qy(r,e,t,n){let i=0,s=1;for(const[a,o,l]of[[r,t,.85],[e,n,1.85]]){const c=o-a;if(Math.abs(c)<1e-9){if(Math.abs(a)>l)return!1;continue}const u=(-l-a)/c,h=(l-a)/c;if(i=Math.max(i,Math.min(u,h)),s=Math.min(s,Math.max(u,h)),i>s)return!1}return!0}function Yy(r,e,t,n){const i=[[259.522946,172.698919,.999783764,.020794828],[266.084331,172.888225,.999167945,.040785011]],s=(f,p)=>f>255&&f<271&&p>170&&p<176&&i.some(([v,g,m,S])=>Math.abs((f-v)*m+(p-g)*S)<=4.1&&Math.abs((p-g)*m-(f-v)*S)<=2.4),a=new Uint8Array(512*512),o=new Uint8Array(a.length);for(let f=0;f<a.length;f++){const p=e[f*4],v=e[f*4+1],g=f%512,m=Math.floor(f/512);a[f]=p>127||r[m*513+g]<.75&&r[(m+1)*513+g+1]<.75?1:0,v&64&&v!==255&&p<128&&(o[f]=p&15)}for(const[f,p]of t.cells)o[f]|=p&15|p>>4;function l(f,p){const v=Math.max(0,Math.min(511,Math.floor(f))),g=Math.max(0,Math.min(511,Math.floor(p))),m=f-v,S=p-g,y=g*513+v;return(r[y]*(1-m)+r[y+1]*m)*(1-S)+(r[y+513]*(1-m)+r[y+514]*m)*S}const c=(f,p)=>s(f,p)?5.12:l(f,p),u=(f,p)=>{if(f<et.minX||f>=et.maxX||p<et.minZ||p>=et.maxZ)return!1;if(s(f,p))return!0;if(a[Math.floor(p)*512+Math.floor(f)])return!1;const v=l(f,p);return[[.3,0],[-.3,0],[0,.3],[0,-.3]].every(([g,m])=>Math.abs(l(f+g,p+m)-v)<.3)};function h(f,p,v){if(!Q5(f,p,v,u))return!1;const g=Math.sin(v),m=Math.cos(v),S=(y,x,P,R)=>qy((y-f)*m-(x-p)*g,(y-f)*g+(x-p)*m,(P-f)*m-(R-p)*g,(P-f)*g+(R-p)*m);for(let y=Math.floor(p-2.2);y<=Math.ceil(p+2.2);y++)for(let x=Math.floor(f-2.2);x<=Math.ceil(f+2.2);x++){const P=o[y*512+x];if(P&&(P&1&&S(x,y,x+1,y)||P&2&&S(x+1,y,x+1,y+1)||P&4&&S(x,y+1,x+1,y+1)||P&8&&S(x,y,x,y+1)))return!1}return!0}return{ground:c,pointClear:u,blocked:a,walls:o,clear:h,surfaceAt:(f,p)=>s(f,p)?"wood":(n==null?void 0:n(f,p))||"ground",isBridgeDeck:s}}const dd=["ground","grass","stone","sand","stone","stone","wood","wood","dirt","stone","stone","stone","stone"];function Ky(r){const e=r instanceof ArrayBuffer?new Uint8Array(r):r;if(!(e instanceof Uint8Array)||e.byteLength!==512*512*4)throw Error("Invalid surface data length or type");for(let t=0;t<e.length;t+=4)if(e[t]>12&&e[t]!==255||e[t+1]>12||e[t+1]&&(e[t+2]>6||e[t+3]>7))throw Error("Invalid surface material or shape at cell "+t/4);return{surfaceAt(t,n){if(!Number.isFinite(t)||!Number.isFinite(n)||t<0||n<0||t>=512||n>=512)return"ground";const i=Math.floor(t),s=Math.floor(n),a=(s*512+i)*4,o=e[a]===255?"ground":dd[e[a]],l=e[a+1];if(!l)return o;const c=e[a+2],u=e[a+3],h=t-i,d=n-s,f=u%4;let p=h,v=1-d;f===1?(p=d,v=h):f===2?(p=1-h,v=d):f===3&&(p=1-d,v=1-h);const g=u>=4?1-p:p,m=g+v;return c===1&&m>1||c===2&&m>.5||c===3&&g>.5||c===4&&g*.5+v>1||c===5&&m<.5||c===6&&g*.5+v<1?o:dd[l===1?2:l===2?3:l===3?1:l]}}}const Zy="racers/world/tiles/surfaces-ffe7cf27a1ad.bin",$y={file:Zy};function Jy(){const r=new Map,e=new Set,t=[],n=new I5,i=new C,s=new Ft(void 0,new vi({side:bn}));let a=0,o=0,l=!1;return{add(c){c.updateWorldMatrix(!0,!1),c.geometry.computeBoundingBox();for(let u=0;u<(c.isInstancedMesh?c.count:1);u++){const h=new me;c.isInstancedMesh&&c.getMatrixAt(u,h),h.premultiply(c.matrixWorld);const d=c.geometry.boundingBox.clone().applyMatrix4(h);if(d.isEmpty()||![...d.min,...d.max].every(Number.isFinite))continue;const f={geometry:c.geometry,matrix:h,box:d};for(let p=Math.floor(d.min.z/8);p<=Math.floor(d.max.z/8);p++)for(let v=Math.floor(d.min.x/8);v<=Math.floor(d.max.x/8);v++){const g=v+","+p;r.has(g)||r.set(g,[]),r.get(g).push(f)}}},resolve(c,u){a=0,o=0,l=!1,e.clear(),i.copy(u).sub(c);const h=i.length();if(!Number.isFinite(h)||h<1e-6)return!1;n.set(c,i.divideScalar(h)),n.near=0,n.far=h;let d=h;for(let f=Math.floor(Math.min(c.z,u.z)/8);f<=Math.floor(Math.max(c.z,u.z)/8);f++)for(let p=Math.floor(Math.min(c.x,u.x)/8);p<=Math.floor(Math.max(c.x,u.x)/8);p++)for(const v of r.get(p+","+f)||[])e.add(v);a=e.size;for(const f of e)if(n.ray.intersectsBox(f.box)){s.geometry=f.geometry,s.matrixWorld.copy(f.matrix),t.length=0,s.raycast(n,t),o++;for(const p of t)d=Math.min(d,p.distance)}return d>=h?!1:(u.copy(c).addScaledVector(i,Math.max(0,d-.25)),l=!0,!0)},stats:()=>({candidates:a,meshesTested:o,shortened:l})}}const Sn=r=>"/assets/"+r.split("/").map(encodeURIComponent).join("/");function Qy(r,e,t,n){for(const i of r)i.object.visible=Math.hypot(i.center.x-t.x,i.center.z-t.z)<n.distance+i.radius;for(const i of e){const s=n.roofs==="off"||t.x>=i.box.min.x-.4&&t.x<=i.box.max.x+.4&&t.z>=i.box.min.z-.4&&t.z<=i.box.max.z+.4;s!==i.hidden&&(i.hidden=s,i.object.setMatrixAt(i.index,s?new me().makeScale(0,0,0):i.matrix),i.object.instanceMatrix.needsUpdate=!0)}}async function e1(r,e){const t=new Wy().setDecoderPath("/draco/").setWorkerLimit(1),n=new cy().setDRACOLoader(t),i=new Map,s=X=>(i.has(X)||i.set(X,n.loadAsync(X).catch(Le=>{throw i.delete(X),Le})),i.get(X)),a=async X=>{const Le=await fetch(Sn(X));if(!Le.ok)throw Error("Missing "+X);return Le.json()},o=X=>new Promise((Le,Q)=>{const ye=new Image;ye.onload=()=>Le(ye),ye.onerror=()=>Q(Error("Missing "+X)),ye.src=X}),[l,c,u,h,d,f,p]=await Promise.all([fetch(Sn("world/tiles/height.bin")).then(X=>{if(!X.ok)throw Error("Missing native heightmap");return X.arrayBuffer()}),o(Sn("world/tiles/nav.png")),o(Sn("world/tiles/diffuse.png")),o(Sn("world/tiles/overlay.png")),a("racers/world/tiles/fences.json"),a("racers/placements.json"),fetch(Sn($y.file)).then(X=>{if(!X.ok)throw Error("Missing native driving surfaces");return X.arrayBuffer()})]),v=document.createElement("canvas");v.width=c.width,v.height=c.height;const g=v.getContext("2d",{willReadFrequently:!0});g.drawImage(c,0,0);const m=new Float32Array(l),S=Ky(p),y=Yy(m,g.getImageData(0,0,512,512).data,d,S.surfaceAt),x=await jy(u,h,o),P=Jy(),R=[],A=[],I=[];let T=0,_=0,M=0;for(let X=Ga.minZ;X<Ga.maxZ;X+=16)for(let Le=Ga.minX;Le<Ga.maxX;Le+=16){const Q=new qs(16,16,16,16).rotateX(-Math.PI/2),ye=Q.attributes.position;for(let _e=0;_e<ye.count;_e++){const fe=ye.getX(_e)+Le+8,ae=ye.getZ(_e)+X+8;ye.setXYZ(_e,fe,y.ground(fe,ae),ae)}Q.computeVertexNormals();const D=new Ft(Q,x);D.receiveShadow=!0,r.add(D),P.add(D),T++}const L=[];for(let X=et.minX;X<et.maxX;X++)L.push(new C(X,y.ground(X,et.minZ)+.06,et.minZ));for(let X=et.minZ;X<et.maxZ;X++)L.push(new C(et.maxX,y.ground(et.maxX,X)+.06,X));for(let X=et.maxX;X>et.minX;X--)L.push(new C(X,y.ground(X,et.maxZ)+.06,et.maxZ));for(let X=et.maxZ;X>et.minZ;X--)L.push(new C(et.minX,y.ground(et.minX,X)+.06,X));r.add(new vf(new It().setFromPoints(L),new Fs({color:14140546,transparent:!0,opacity:.65})));const U=Map.groupBy(f,X=>X.file);let N=0;for(const[X,Le]of U){const Q=await s(Sn(X));Q.scene.updateMatrixWorld(!0);let ye=!1;if(Q.scene.traverse(_e=>{_e.isSkinnedMesh&&(ye=!0)}),ye){for(const _e of Le){const fe=Bf(Q.scene);if(fe.matrixAutoUpdate=!1,fe.matrix.copy(_e.matrix?new me().fromArray(_e.matrix):new me().compose(new C(_e.x,y.ground(_e.x,_e.z),_e.z),new ht().setFromAxisAngle(new C(0,1,0),_e.yaw*Math.PI/180),new C().setScalar(_e.scale))),fe.traverse(ae=>{ae.isMesh&&(ae.frustumCulled=!1,ae.castShadow=!0)}),r.add(fe),A.push({object:fe,center:new C().setFromMatrixPosition(fe.matrix),radius:8}),M++,Q.animations.length){const ae=new Sc(fe);ae.clipAction(Q.animations[0]).play(),ae.update(0),R.push(ae)}}e(`World scenery · ${Math.round(++N/U.size*100)}%`);continue}const D=Map.groupBy(Le,_e=>{var fe,ae;return`${Math.floor((((fe=_e.matrix)==null?void 0:fe[12])??_e.x)/32)},${Math.floor((((ae=_e.matrix)==null?void 0:ae[14])??_e.z)/32)}`});for(const _e of D.values()){const fe=_e.map(ae=>ae.matrix?new me().fromArray(ae.matrix):new me().compose(new C(ae.x,y.ground(ae.x,ae.z),ae.z),new ht().setFromAxisAngle(new C(0,1,0),ae.yaw*Math.PI/180),new C().setScalar(ae.scale)));Q.scene.traverse(ae=>{if(!ae.isMesh)return;for(const Se of[].concat(ae.material))Se.transparent&&Se.map&&Se.opacity>.99&&(Se.transparent=!1,Se.alphaTest=.4,Se.depthWrite=!0);const le=new xc(ae.geometry,ae.material,_e.length);if(fe.forEach((Se,de)=>le.setMatrixAt(de,new me().multiplyMatrices(Se,ae.matrixWorld))),le.castShadow=!0,le.receiveShadow=!0,le.computeBoundingSphere(),r.add(le),P.add(le),_++,A.push({object:le,center:le.boundingSphere.center.clone(),radius:le.boundingSphere.radius}),/roof|dormer|chimney|town_entry/i.test(X+" "+ae.name)){ae.geometry.computeBoundingBox();for(let Se=0;Se<_e.length;Se++){const de=new me;le.getMatrixAt(Se,de),I.push({object:le,index:Se,matrix:de,box:ae.geometry.boundingBox.clone().applyMatrix4(de),hidden:!1})}}})}e(`World scenery · ${Math.round(++N/U.size*100)}%`)}const F=X=>(g.clearRect(0,0,512,512),g.drawImage(X,0,0,512,512),g.getImageData(0,0,512,512).data),k=F(u),W=F(h),V=[];for(const[X,Le]of[["grass1.glb",.012],["daisies.glb",.4]]){const Q=await s(Sn("world/foliage/"+X));Q.scene.updateMatrixWorld(!0),Q.scene.traverse(ye=>{if(!ye.isMesh)return;const D=[].concat(ye.material).map(fe=>{const ae=fe.clone();return ae.transparent&&ae.map&&(ae.transparent=!1,ae.alphaTest=.2,ae.depthWrite=!0),ae}),_e=new xc(ye.geometry,Array.isArray(ye.material)?D:D[0],220);_e.count=0,_e.frustumCulled=!1,_e.receiveShadow=!0,r.add(_e),V.push({mesh:_e,base:ye.matrixWorld.clone(),scale:Le,file:X})})}const K=new It,$=new Float32Array(1440);K.setAttribute("position",new wt($,3));const J=new gf(K,new Fs({color:13163760,transparent:!0,opacity:.45,depthWrite:!1}));J.frustumCulled=!1,J.visible=!1,r.add(J);let oe={distance:110,foliage:!0,roofs:"auto",rain:!1,fx:"full"},Re=null,j="",ne=0;const ue=new dt;function ee(X,Le=0){Re={x:X.x,z:X.z},Qy(A,I,X,oe);const Q=`${Math.floor(X.x/4)},${Math.floor(X.z/4)},${oe.distance},${oe.foliage}`;if(Q!==j){j=Q;const D={"grass1.glb":[],"daisies.glb":[]},_e=Math.min(40,oe.distance*.4),fe=Math.floor(X.x/4),ae=Math.floor(X.z/4);for(let le=ae-10;le<=ae+10;le++)for(let Se=fe-10;Se<=fe+10;Se++){let de=Math.imul(Se+1,374761393)+Math.imul(le+1,668265263)>>>0;de=Math.imul(de^de>>>13,1274126177)>>>0;const w=Se*4+de%400/100,b=le*4+(de>>>9)%400/100;if(w<0||w>=512||b<0||b>=512||Math.hypot(w-X.x,b-X.z)>_e||de%100>62)continue;const G=(Math.floor(b)*512+Math.floor(w))*4,ie=k[G],re=k[G+1],te=k[G+2],Pe=k[G+3];if(W[G]!==0||!(Pe===1||Pe===255&&re>ie*1.15&&re>te*1.15)||y.ground(w,b)<.8)continue;const ge=de%40===0?"daisies.glb":"grass1.glb";D[ge].push({x:w,z:b,yaw:de%628/100,distance:Math.hypot(w-X.x,b-X.z)})}for(const le of Object.values(D))le.sort((Se,de)=>Se.distance-de.distance);for(const le of V){const Se=D[le.file];le.mesh.visible=oe.foliage,le.mesh.count=Math.min(220,Se.length);for(let de=0;de<le.mesh.count;de++){const w=Se[de];ue.position.set(w.x,y.ground(w.x,w.z)+.08,w.z),ue.rotation.set(0,w.yaw,0),ue.scale.setScalar(le.scale),ue.updateMatrix(),le.mesh.setMatrixAt(de,new me().multiplyMatrices(ue.matrix,le.base))}le.mesh.instanceMatrix.needsUpdate=!0}}J.visible=oe.rain;const ye=oe.rain?1:0;if(x.userData.sh&&(x.userData.sh.uniforms.uWet.value=ye),x.userData.wet=ye,oe.rain){ne+=Math.max(0,Math.min(.1,Le));const D=y.ground(X.x,X.z);K.setDrawRange(0,(oe.fx==="reduced"?80:240)*2);for(let _e=0;_e<240;_e++){const fe=X.x+_e*17.43%36-18,ae=X.z+_e*11.73%36-18,le=D+((_e*.71-ne*15)%18+18)%18,Se=_e*6;$.set([fe,le,ae,fe+.13,le-.65,ae+.08],Se)}K.attributes.position.needsUpdate=!0}}function ve(X){oe={...oe,...X},j="",Re&&ee(Re)}return{applyGraphics:ve,updateGraphics:ee,graphicsInfo:()=>({objects:A.length,visibleObjects:A.filter(X=>X.object.visible).length,roofs:I.length,hiddenRoofs:I.filter(X=>X.hidden).length,foliage:V.reduce((X,Le)=>X+(Le.mesh.visible?Le.mesh.count:0),0),rain:J.visible}),collision:y,loadGLB:s,draco:t,cameraCollision:P,overview:u,placementCount:f.length,terrainTiles:T,propChunks:_,skinnedProps:M,propTimes:()=>R.map(X=>X.time),updateProps:X=>{for(const Le of R)Le.update(X)}}}const fd=["Head/Clothing/Iron Helmet","Chest/Clothing/Iron Chestplate","Legs/Clothing/Iron Leggings","Feet/Clothing/Iron Boots"],to={casual:{hair:"Short",shirt:8040300,pants:5132901},guard:{hair:"Shaggy",hairColor:10055519,skin:12488288,armor:{head:"Iron Helmet",chest:"Iron Chestplate",legs:"Iron Leggings",feet:"Iron Boots"}},priest:{hair:"Short",hairColor:13619151,skin:14861487,shirt:15261904,pants:3814704}},Pr=(r,e,t)=>new C(r,e,t);function Kn(r){return r.getWorldPosition(new C)}function Pc(r,e,t){const n=r.getWorldQuaternion(new ht),i=Kn(e).sub(Kn(r)).normalize(),s=t.clone().sub(Kn(r)).normalize(),a=new ht().setFromUnitVectors(i,s).multiply(n);r.quaternion.copy(r.parent.getWorldQuaternion(new ht).invert().multiply(a)),r.updateWorldMatrix(!1,!0)}function pd(r,e,t,n,i){const s=Kn(r),a=s.distanceTo(Kn(e)),o=Kn(e).distanceTo(Kn(t)),l=n.clone().sub(s),c=Math.min(l.length(),(a+o)*.995);l.normalize();const u=(a*a-o*o+c*c)/(2*c),h=Math.sqrt(Math.max(0,a*a-u*u)),d=i.clone().sub(l.clone().multiplyScalar(i.dot(l))).normalize();Pc(r,e,s.clone().addScaledVector(l,u).addScaledVector(d,h)),Pc(e,t,n)}function Vs(r,e,t="casual"){typeof t=="string"&&(t=Object.hasOwn(to,t)?to[t]:to.casual);const n=r.build({h:1.55,...t});n.mixer.stopAllAction(),e.userData.vehicleId&&e.userData.vehicleId!=="miata"&&(n.root.rotation.y=-n.yaw0),e.add(n.root),n.root.updateMatrixWorld(!0);const i=new Map;n.master.traverse(d=>{d.isBone&&i.set(d.name.replace("mixamorig_",""),d)});const s=i.get("Hips"),a=e.getObjectByName("seat_driver"),o=a?e.worldToLocal(Kn(a)):Pr(.395,.4,-.43),l=e.worldToLocal(Kn(s));n.root.position.add(o.clone().sub(l)).y+=.065,n.root.updateMatrixWorld(!0);const c=d=>e.localToWorld(d),u=i.get("Spine"),h=i.get("Neck");Pc(u,h,c(o.clone().add(Pr(0,.48,-.1))));for(const[d,f]of[["Left",1],["Right",-1]]){const p=i.get(d+"UpLeg"),v=i.get(d+"Leg"),g=i.get(d+"Foot");pd(p,v,g,c(o.clone().add(Pr(f*.09,-.29,.56))),Pr(0,.7,1));const m=i.get(d+"Arm"),S=i.get(d+"ForeArm"),y=i.get(d+"Hand"),x=e.getObjectByName("hand_wheel_"+(f===1?"L":"R"));pd(m,S,y,x?Kn(x):c(o.clone().add(Pr(f*.18,.37,.34))),Pr(f,-1,-.1))}return n.root.updateMatrixWorld(!0),n.root.traverse(d=>{d.isMesh&&(d.castShadow=!0)}),n}const Hs=[{id:"guard",name:"Guard",speed:6},{id:"priest",name:"Priest",speed:5.2}],Vf=(r,e,t)=>Math.max(e,Math.min(t,r)),t1=r=>Math.atan2(Math.sin(r),Math.cos(r));function n1(r,e,t=e.start){const n=Hs.find(o=>o.id===r);if(!n)throw Error("Unknown rival "+r);let i=0,s=1/0;e.route.forEach(([o,l],c)=>{const u=Math.hypot(t.x-o,t.z-l);u<s&&(s=u,i=c)});const a=ns();return a.started=!0,{id:r,name:n.name,car:Ro(t.x,t.z,t.yaw),race:a,course:e,routeIndex:i,direction:1,stuck:0,recovery:0}}function i1(r,e,t,n){if(r.race.finished||!Number.isFinite(e)||e<=0)return;const{car:i,course:s}=r,a=s.route,o={x:i.x,z:i.z};for(;r.routeIndex<a.length-1;){const y=a[r.routeIndex],x=a[r.routeIndex+1];if(Math.hypot(i.x-y[0],i.z-y[1])<1.25||Math.hypot(i.x-x[0],i.z-x[1])<Math.hypot(i.x-y[0],i.z-y[1]))r.routeIndex++;else break}let l=a[r.routeIndex],c=0;for(let y=r.routeIndex;y<a.length-1&&c<4;y++){const x=a[y],P=a[y+1],R=a[Math.max(0,y-1)];if((x[0]-R[0])*(P[0]-x[0])+(x[1]-R[1])*(P[1]-x[1])<0)break;l=P,c+=Math.hypot(P[0]-x[0],P[1]-x[1])}const u=l[0]-i.x,h=l[1]-i.z,d=Math.hypot(u,h),f=t1(Math.atan2(u,h)-i.yaw);Math.cos(f)<-.75?r.direction=-1:Math.cos(f)>.75&&(r.direction=1);let p=Vf(-Math.atan2(4.9*Math.sin(f),Math.max(1,d))*(1+Math.abs(i.speed)*.055)/.5,-1,1);const v=Hs.find(y=>y.id===r.id),g=r.direction*Math.min(v.speed,Math.abs(Math.sin(f))>.3?2.8:v.speed);r.stuck>.75&&r.recovery<=0&&(r.recovery=1.7,r.recoveryDirection=-r.direction,r.recoveryCount=(r.recoveryCount||0)+1,r.recoverySteer=[0,1,-1][(r.recoveryCount-1)%3],r.stuck=0);let m=g;r.recovery>0&&(r.recovery-=e,m=r.recovery>1.2?0:r.recoveryDirection*2,p=r.recoverySteer);const S={steer:p,throttle:i.speed<m-.15?1:0,brake:i.speed>m+.15?1:0};ea(i,S,e,t,n),r.stuck=Math.hypot(i.x-o.x,i.z-o.z)<.001?r.stuck+e:0,Po(r.race,o,i,e,s.gates)}const yl=new WeakMap;function r1(r,e,t){if(!yl.has(t)){const l=ns(),c=[0];for(let u=1;u<t.route.length;u++){const h=t.route[u-1],d=t.route[u],f=l.next;Po(l,{x:h[0],z:h[1]},{x:d[0],z:d[1]},1,t.gates),l.next!==f&&c.push(u)}yl.set(t,c)}const n=yl.get(t),i=n[e.next]??0,s=n[e.next+1]??t.route.length-1;let a=1/0,o=i;for(let l=i;l<s;l++){const c=t.route[l],u=t.route[l+1],h=u[0]-c[0],d=u[1]-c[1],f=Vf(((r.x-c[0])*h+(r.z-c[1])*d)/(h*h+d*d||1),0,1),p=Math.hypot(r.x-c[0]-h*f,r.z-c[1]-d*f);p<a&&(a=p,o=l+f)}return o}function du(r,e,t,n){const i=[{id:"you",name:"You",car:r,race:e},...t].map(s=>({...s,progress:r1(s.car,s.race,n)}));return i.sort((s,a)=>Number(a.race.finished)-Number(s.race.finished)||(s.race.finished?s.race.time-a.race.time:a.race.next-s.race.next||a.progress-s.progress)),i.map((s,a)=>({id:s.id,name:s.name,place:a+1,finished:s.race.finished,time:s.race.finished?s.race.time:null}))}function s1(r){const e=Hs.map(t=>{const n=t.id==="guard"?10:5,[i,s]=r.route[n],[a,o]=r.route[n+1];return n1(t.id,r,{x:i,z:s,yaw:Math.atan2(a-i,o-s)})});return{course:r,countdown:3,player:Ro(r.start.x,r.start.z,r.start.yaw),race:ns(),opponents:e}}function a1(r,e,t,n,i){if(r.race.finished||!Number.isFinite(t)||t<=0)return;const s=Math.max(0,t-r.countdown);if(r.countdown=Math.max(0,r.countdown-t),r.countdown<1e-8&&(r.countdown=0),s<1e-8)return;r.race.started=!0;const a={x:r.player.x,z:r.player.z};ea(r.player,e,s,n,i),Po(r.race,a,r.player,s,r.course.gates);for(const o of r.opponents)i1(o,s,n,i)}const o1="World Circuit",l1={x:349.5,z:313.5,yaw:0},c1=[{x:354.5,z:259.5,nx:0,nz:1,width:7},{x:352.5,z:207.5,nx:0,nz:-1,width:7},{x:354.5,z:110.5,nx:0,nz:-1,width:7},{x:300.5,z:82.5,nx:0,nz:-1,width:7},{x:352.5,z:218.5,nx:0,nz:1,width:7},{x:220.5,z:292.5,nx:0,nz:-1,width:7},{x:160.5,z:338.5,nx:0,nz:1,width:7},{x:300.5,z:468.5,nx:0,nz:1,width:7},{x:361.5,z:416.5,nx:0,nz:1,width:7},{x:349.5,z:313.5,nx:0,nz:-1,width:7}],u1=JSON.parse("[[349.5,313.5],[349.5,314.5],[348.5,314.5],[348.5,315.5],[348.5,316.5],[348.5,317.5],[348.5,318.5],[348.5,319.5],[348.5,320.5],[347.5,320.5],[347.5,321.5],[346.5,321.5],[345.5,321.5],[344.5,321.5],[343.5,321.5],[342.5,321.5],[341.5,321.5],[341.5,322.5],[341.5,323.5],[341.5,324.5],[341.5,325.5],[341.5,326.5],[341.5,327.5],[341.5,328.5],[341.5,329.5],[341.5,330.5],[341.5,331.5],[341.5,332.5],[341.5,333.5],[341.5,334.5],[341.5,335.5],[341.5,336.5],[341.5,337.5],[341.5,338.5],[341.5,339.5],[341.5,340.5],[341.5,341.5],[341.5,342.5],[340.5,342.5],[340.5,343.5],[339.5,343.5],[339.5,344.5],[338.5,344.5],[337.5,344.5],[336.5,344.5],[335.5,344.5],[334.5,344.5],[334.5,345.5],[334.5,346.5],[334.5,347.5],[334.5,348.5],[334.5,349.5],[334.5,350.5],[334.5,351.5],[334.5,352.5],[334.5,353.5],[334.5,354.5],[334.5,355.5],[334.5,356.5],[334.5,357.5],[334.5,358.5],[334.5,359.5],[334.5,360.5],[334.5,361.5],[334.5,362.5],[334.5,363.5],[334.5,364.5],[334.5,365.5],[334.5,366.5],[334.5,367.5],[334.5,368.5],[333.5,368.5],[333.5,369.5],[332.5,369.5],[332.5,370.5],[331.5,370.5],[330.5,370.5],[329.5,370.5],[328.5,370.5],[327.5,370.5],[326.5,370.5],[325.5,370.5],[324.5,370.5],[323.5,370.5],[322.5,370.5],[321.5,370.5],[320.5,370.5],[319.5,370.5],[318.5,370.5],[317.5,370.5],[316.5,370.5],[315.5,370.5],[315.5,371.5],[315.5,372.5],[315.5,373.5],[315.5,374.5],[315.5,375.5],[315.5,376.5],[315.5,377.5],[315.5,378.5],[315.5,379.5],[315.5,380.5],[315.5,381.5],[315.5,382.5],[315.5,383.5],[315.5,384.5],[315.5,385.5],[315.5,386.5],[315.5,387.5],[315.5,388.5],[315.5,389.5],[315.5,390.5],[315.5,391.5],[315.5,392.5],[315.5,393.5],[315.5,394.5],[315.5,395.5],[315.5,396.5],[314.5,396.5],[314.5,397.5],[314.5,398.5],[313.5,398.5],[313.5,399.5],[312.5,399.5],[312.5,400.5],[311.5,400.5],[310.5,400.5],[310.5,399.5],[309.5,399.5],[308.5,399.5],[308.5,398.5],[307.5,398.5],[307.5,397.5],[306.5,397.5],[306.5,396.5],[305.5,396.5],[305.5,395.5],[304.5,395.5],[304.5,394.5],[303.5,394.5],[303.5,393.5],[302.5,393.5],[301.5,393.5],[301.5,392.5],[300.5,392.5],[300.5,391.5],[300.5,390.5],[300.5,389.5],[300.5,388.5],[300.5,387.5],[299.5,387.5],[299.5,386.5],[299.5,385.5],[298.5,385.5],[298.5,384.5],[297.5,384.5],[297.5,383.5],[297.5,382.5],[297.5,381.5],[296.5,381.5],[296.5,380.5],[296.5,379.5],[296.5,378.5],[295.5,378.5],[295.5,377.5],[295.5,376.5],[294.5,376.5],[294.5,375.5],[294.5,374.5],[294.5,373.5],[294.5,372.5],[293.5,372.5],[293.5,371.5],[292.5,371.5],[292.5,370.5],[292.5,369.5],[292.5,368.5],[292.5,367.5],[292.5,366.5],[292.5,365.5],[292.5,364.5],[292.5,363.5],[292.5,362.5],[292.5,361.5],[292.5,360.5],[292.5,359.5],[292.5,358.5],[292.5,357.5],[292.5,356.5],[292.5,355.5],[292.5,354.5],[292.5,353.5],[292.5,352.5],[292.5,351.5],[292.5,350.5],[292.5,349.5],[292.5,348.5],[292.5,347.5],[292.5,346.5],[293.5,346.5],[293.5,345.5],[293.5,344.5],[293.5,343.5],[293.5,342.5],[293.5,341.5],[293.5,340.5],[293.5,339.5],[293.5,338.5],[293.5,337.5],[293.5,336.5],[293.5,335.5],[293.5,334.5],[293.5,333.5],[293.5,332.5],[293.5,331.5],[293.5,330.5],[293.5,329.5],[293.5,328.5],[293.5,327.5],[293.5,326.5],[293.5,325.5],[293.5,324.5],[293.5,323.5],[293.5,322.5],[293.5,321.5],[294.5,321.5],[294.5,320.5],[294.5,319.5],[294.5,318.5],[294.5,317.5],[295.5,317.5],[295.5,316.5],[296.5,316.5],[296.5,315.5],[297.5,315.5],[297.5,314.5],[297.5,313.5],[297.5,312.5],[297.5,311.5],[297.5,310.5],[297.5,309.5],[297.5,308.5],[297.5,307.5],[297.5,306.5],[297.5,305.5],[297.5,304.5],[297.5,303.5],[297.5,302.5],[297.5,301.5],[297.5,300.5],[297.5,299.5],[297.5,298.5],[297.5,297.5],[297.5,296.5],[297.5,295.5],[297.5,294.5],[297.5,293.5],[297.5,292.5],[297.5,291.5],[297.5,290.5],[297.5,289.5],[297.5,288.5],[297.5,287.5],[297.5,286.5],[297.5,285.5],[297.5,284.5],[297.5,283.5],[297.5,282.5],[297.5,281.5],[297.5,280.5],[297.5,279.5],[297.5,278.5],[297.5,277.5],[297.5,276.5],[297.5,275.5],[297.5,274.5],[297.5,273.5],[297.5,272.5],[297.5,271.5],[297.5,270.5],[297.5,269.5],[297.5,268.5],[297.5,267.5],[297.5,266.5],[297.5,265.5],[297.5,264.5],[297.5,263.5],[297.5,262.5],[297.5,261.5],[297.5,260.5],[297.5,259.5],[297.5,258.5],[297.5,257.5],[297.5,256.5],[297.5,255.5],[297.5,254.5],[297.5,253.5],[297.5,252.5],[297.5,251.5],[297.5,250.5],[297.5,249.5],[297.5,248.5],[297.5,247.5],[297.5,246.5],[297.5,245.5],[297.5,244.5],[297.5,243.5],[297.5,242.5],[297.5,241.5],[297.5,240.5],[297.5,239.5],[297.5,238.5],[297.5,237.5],[297.5,236.5],[297.5,235.5],[297.5,234.5],[297.5,233.5],[297.5,232.5],[297.5,231.5],[297.5,230.5],[297.5,229.5],[297.5,228.5],[297.5,227.5],[297.5,226.5],[297.5,225.5],[297.5,224.5],[297.5,223.5],[297.5,222.5],[297.5,221.5],[297.5,220.5],[297.5,219.5],[297.5,218.5],[297.5,217.5],[297.5,216.5],[297.5,215.5],[297.5,214.5],[297.5,213.5],[297.5,212.5],[297.5,211.5],[297.5,210.5],[297.5,209.5],[297.5,208.5],[297.5,207.5],[297.5,206.5],[297.5,205.5],[297.5,204.5],[298.5,204.5],[298.5,203.5],[299.5,203.5],[300.5,203.5],[300.5,202.5],[300.5,201.5],[300.5,200.5],[300.5,199.5],[300.5,198.5],[300.5,197.5],[300.5,196.5],[300.5,195.5],[300.5,194.5],[300.5,193.5],[300.5,192.5],[300.5,191.5],[301.5,191.5],[301.5,190.5],[302.5,190.5],[302.5,189.5],[303.5,189.5],[304.5,189.5],[305.5,189.5],[306.5,189.5],[307.5,189.5],[308.5,189.5],[309.5,189.5],[310.5,189.5],[311.5,189.5],[312.5,189.5],[313.5,189.5],[314.5,189.5],[315.5,189.5],[316.5,189.5],[317.5,189.5],[318.5,189.5],[319.5,189.5],[320.5,189.5],[321.5,189.5],[322.5,189.5],[323.5,189.5],[324.5,189.5],[325.5,189.5],[326.5,189.5],[326.5,190.5],[326.5,191.5],[326.5,192.5],[326.5,193.5],[326.5,194.5],[326.5,195.5],[326.5,196.5],[326.5,197.5],[326.5,198.5],[326.5,199.5],[326.5,200.5],[326.5,201.5],[326.5,202.5],[326.5,203.5],[326.5,204.5],[326.5,205.5],[326.5,206.5],[326.5,207.5],[326.5,208.5],[326.5,209.5],[326.5,210.5],[326.5,211.5],[326.5,212.5],[326.5,213.5],[326.5,214.5],[326.5,215.5],[326.5,216.5],[326.5,217.5],[326.5,218.5],[326.5,219.5],[326.5,220.5],[326.5,221.5],[326.5,222.5],[326.5,223.5],[327.5,223.5],[327.5,224.5],[327.5,225.5],[327.5,226.5],[327.5,227.5],[327.5,228.5],[328.5,228.5],[328.5,229.5],[329.5,229.5],[329.5,230.5],[330.5,230.5],[331.5,230.5],[332.5,230.5],[333.5,230.5],[334.5,230.5],[335.5,230.5],[336.5,230.5],[337.5,230.5],[338.5,230.5],[339.5,230.5],[340.5,230.5],[341.5,230.5],[342.5,230.5],[343.5,230.5],[344.5,230.5],[345.5,230.5],[346.5,230.5],[347.5,230.5],[348.5,230.5],[349.5,230.5],[350.5,230.5],[351.5,230.5],[351.5,231.5],[351.5,232.5],[351.5,233.5],[351.5,234.5],[351.5,235.5],[351.5,236.5],[351.5,237.5],[351.5,238.5],[351.5,239.5],[351.5,240.5],[351.5,241.5],[351.5,242.5],[351.5,243.5],[351.5,244.5],[351.5,245.5],[351.5,246.5],[351.5,247.5],[351.5,248.5],[352.5,248.5],[352.5,249.5],[352.5,250.5],[353.5,250.5],[353.5,251.5],[353.5,252.5],[354.5,252.5],[354.5,253.5],[354.5,254.5],[354.5,255.5],[354.5,256.5],[354.5,257.5],[354.5,258.5],[354.5,259.5],[354.5,260.5],[354.5,261.5],[354.5,260.5],[353.5,260.5],[353.5,259.5],[353.5,258.5],[352.5,258.5],[352.5,257.5],[351.5,257.5],[351.5,256.5],[351.5,255.5],[350.5,255.5],[350.5,254.5],[350.5,253.5],[349.5,253.5],[349.5,252.5],[349.5,251.5],[348.5,251.5],[348.5,250.5],[348.5,249.5],[348.5,248.5],[348.5,247.5],[348.5,246.5],[348.5,245.5],[348.5,244.5],[348.5,243.5],[348.5,242.5],[348.5,241.5],[348.5,240.5],[348.5,239.5],[348.5,238.5],[348.5,237.5],[348.5,236.5],[348.5,235.5],[348.5,234.5],[348.5,233.5],[349.5,233.5],[350.5,233.5],[351.5,233.5],[352.5,233.5],[353.5,233.5],[354.5,233.5],[354.5,232.5],[354.5,231.5],[354.5,230.5],[354.5,229.5],[354.5,228.5],[354.5,227.5],[353.5,227.5],[353.5,226.5],[353.5,225.5],[353.5,224.5],[353.5,223.5],[353.5,222.5],[353.5,221.5],[353.5,220.5],[352.5,220.5],[352.5,219.5],[352.5,218.5],[352.5,217.5],[352.5,216.5],[352.5,215.5],[352.5,214.5],[352.5,213.5],[352.5,212.5],[352.5,211.5],[352.5,210.5],[352.5,209.5],[352.5,208.5],[352.5,207.5],[352.5,206.5],[352.5,205.5],[352.5,204.5],[352.5,203.5],[352.5,202.5],[351.5,202.5],[351.5,201.5],[350.5,201.5],[350.5,200.5],[349.5,200.5],[349.5,199.5],[348.5,199.5],[348.5,198.5],[347.5,198.5],[347.5,197.5],[347.5,196.5],[347.5,195.5],[347.5,194.5],[346.5,194.5],[345.5,194.5],[345.5,193.5],[344.5,193.5],[344.5,192.5],[344.5,191.5],[344.5,190.5],[344.5,189.5],[344.5,188.5],[344.5,187.5],[344.5,186.5],[344.5,185.5],[345.5,185.5],[345.5,184.5],[346.5,184.5],[346.5,183.5],[347.5,183.5],[347.5,182.5],[347.5,181.5],[348.5,181.5],[348.5,180.5],[349.5,180.5],[349.5,179.5],[350.5,179.5],[350.5,178.5],[350.5,177.5],[351.5,177.5],[351.5,176.5],[351.5,175.5],[351.5,174.5],[351.5,173.5],[352.5,173.5],[352.5,172.5],[352.5,171.5],[353.5,171.5],[353.5,170.5],[354.5,170.5],[354.5,169.5],[354.5,168.5],[354.5,167.5],[354.5,166.5],[354.5,165.5],[354.5,164.5],[354.5,163.5],[354.5,162.5],[354.5,161.5],[354.5,160.5],[354.5,159.5],[354.5,158.5],[354.5,157.5],[354.5,156.5],[354.5,155.5],[354.5,154.5],[354.5,153.5],[354.5,152.5],[354.5,151.5],[354.5,150.5],[354.5,149.5],[354.5,148.5],[354.5,147.5],[354.5,146.5],[354.5,145.5],[354.5,144.5],[354.5,143.5],[354.5,142.5],[354.5,141.5],[354.5,140.5],[354.5,139.5],[354.5,138.5],[354.5,137.5],[354.5,136.5],[354.5,135.5],[354.5,134.5],[354.5,133.5],[354.5,132.5],[354.5,131.5],[354.5,130.5],[354.5,129.5],[354.5,128.5],[354.5,127.5],[354.5,126.5],[354.5,125.5],[354.5,124.5],[354.5,123.5],[354.5,122.5],[354.5,121.5],[354.5,120.5],[354.5,119.5],[354.5,118.5],[354.5,117.5],[354.5,116.5],[354.5,115.5],[354.5,114.5],[354.5,113.5],[354.5,112.5],[354.5,111.5],[354.5,110.5],[354.5,109.5],[354.5,108.5],[354.5,107.5],[354.5,106.5],[354.5,105.5],[354.5,104.5],[354.5,103.5],[354.5,102.5],[354.5,101.5],[354.5,100.5],[353.5,100.5],[353.5,99.5],[352.5,99.5],[352.5,98.5],[351.5,98.5],[351.5,97.5],[350.5,97.5],[350.5,96.5],[349.5,96.5],[348.5,96.5],[347.5,96.5],[346.5,96.5],[345.5,96.5],[344.5,96.5],[343.5,96.5],[342.5,96.5],[341.5,96.5],[340.5,96.5],[339.5,96.5],[338.5,96.5],[337.5,96.5],[336.5,96.5],[335.5,96.5],[334.5,96.5],[333.5,96.5],[332.5,96.5],[331.5,96.5],[330.5,96.5],[329.5,96.5],[328.5,96.5],[327.5,96.5],[326.5,96.5],[325.5,96.5],[324.5,96.5],[323.5,96.5],[322.5,96.5],[321.5,96.5],[320.5,96.5],[319.5,96.5],[318.5,96.5],[317.5,96.5],[316.5,96.5],[315.5,96.5],[314.5,96.5],[313.5,96.5],[312.5,96.5],[311.5,96.5],[310.5,96.5],[309.5,96.5],[308.5,96.5],[307.5,96.5],[306.5,96.5],[305.5,96.5],[304.5,96.5],[303.5,96.5],[302.5,96.5],[301.5,96.5],[300.5,96.5],[300.5,95.5],[300.5,94.5],[300.5,93.5],[300.5,92.5],[300.5,91.5],[300.5,90.5],[300.5,89.5],[300.5,88.5],[300.5,87.5],[300.5,86.5],[300.5,85.5],[300.5,84.5],[300.5,83.5],[300.5,82.5],[300.5,81.5],[300.5,80.5],[299.5,80.5],[298.5,80.5],[297.5,80.5],[297.5,81.5],[297.5,82.5],[297.5,83.5],[297.5,84.5],[297.5,85.5],[297.5,86.5],[297.5,87.5],[297.5,88.5],[297.5,89.5],[297.5,90.5],[297.5,91.5],[297.5,92.5],[297.5,93.5],[297.5,94.5],[297.5,95.5],[297.5,96.5],[297.5,97.5],[297.5,98.5],[297.5,99.5],[298.5,99.5],[299.5,99.5],[300.5,99.5],[301.5,99.5],[302.5,99.5],[303.5,99.5],[304.5,99.5],[305.5,99.5],[306.5,99.5],[307.5,99.5],[308.5,99.5],[309.5,99.5],[310.5,99.5],[311.5,99.5],[312.5,99.5],[313.5,99.5],[314.5,99.5],[315.5,99.5],[316.5,99.5],[317.5,99.5],[318.5,99.5],[319.5,99.5],[320.5,99.5],[321.5,99.5],[322.5,99.5],[323.5,99.5],[324.5,99.5],[325.5,99.5],[326.5,99.5],[327.5,99.5],[328.5,99.5],[329.5,99.5],[330.5,99.5],[331.5,99.5],[332.5,99.5],[333.5,99.5],[334.5,99.5],[335.5,99.5],[336.5,99.5],[337.5,99.5],[338.5,99.5],[339.5,99.5],[339.5,100.5],[339.5,101.5],[339.5,102.5],[339.5,103.5],[339.5,104.5],[339.5,105.5],[339.5,106.5],[340.5,106.5],[340.5,107.5],[341.5,107.5],[341.5,108.5],[341.5,109.5],[341.5,110.5],[341.5,111.5],[341.5,112.5],[341.5,113.5],[341.5,114.5],[341.5,115.5],[341.5,116.5],[341.5,117.5],[341.5,118.5],[341.5,119.5],[341.5,120.5],[341.5,121.5],[341.5,122.5],[341.5,123.5],[341.5,124.5],[341.5,125.5],[341.5,126.5],[341.5,127.5],[341.5,128.5],[341.5,129.5],[341.5,130.5],[341.5,131.5],[341.5,132.5],[341.5,133.5],[341.5,134.5],[341.5,135.5],[341.5,136.5],[341.5,137.5],[341.5,138.5],[341.5,139.5],[341.5,140.5],[341.5,141.5],[341.5,142.5],[341.5,143.5],[341.5,144.5],[341.5,145.5],[341.5,146.5],[341.5,147.5],[341.5,148.5],[341.5,149.5],[341.5,150.5],[341.5,151.5],[341.5,152.5],[341.5,153.5],[341.5,154.5],[341.5,155.5],[341.5,156.5],[341.5,157.5],[341.5,158.5],[341.5,159.5],[341.5,160.5],[341.5,161.5],[341.5,162.5],[341.5,163.5],[341.5,164.5],[341.5,165.5],[341.5,166.5],[341.5,167.5],[341.5,168.5],[341.5,169.5],[341.5,170.5],[341.5,171.5],[341.5,172.5],[341.5,173.5],[341.5,174.5],[341.5,175.5],[341.5,176.5],[341.5,177.5],[341.5,178.5],[341.5,179.5],[341.5,180.5],[341.5,181.5],[341.5,182.5],[341.5,183.5],[341.5,184.5],[341.5,185.5],[341.5,186.5],[341.5,187.5],[341.5,188.5],[341.5,189.5],[341.5,190.5],[341.5,191.5],[341.5,192.5],[341.5,193.5],[341.5,194.5],[341.5,195.5],[341.5,196.5],[342.5,196.5],[342.5,197.5],[343.5,197.5],[344.5,197.5],[344.5,198.5],[344.5,199.5],[344.5,200.5],[344.5,201.5],[345.5,201.5],[345.5,202.5],[346.5,202.5],[346.5,203.5],[347.5,203.5],[347.5,204.5],[348.5,204.5],[348.5,205.5],[349.5,205.5],[349.5,206.5],[349.5,207.5],[349.5,208.5],[349.5,209.5],[349.5,210.5],[349.5,211.5],[349.5,212.5],[349.5,213.5],[350.5,213.5],[351.5,213.5],[351.5,214.5],[351.5,215.5],[352.5,215.5],[352.5,216.5],[352.5,217.5],[352.5,218.5],[351.5,218.5],[351.5,219.5],[352.5,219.5],[353.5,219.5],[354.5,219.5],[355.5,219.5],[356.5,219.5],[356.5,218.5],[356.5,217.5],[355.5,217.5],[355.5,216.5],[355.5,215.5],[355.5,214.5],[355.5,213.5],[355.5,212.5],[355.5,211.5],[355.5,210.5],[354.5,210.5],[353.5,210.5],[352.5,210.5],[351.5,210.5],[350.5,210.5],[349.5,210.5],[348.5,210.5],[347.5,210.5],[346.5,210.5],[346.5,209.5],[345.5,209.5],[344.5,209.5],[343.5,209.5],[342.5,209.5],[341.5,209.5],[341.5,208.5],[340.5,208.5],[339.5,208.5],[338.5,208.5],[337.5,208.5],[336.5,208.5],[335.5,208.5],[334.5,208.5],[333.5,208.5],[332.5,208.5],[331.5,208.5],[330.5,208.5],[329.5,208.5],[329.5,207.5],[329.5,206.5],[329.5,205.5],[329.5,204.5],[329.5,203.5],[329.5,202.5],[329.5,201.5],[329.5,200.5],[329.5,199.5],[329.5,198.5],[329.5,197.5],[329.5,196.5],[329.5,195.5],[329.5,194.5],[329.5,193.5],[329.5,192.5],[329.5,191.5],[329.5,190.5],[329.5,189.5],[329.5,188.5],[329.5,187.5],[329.5,186.5],[328.5,186.5],[327.5,186.5],[326.5,186.5],[325.5,186.5],[324.5,186.5],[323.5,186.5],[322.5,186.5],[321.5,186.5],[320.5,186.5],[319.5,186.5],[318.5,186.5],[317.5,186.5],[316.5,186.5],[315.5,186.5],[314.5,186.5],[313.5,186.5],[312.5,186.5],[311.5,186.5],[310.5,186.5],[309.5,186.5],[308.5,186.5],[307.5,186.5],[306.5,186.5],[305.5,186.5],[304.5,186.5],[303.5,186.5],[302.5,186.5],[301.5,186.5],[300.5,186.5],[299.5,186.5],[298.5,186.5],[297.5,186.5],[296.5,186.5],[295.5,186.5],[294.5,186.5],[293.5,186.5],[292.5,186.5],[291.5,186.5],[290.5,186.5],[289.5,186.5],[288.5,186.5],[287.5,186.5],[286.5,186.5],[285.5,186.5],[284.5,186.5],[283.5,186.5],[282.5,186.5],[281.5,186.5],[280.5,186.5],[279.5,186.5],[278.5,186.5],[277.5,186.5],[276.5,186.5],[276.5,187.5],[276.5,188.5],[276.5,189.5],[276.5,190.5],[276.5,191.5],[275.5,191.5],[275.5,192.5],[275.5,193.5],[275.5,194.5],[275.5,195.5],[275.5,196.5],[275.5,197.5],[275.5,198.5],[275.5,199.5],[274.5,199.5],[274.5,200.5],[273.5,200.5],[273.5,201.5],[272.5,201.5],[271.5,201.5],[270.5,201.5],[269.5,201.5],[268.5,201.5],[268.5,202.5],[268.5,203.5],[268.5,204.5],[268.5,205.5],[268.5,206.5],[268.5,207.5],[267.5,207.5],[267.5,208.5],[266.5,208.5],[265.5,208.5],[264.5,208.5],[264.5,209.5],[263.5,209.5],[262.5,209.5],[262.5,210.5],[261.5,210.5],[260.5,210.5],[260.5,211.5],[259.5,211.5],[259.5,212.5],[259.5,213.5],[259.5,214.5],[259.5,215.5],[259.5,216.5],[259.5,217.5],[259.5,218.5],[259.5,219.5],[259.5,220.5],[259.5,221.5],[259.5,222.5],[259.5,223.5],[259.5,224.5],[259.5,225.5],[259.5,226.5],[259.5,227.5],[259.5,228.5],[259.5,229.5],[259.5,230.5],[259.5,231.5],[259.5,232.5],[259.5,233.5],[259.5,234.5],[259.5,235.5],[259.5,236.5],[259.5,237.5],[259.5,238.5],[259.5,239.5],[259.5,240.5],[259.5,241.5],[259.5,242.5],[259.5,243.5],[259.5,244.5],[259.5,245.5],[259.5,246.5],[259.5,247.5],[259.5,248.5],[259.5,249.5],[259.5,250.5],[259.5,251.5],[259.5,252.5],[259.5,253.5],[259.5,254.5],[259.5,255.5],[259.5,256.5],[259.5,257.5],[259.5,258.5],[259.5,259.5],[259.5,260.5],[259.5,261.5],[259.5,262.5],[259.5,263.5],[259.5,264.5],[259.5,265.5],[259.5,266.5],[259.5,267.5],[259.5,268.5],[259.5,269.5],[259.5,270.5],[258.5,270.5],[258.5,271.5],[257.5,271.5],[257.5,272.5],[257.5,273.5],[257.5,274.5],[257.5,275.5],[257.5,276.5],[257.5,277.5],[257.5,278.5],[257.5,279.5],[257.5,280.5],[257.5,281.5],[257.5,282.5],[257.5,283.5],[257.5,284.5],[257.5,285.5],[256.5,285.5],[256.5,286.5],[256.5,287.5],[256.5,288.5],[256.5,289.5],[256.5,290.5],[256.5,291.5],[255.5,291.5],[255.5,292.5],[255.5,293.5],[254.5,293.5],[254.5,294.5],[254.5,295.5],[253.5,295.5],[253.5,296.5],[253.5,297.5],[252.5,297.5],[252.5,298.5],[252.5,299.5],[252.5,300.5],[251.5,300.5],[251.5,301.5],[251.5,302.5],[250.5,302.5],[250.5,303.5],[250.5,304.5],[249.5,304.5],[249.5,305.5],[248.5,305.5],[248.5,306.5],[247.5,306.5],[247.5,307.5],[247.5,308.5],[247.5,309.5],[247.5,310.5],[247.5,311.5],[247.5,312.5],[247.5,313.5],[247.5,314.5],[247.5,315.5],[247.5,316.5],[247.5,317.5],[247.5,318.5],[247.5,319.5],[247.5,320.5],[247.5,321.5],[247.5,322.5],[247.5,323.5],[247.5,324.5],[246.5,324.5],[246.5,325.5],[245.5,325.5],[244.5,325.5],[244.5,326.5],[243.5,326.5],[242.5,326.5],[242.5,327.5],[241.5,327.5],[241.5,328.5],[240.5,328.5],[239.5,328.5],[238.5,328.5],[237.5,328.5],[236.5,328.5],[235.5,328.5],[234.5,328.5],[233.5,328.5],[232.5,328.5],[231.5,328.5],[230.5,328.5],[229.5,328.5],[228.5,328.5],[227.5,328.5],[226.5,328.5],[225.5,328.5],[224.5,328.5],[223.5,328.5],[222.5,328.5],[221.5,328.5],[220.5,328.5],[220.5,327.5],[220.5,326.5],[220.5,325.5],[220.5,324.5],[220.5,323.5],[220.5,322.5],[220.5,321.5],[220.5,320.5],[220.5,319.5],[220.5,318.5],[220.5,317.5],[220.5,316.5],[220.5,315.5],[220.5,314.5],[220.5,313.5],[220.5,312.5],[220.5,311.5],[220.5,310.5],[220.5,309.5],[220.5,308.5],[220.5,307.5],[220.5,306.5],[220.5,305.5],[220.5,304.5],[220.5,303.5],[220.5,302.5],[220.5,301.5],[220.5,300.5],[220.5,299.5],[220.5,298.5],[220.5,297.5],[220.5,296.5],[220.5,295.5],[220.5,294.5],[220.5,293.5],[220.5,292.5],[220.5,291.5],[220.5,290.5],[219.5,290.5],[218.5,290.5],[217.5,290.5],[216.5,290.5],[215.5,290.5],[214.5,290.5],[213.5,290.5],[212.5,290.5],[211.5,290.5],[210.5,290.5],[209.5,290.5],[209.5,291.5],[209.5,292.5],[209.5,293.5],[208.5,293.5],[208.5,294.5],[207.5,294.5],[206.5,294.5],[205.5,294.5],[204.5,294.5],[203.5,294.5],[202.5,294.5],[201.5,294.5],[200.5,294.5],[199.5,294.5],[198.5,294.5],[197.5,294.5],[196.5,294.5],[195.5,294.5],[194.5,294.5],[193.5,294.5],[192.5,294.5],[191.5,294.5],[190.5,294.5],[189.5,294.5],[188.5,294.5],[187.5,294.5],[186.5,294.5],[185.5,294.5],[184.5,294.5],[183.5,294.5],[182.5,294.5],[181.5,294.5],[180.5,294.5],[180.5,295.5],[180.5,296.5],[180.5,297.5],[180.5,298.5],[180.5,299.5],[180.5,300.5],[180.5,301.5],[180.5,302.5],[180.5,303.5],[179.5,303.5],[179.5,304.5],[178.5,304.5],[177.5,304.5],[176.5,304.5],[175.5,304.5],[175.5,305.5],[175.5,306.5],[175.5,307.5],[175.5,308.5],[174.5,308.5],[174.5,309.5],[173.5,309.5],[172.5,309.5],[171.5,309.5],[170.5,309.5],[169.5,309.5],[168.5,309.5],[167.5,309.5],[166.5,309.5],[165.5,309.5],[164.5,309.5],[163.5,309.5],[162.5,309.5],[161.5,309.5],[160.5,309.5],[160.5,310.5],[160.5,311.5],[160.5,312.5],[160.5,313.5],[160.5,314.5],[160.5,315.5],[160.5,316.5],[160.5,317.5],[160.5,318.5],[160.5,319.5],[160.5,320.5],[160.5,321.5],[160.5,322.5],[160.5,323.5],[160.5,324.5],[160.5,325.5],[160.5,326.5],[160.5,327.5],[160.5,328.5],[160.5,329.5],[160.5,330.5],[160.5,331.5],[160.5,332.5],[160.5,333.5],[160.5,334.5],[160.5,335.5],[160.5,336.5],[160.5,337.5],[160.5,338.5],[160.5,339.5],[160.5,340.5],[161.5,340.5],[162.5,340.5],[163.5,340.5],[164.5,340.5],[165.5,340.5],[166.5,340.5],[167.5,340.5],[168.5,340.5],[169.5,340.5],[170.5,340.5],[171.5,340.5],[172.5,340.5],[173.5,340.5],[174.5,340.5],[175.5,340.5],[176.5,340.5],[177.5,340.5],[178.5,340.5],[179.5,340.5],[180.5,340.5],[181.5,340.5],[182.5,340.5],[183.5,340.5],[184.5,340.5],[185.5,340.5],[186.5,340.5],[187.5,340.5],[188.5,340.5],[189.5,340.5],[190.5,340.5],[191.5,340.5],[192.5,340.5],[193.5,340.5],[194.5,340.5],[195.5,340.5],[196.5,340.5],[197.5,340.5],[198.5,340.5],[199.5,340.5],[200.5,340.5],[201.5,340.5],[202.5,340.5],[203.5,340.5],[204.5,340.5],[205.5,340.5],[206.5,340.5],[207.5,340.5],[208.5,340.5],[209.5,340.5],[210.5,340.5],[211.5,340.5],[212.5,340.5],[213.5,340.5],[214.5,340.5],[215.5,340.5],[216.5,340.5],[217.5,340.5],[218.5,340.5],[219.5,340.5],[220.5,340.5],[221.5,340.5],[222.5,340.5],[223.5,340.5],[224.5,340.5],[225.5,340.5],[226.5,340.5],[227.5,340.5],[228.5,340.5],[229.5,340.5],[230.5,340.5],[231.5,340.5],[232.5,340.5],[233.5,340.5],[234.5,340.5],[235.5,340.5],[236.5,340.5],[237.5,340.5],[238.5,340.5],[239.5,340.5],[240.5,340.5],[241.5,340.5],[242.5,340.5],[243.5,340.5],[244.5,340.5],[245.5,340.5],[246.5,340.5],[247.5,340.5],[248.5,340.5],[249.5,340.5],[250.5,340.5],[251.5,340.5],[252.5,340.5],[253.5,340.5],[254.5,340.5],[255.5,340.5],[256.5,340.5],[257.5,340.5],[258.5,340.5],[259.5,340.5],[259.5,341.5],[259.5,342.5],[259.5,343.5],[259.5,344.5],[259.5,345.5],[259.5,346.5],[259.5,347.5],[259.5,348.5],[259.5,349.5],[259.5,350.5],[259.5,351.5],[259.5,352.5],[259.5,353.5],[259.5,354.5],[259.5,355.5],[259.5,356.5],[259.5,357.5],[259.5,358.5],[259.5,359.5],[260.5,359.5],[260.5,360.5],[261.5,360.5],[261.5,361.5],[262.5,361.5],[263.5,361.5],[264.5,361.5],[265.5,361.5],[266.5,361.5],[267.5,361.5],[268.5,361.5],[269.5,361.5],[270.5,361.5],[271.5,361.5],[272.5,361.5],[273.5,361.5],[274.5,361.5],[275.5,361.5],[276.5,361.5],[277.5,361.5],[278.5,361.5],[279.5,361.5],[280.5,361.5],[281.5,361.5],[282.5,361.5],[283.5,361.5],[284.5,361.5],[285.5,361.5],[286.5,361.5],[287.5,361.5],[288.5,361.5],[289.5,361.5],[289.5,362.5],[289.5,363.5],[289.5,364.5],[289.5,365.5],[289.5,366.5],[289.5,367.5],[289.5,368.5],[289.5,369.5],[289.5,370.5],[289.5,371.5],[289.5,372.5],[289.5,373.5],[289.5,374.5],[290.5,374.5],[290.5,375.5],[291.5,375.5],[291.5,376.5],[291.5,377.5],[291.5,378.5],[291.5,379.5],[292.5,379.5],[292.5,380.5],[292.5,381.5],[293.5,381.5],[293.5,382.5],[293.5,383.5],[293.5,384.5],[294.5,384.5],[294.5,385.5],[294.5,386.5],[294.5,387.5],[295.5,387.5],[295.5,388.5],[296.5,388.5],[296.5,389.5],[296.5,390.5],[297.5,390.5],[297.5,391.5],[297.5,392.5],[297.5,393.5],[297.5,394.5],[297.5,395.5],[297.5,396.5],[297.5,397.5],[297.5,398.5],[297.5,399.5],[297.5,400.5],[297.5,401.5],[297.5,402.5],[297.5,403.5],[297.5,404.5],[297.5,405.5],[298.5,405.5],[298.5,406.5],[298.5,407.5],[298.5,408.5],[299.5,408.5],[299.5,409.5],[299.5,410.5],[299.5,411.5],[300.5,411.5],[300.5,412.5],[300.5,413.5],[300.5,414.5],[300.5,415.5],[300.5,416.5],[300.5,417.5],[300.5,418.5],[300.5,419.5],[300.5,420.5],[300.5,421.5],[300.5,422.5],[300.5,423.5],[300.5,424.5],[300.5,425.5],[300.5,426.5],[300.5,427.5],[300.5,428.5],[300.5,429.5],[300.5,430.5],[300.5,431.5],[300.5,432.5],[300.5,433.5],[300.5,434.5],[300.5,435.5],[300.5,436.5],[300.5,437.5],[300.5,438.5],[300.5,439.5],[300.5,440.5],[300.5,441.5],[300.5,442.5],[300.5,443.5],[300.5,444.5],[300.5,445.5],[300.5,446.5],[300.5,447.5],[300.5,448.5],[300.5,449.5],[300.5,450.5],[300.5,451.5],[300.5,452.5],[300.5,453.5],[300.5,454.5],[300.5,455.5],[300.5,456.5],[300.5,457.5],[300.5,458.5],[300.5,459.5],[300.5,460.5],[300.5,461.5],[300.5,462.5],[300.5,463.5],[300.5,464.5],[300.5,465.5],[300.5,466.5],[300.5,467.5],[300.5,468.5],[300.5,469.5],[300.5,470.5],[299.5,470.5],[298.5,470.5],[297.5,470.5],[297.5,469.5],[297.5,468.5],[297.5,467.5],[297.5,466.5],[297.5,465.5],[297.5,464.5],[297.5,463.5],[297.5,462.5],[297.5,461.5],[297.5,460.5],[297.5,459.5],[297.5,458.5],[297.5,457.5],[297.5,456.5],[297.5,455.5],[297.5,454.5],[297.5,453.5],[297.5,452.5],[297.5,451.5],[297.5,450.5],[297.5,449.5],[297.5,448.5],[297.5,447.5],[297.5,446.5],[297.5,445.5],[297.5,444.5],[297.5,443.5],[297.5,442.5],[297.5,441.5],[297.5,440.5],[297.5,439.5],[297.5,438.5],[297.5,437.5],[297.5,436.5],[297.5,435.5],[297.5,434.5],[297.5,433.5],[297.5,432.5],[297.5,431.5],[297.5,430.5],[297.5,429.5],[297.5,428.5],[297.5,427.5],[297.5,426.5],[297.5,425.5],[297.5,424.5],[297.5,423.5],[297.5,422.5],[297.5,421.5],[297.5,420.5],[297.5,419.5],[297.5,418.5],[296.5,418.5],[295.5,418.5],[294.5,418.5],[294.5,417.5],[294.5,416.5],[294.5,415.5],[294.5,414.5],[294.5,413.5],[294.5,412.5],[294.5,411.5],[294.5,410.5],[294.5,409.5],[294.5,408.5],[294.5,407.5],[294.5,406.5],[294.5,405.5],[294.5,404.5],[294.5,403.5],[294.5,402.5],[294.5,401.5],[294.5,400.5],[294.5,399.5],[294.5,398.5],[294.5,397.5],[294.5,396.5],[294.5,395.5],[294.5,394.5],[295.5,394.5],[296.5,394.5],[297.5,394.5],[298.5,394.5],[299.5,394.5],[300.5,394.5],[301.5,394.5],[302.5,394.5],[303.5,394.5],[304.5,394.5],[304.5,395.5],[305.5,395.5],[305.5,396.5],[306.5,396.5],[306.5,397.5],[307.5,397.5],[307.5,398.5],[308.5,398.5],[308.5,399.5],[309.5,399.5],[310.5,399.5],[310.5,400.5],[310.5,401.5],[310.5,402.5],[310.5,403.5],[311.5,403.5],[312.5,403.5],[313.5,403.5],[314.5,403.5],[315.5,403.5],[316.5,403.5],[317.5,403.5],[318.5,403.5],[319.5,403.5],[320.5,403.5],[321.5,403.5],[322.5,403.5],[323.5,403.5],[324.5,403.5],[325.5,403.5],[326.5,403.5],[327.5,403.5],[328.5,403.5],[329.5,403.5],[330.5,403.5],[331.5,403.5],[332.5,403.5],[333.5,403.5],[334.5,403.5],[335.5,403.5],[336.5,403.5],[337.5,403.5],[338.5,403.5],[339.5,403.5],[340.5,403.5],[341.5,403.5],[342.5,403.5],[343.5,403.5],[344.5,403.5],[345.5,403.5],[346.5,403.5],[347.5,403.5],[348.5,403.5],[349.5,403.5],[350.5,403.5],[351.5,403.5],[352.5,403.5],[353.5,403.5],[354.5,403.5],[355.5,403.5],[356.5,403.5],[357.5,403.5],[358.5,403.5],[359.5,403.5],[360.5,403.5],[361.5,403.5],[361.5,404.5],[361.5,405.5],[361.5,406.5],[361.5,407.5],[361.5,408.5],[361.5,409.5],[361.5,410.5],[361.5,411.5],[361.5,412.5],[361.5,413.5],[361.5,414.5],[361.5,415.5],[361.5,416.5],[361.5,417.5],[361.5,418.5],[362.5,418.5],[363.5,418.5],[364.5,418.5],[364.5,417.5],[364.5,416.5],[364.5,415.5],[364.5,414.5],[364.5,413.5],[364.5,412.5],[364.5,411.5],[364.5,410.5],[364.5,409.5],[364.5,408.5],[364.5,407.5],[364.5,406.5],[364.5,405.5],[364.5,404.5],[364.5,403.5],[364.5,402.5],[364.5,401.5],[364.5,400.5],[363.5,400.5],[362.5,400.5],[361.5,400.5],[361.5,399.5],[361.5,398.5],[361.5,397.5],[361.5,396.5],[361.5,395.5],[361.5,394.5],[361.5,393.5],[361.5,392.5],[361.5,391.5],[361.5,390.5],[361.5,389.5],[361.5,388.5],[361.5,387.5],[361.5,386.5],[361.5,385.5],[361.5,384.5],[361.5,383.5],[361.5,382.5],[361.5,381.5],[361.5,380.5],[361.5,379.5],[361.5,378.5],[361.5,377.5],[361.5,376.5],[361.5,375.5],[361.5,374.5],[360.5,374.5],[360.5,373.5],[359.5,373.5],[358.5,373.5],[358.5,372.5],[357.5,372.5],[356.5,372.5],[355.5,372.5],[354.5,372.5],[353.5,372.5],[352.5,372.5],[351.5,372.5],[350.5,372.5],[350.5,371.5],[350.5,370.5],[350.5,369.5],[350.5,368.5],[350.5,367.5],[350.5,366.5],[350.5,365.5],[350.5,364.5],[350.5,363.5],[350.5,362.5],[350.5,361.5],[350.5,360.5],[350.5,359.5],[350.5,358.5],[350.5,357.5],[350.5,356.5],[350.5,355.5],[350.5,354.5],[350.5,353.5],[350.5,352.5],[350.5,351.5],[350.5,350.5],[350.5,349.5],[350.5,348.5],[350.5,347.5],[350.5,346.5],[350.5,345.5],[350.5,344.5],[350.5,343.5],[350.5,342.5],[350.5,341.5],[350.5,340.5],[350.5,339.5],[350.5,338.5],[350.5,337.5],[350.5,336.5],[350.5,335.5],[350.5,334.5],[350.5,333.5],[350.5,332.5],[350.5,331.5],[350.5,330.5],[350.5,329.5],[350.5,328.5],[350.5,327.5],[350.5,326.5],[350.5,325.5],[350.5,324.5],[350.5,323.5],[351.5,323.5],[351.5,322.5],[351.5,321.5],[351.5,320.5],[350.5,320.5],[349.5,320.5],[349.5,319.5],[349.5,318.5],[349.5,317.5],[349.5,316.5],[349.5,315.5],[349.5,314.5],[349.5,313.5]]"),tn={name:o1,start:l1,gates:c1,route:u1};/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.8.2
*/var En=Uint8Array,Br=Uint16Array,h1=Int32Array,Hf=new En([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Gf=new En([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),d1=new En([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Wf=function(r,e){for(var t=new Br(31),n=0;n<31;++n)t[n]=e+=1<<r[n-1];for(var i=new h1(t[30]),n=1;n<30;++n)for(var s=t[n];s<t[n+1];++s)i[s]=s-t[n]<<5|n;return{b:t,r:i}},Xf=Wf(Hf,2),jf=Xf.b,f1=Xf.r;jf[28]=258,f1[258]=28;var p1=Wf(Gf,0),m1=p1.b,Ic=new Br(32768);for(var St=0;St<32768;++St){var Ii=(St&43690)>>1|(St&21845)<<1;Ii=(Ii&52428)>>2|(Ii&13107)<<2,Ii=(Ii&61680)>>4|(Ii&3855)<<4,Ic[St]=((Ii&65280)>>8|(Ii&255)<<8)>>1}var ws=(function(r,e,t){for(var n=r.length,i=0,s=new Br(e);i<n;++i)r[i]&&++s[r[i]-1];var a=new Br(e);for(i=1;i<e;++i)a[i]=a[i-1]+s[i-1]<<1;var o;if(t){o=new Br(1<<e);var l=15-e;for(i=0;i<n;++i)if(r[i])for(var c=i<<4|r[i],u=e-r[i],h=a[r[i]-1]++<<u,d=h|(1<<u)-1;h<=d;++h)o[Ic[h]>>l]=c}else for(o=new Br(n),i=0;i<n;++i)r[i]&&(o[i]=Ic[a[r[i]-1]++]>>15-r[i]);return o}),ta=new En(288);for(var St=0;St<144;++St)ta[St]=8;for(var St=144;St<256;++St)ta[St]=9;for(var St=256;St<280;++St)ta[St]=7;for(var St=280;St<288;++St)ta[St]=8;var qf=new En(32);for(var St=0;St<32;++St)qf[St]=5;var g1=ws(ta,9,1),v1=ws(qf,5,1),Ml=function(r){for(var e=r[0],t=1;t<r.length;++t)r[t]>e&&(e=r[t]);return e},Nn=function(r,e,t){var n=e/8|0;return(r[n]|r[n+1]<<8)>>(e&7)&t},Sl=function(r,e){var t=e/8|0;return(r[t]|r[t+1]<<8|r[t+2]<<16)>>(e&7)},x1=function(r){return(r+7)/8|0},_1=function(r,e,t){return(t==null||t>r.length)&&(t=r.length),new En(r.subarray(e,t))},y1=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],Fn=function(r,e,t){var n=new Error(e||y1[r]);if(n.code=r,Error.captureStackTrace&&Error.captureStackTrace(n,Fn),!t)throw n;return n},M1=function(r,e,t,n){var i=r.length,s=0;if(!i||e.f&&!e.l)return t||new En(0);var a=!t,o=a||e.i!=2,l=e.i;a&&(t=new En(i*3));var c=function(Le){var Q=t.length;if(Le>Q){var ye=new En(Math.max(Q*2,Le));ye.set(t),t=ye}},u=e.f||0,h=e.p||0,d=e.b||0,f=e.l,p=e.d,v=e.m,g=e.n,m=i*8;do{if(!f){u=Nn(r,h,1);var S=Nn(r,h+1,3);if(h+=3,S)if(S==1)f=g1,p=v1,v=9,g=5;else if(S==2){var R=Nn(r,h,31)+257,A=Nn(r,h+10,15)+4,I=R+Nn(r,h+5,31)+1;h+=14;for(var T=new En(I),_=new En(19),M=0;M<A;++M)_[d1[M]]=Nn(r,h+M*3,7);h+=A*3;for(var L=Ml(_),U=(1<<L)-1,N=ws(_,L,1),M=0;M<I;){var F=N[Nn(r,h,U)];h+=F&15;var y=F>>4;if(y<16)T[M++]=y;else{var k=0,W=0;for(y==16?(W=3+Nn(r,h,3),h+=2,k=T[M-1]):y==17?(W=3+Nn(r,h,7),h+=3):y==18&&(W=11+Nn(r,h,127),h+=7);W--;)T[M++]=k}}var V=T.subarray(0,R),K=T.subarray(R);v=Ml(V),g=Ml(K),f=ws(V,v,1),p=ws(K,g,1)}else Fn(1);else{var y=x1(h)+4,x=r[y-4]|r[y-3]<<8,P=y+x;if(P>i){l&&Fn(0);break}o&&c(d+x),t.set(r.subarray(y,P),d),e.b=d+=x,e.p=h=P*8,e.f=u;continue}if(h>m){l&&Fn(0);break}}o&&c(d+131072);for(var $=(1<<v)-1,J=(1<<g)-1,oe=h;;oe=h){var k=f[Sl(r,h)&$],Re=k>>4;if(h+=k&15,h>m){l&&Fn(0);break}if(k||Fn(2),Re<256)t[d++]=Re;else if(Re==256){oe=h,f=null;break}else{var j=Re-254;if(Re>264){var M=Re-257,ne=Hf[M];j=Nn(r,h,(1<<ne)-1)+jf[M],h+=ne}var ue=p[Sl(r,h)&J],ee=ue>>4;ue||Fn(3),h+=ue&15;var K=m1[ee];if(ee>3){var ne=Gf[ee];K+=Sl(r,h)&(1<<ne)-1,h+=ne}if(h>m){l&&Fn(0);break}o&&c(d+131072);var ve=d+j;if(d<K){var Te=s-K,X=Math.min(K,ve);for(Te+d<0&&Fn(3);d<X;++d)t[d]=n[Te+d]}for(;d<ve;++d)t[d]=t[d-K]}}e.l=f,e.p=oe,e.b=d,e.f=u,f&&(u=1,e.m=v,e.d=p,e.n=g)}while(!u);return d!=t.length&&a?_1(t,0,d):t.subarray(0,d)},S1=new En(0),b1=function(r,e){return((r[0]&15)!=8||r[0]>>4>7||(r[0]<<8|r[1])%31)&&Fn(6,"invalid zlib data"),(r[1]>>5&1)==1&&Fn(6,"invalid zlib data: "+(r[1]&32?"need":"unexpected")+" dictionary"),(r[1]>>3&4)+2};function T1(r,e){return M1(r.subarray(b1(r),-4),{i:2},e,e)}var E1=typeof TextDecoder<"u"&&new TextDecoder,w1=0;try{E1.decode(S1,{stream:!0}),w1=1}catch{}function Yf(r,e,t){const n=t.length-r-1;if(e>=t[n])return n-1;if(e<=t[r])return r;let i=r,s=n,a=Math.floor((i+s)/2);for(;e<t[a]||e>=t[a+1];)e<t[a]?s=a:i=a,a=Math.floor((i+s)/2);return a}function A1(r,e,t,n){const i=[],s=[],a=[];i[0]=1;for(let o=1;o<=t;++o){s[o]=e-n[r+1-o],a[o]=n[r+o]-e;let l=0;for(let c=0;c<o;++c){const u=a[c+1],h=s[o-c],d=i[c]/(u+h);i[c]=l+u*d,l=h*d}i[o]=l}return i}function C1(r,e,t,n){const i=Yf(r,n,e),s=A1(i,n,r,e),a=new rt(0,0,0,0);for(let o=0;o<=r;++o){const l=t[i-r+o],c=s[o],u=l.w*c;a.x+=l.x*u,a.y+=l.y*u,a.z+=l.z*u,a.w+=l.w*c}return a}function R1(r,e,t,n,i){const s=[];for(let h=0;h<=t;++h)s[h]=0;const a=[];for(let h=0;h<=n;++h)a[h]=s.slice(0);const o=[];for(let h=0;h<=t;++h)o[h]=s.slice(0);o[0][0]=1;const l=s.slice(0),c=s.slice(0);for(let h=1;h<=t;++h){l[h]=e-i[r+1-h],c[h]=i[r+h]-e;let d=0;for(let f=0;f<h;++f){const p=c[f+1],v=l[h-f];o[h][f]=p+v;const g=o[f][h-1]/o[h][f];o[f][h]=d+p*g,d=v*g}o[h][h]=d}for(let h=0;h<=t;++h)a[0][h]=o[h][t];for(let h=0;h<=t;++h){let d=0,f=1;const p=[];for(let v=0;v<=t;++v)p[v]=s.slice(0);p[0][0]=1;for(let v=1;v<=n;++v){let g=0;const m=h-v,S=t-v;h>=v&&(p[f][0]=p[d][0]/o[S+1][m],g=p[f][0]*o[m][S]);const y=m>=-1?1:-m,x=h-1<=S?v-1:t-h;for(let R=y;R<=x;++R)p[f][R]=(p[d][R]-p[d][R-1])/o[S+1][m+R],g+=p[f][R]*o[m+R][S];h<=S&&(p[f][v]=-p[d][v-1]/o[S+1][h],g+=p[f][v]*o[h][S]),a[v][h]=g;const P=d;d=f,f=P}}let u=t;for(let h=1;h<=n;++h){for(let d=0;d<=t;++d)a[h][d]*=u;u*=t-h}return a}function P1(r,e,t,n,i){const s=i<r?i:r,a=[],o=Yf(r,n,e),l=R1(o,n,r,s,e),c=[];for(let u=0;u<t.length;++u){const h=t[u].clone(),d=h.w;h.x*=d,h.y*=d,h.z*=d,c[u]=h}for(let u=0;u<=s;++u){const h=c[o-r].clone().multiplyScalar(l[u][0]);for(let d=1;d<=r;++d)h.add(c[o-r+d].clone().multiplyScalar(l[u][d]));a[u]=h}for(let u=s+1;u<=i+1;++u)a[u]=new rt(0,0,0);return a}function I1(r,e){let t=1;for(let i=2;i<=r;++i)t*=i;let n=1;for(let i=2;i<=e;++i)n*=i;for(let i=2;i<=r-e;++i)n*=i;return t/n}function D1(r){const e=r.length,t=[],n=[];for(let s=0;s<e;++s){const a=r[s];t[s]=new C(a.x,a.y,a.z),n[s]=a.w}const i=[];for(let s=0;s<e;++s){const a=t[s].clone();for(let o=1;o<=s;++o)a.sub(i[s-o].clone().multiplyScalar(I1(s,o)*n[o]));i[s]=a.divideScalar(n[0])}return i}function L1(r,e,t,n,i){const s=P1(r,e,t,n,i);return D1(s)}class U1 extends U_{constructor(e,t,n,i,s){super();const a=t?t.length-1:0,o=n?n.length:0;this.degree=e,this.knots=t,this.controlPoints=[],this.startKnot=i||0,this.endKnot=s||a;for(let l=0;l<o;++l){const c=n[l];this.controlPoints[l]=new rt(c.x,c.y,c.z,c.w)}}getPoint(e,t=new C){const n=t,i=this.knots[this.startKnot]+e*(this.knots[this.endKnot]-this.knots[this.startKnot]),s=C1(this.degree,this.knots,this.controlPoints,i);return s.w!==1&&s.divideScalar(s.w),n.set(s.x,s.y,s.z)}getTangent(e,t=new C){const n=t,i=this.knots[0]+e*(this.knots[this.knots.length-1]-this.knots[0]),s=L1(this.degree,this.knots,this.controlPoints,i,1);return n.copy(s[1]).normalize(),n}toJSON(){const e=super.toJSON();return e.degree=this.degree,e.knots=[...this.knots],e.controlPoints=this.controlPoints.map(t=>t.toArray()),e.startKnot=this.startKnot,e.endKnot=this.endKnot,e}fromJSON(e){return super.fromJSON(e),this.degree=e.degree,this.knots=[...e.knots],this.controlPoints=e.controlPoints.map(t=>new rt(t[0],t[1],t[2],t[3])),this.startKnot=e.startKnot,this.endKnot=e.endKnot,this}}let Je,Ct,an;class N1 extends Zn{constructor(e){super(e)}load(e,t,n,i){const s=this,a=s.path===""?Hr.extractUrlBase(e):s.path,o=new zs(this.manager);o.setPath(s.path),o.setResponseType("arraybuffer"),o.setRequestHeader(s.requestHeader),o.setWithCredentials(s.withCredentials),o.load(e,function(l){try{t(s.parse(l,a))}catch(c){i?i(c):console.error(c),s.manager.itemError(e)}},n,i)}parse(e,t){if(V1(e))Je=new z1().parse(e);else{const i=$f(e);if(!H1(i))throw new Error("THREE.FBXLoader: Unknown format.");if(gd(i)<7e3)throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: "+gd(i));Je=new k1().parse(i)}const n=new wf(this.manager).setPath(this.resourcePath||t).setCrossOrigin(this.crossOrigin);return new F1(n,this.manager).parse(Je)}}class F1{constructor(e,t){this.textureLoader=e,this.manager=t}parse(){Ct=this.parseConnections();const e=this.parseImages(),t=this.parseTextures(e),n=this.parseMaterials(t),i=this.parseDeformers(),s=new O1().parse(i);return this.parseScene(i,s,n),an}parseConnections(){const e=new Map;return"Connections"in Je&&Je.Connections.connections.forEach(function(n){const i=n[0],s=n[1],a=n[2];e.has(i)||e.set(i,{parents:[],children:[]});const o={ID:s,relationship:a};e.get(i).parents.push(o),e.has(s)||e.set(s,{parents:[],children:[]});const l={ID:i,relationship:a};e.get(s).children.push(l)}),e}parseImages(){const e={},t={};if("Video"in Je.Objects){const n=Je.Objects.Video;for(const i in n){const s=n[i],a=parseInt(i);if(e[a]=s.RelativeFilename||s.Filename,"Content"in s){const o=s.Content instanceof ArrayBuffer&&s.Content.byteLength>0,l=typeof s.Content=="string"&&s.Content!=="";if(o||l){const c=this.parseImage(n[i]);t[s.RelativeFilename||s.Filename]=c}}}}for(const n in e){const i=e[n];t[i]!==void 0?e[n]=t[i]:e[n]=e[n].split("\\").pop()}return e}parseImage(e){const t=e.Content,n=e.RelativeFilename||e.Filename,i=n.slice(n.lastIndexOf(".")+1).toLowerCase();let s;switch(i){case"bmp":s="image/bmp";break;case"jpg":case"jpeg":s="image/jpeg";break;case"png":s="image/png";break;case"tif":s="image/tiff";break;case"tga":this.manager.getHandler(".tga")===null&&console.warn("FBXLoader: TGA loader not found, skipping ",n),s="image/tga";break;default:console.warn('FBXLoader: Image type "'+i+'" is not supported.');return}if(typeof t=="string")return"data:"+s+";base64,"+t;{const a=new Uint8Array(t);return window.URL.createObjectURL(new Blob([a],{type:s}))}}parseTextures(e){const t=new Map;if("Texture"in Je.Objects){const n=Je.Objects.Texture;for(const i in n){const s=this.parseTexture(n[i],e);t.set(parseInt(i),s)}}return t}parseTexture(e,t){const n=this.loadTexture(e,t);n.ID=e.id,n.name=e.attrName;const i=e.WrapModeU,s=e.WrapModeV,a=i!==void 0?i.value:0,o=s!==void 0?s.value:0;if(n.wrapS=a===0?Rn:jn,n.wrapT=o===0?Rn:jn,"Scaling"in e){const l=e.Scaling.value;n.repeat.x=l[0],n.repeat.y=l[1]}if("Translation"in e){const l=e.Translation.value;n.offset.x=l[0],n.offset.y=l[1]}return n}loadTexture(e,t){const n=new Set(["tga","tif","tiff","exr","dds","hdr","ktx2"]),i=e.FileName.split(".").pop().toLowerCase(),s=n.has(i)?this.manager.getHandler(`.${i}`):this.textureLoader;if(!s)return console.warn(`FBXLoader: ${i.toUpperCase()} loader not found, creating placeholder texture for`,e.RelativeFilename),new Pt;const a=s.path;a||s.setPath(this.textureLoader.path);const o=Ct.get(e.id).children;let l;o!==void 0&&o.length>0&&t[o[0].ID]!==void 0&&(l=t[o[0].ID],(l.indexOf("blob:")===0||l.indexOf("data:")===0)&&s.setPath(void 0));const c=s.load(l);return s.setPath(a),c}parseMaterials(e){const t=new Map;if("Material"in Je.Objects){const n=Je.Objects.Material;for(const i in n){const s=this.parseMaterial(n[i],e);s!==null&&t.set(parseInt(i),s)}}return t}parseMaterial(e,t){const n=e.id,i=e.attrName;let s=e.ShadingModel;if(typeof s=="object"&&(s=s.value),!Ct.has(n))return null;const a=this.parseParameters(e,t,n);let o;switch(s.toLowerCase()){case"phong":o=new hl;break;case"lambert":o=new e5;break;default:console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.',s),o=new hl;break}return o.setValues(a),o.name=i,o}parseParameters(e,t,n){const i={};e.BumpFactor&&(i.bumpScale=e.BumpFactor.value),e.Diffuse?i.color=Xe.toWorkingColorSpace(new Ae().fromArray(e.Diffuse.value),at):e.DiffuseColor&&(e.DiffuseColor.type==="Color"||e.DiffuseColor.type==="ColorRGB")&&(i.color=Xe.toWorkingColorSpace(new Ae().fromArray(e.DiffuseColor.value),at)),e.DisplacementFactor&&(i.displacementScale=e.DisplacementFactor.value),e.Emissive?i.emissive=Xe.toWorkingColorSpace(new Ae().fromArray(e.Emissive.value),at):e.EmissiveColor&&(e.EmissiveColor.type==="Color"||e.EmissiveColor.type==="ColorRGB")&&(i.emissive=Xe.toWorkingColorSpace(new Ae().fromArray(e.EmissiveColor.value),at)),e.EmissiveFactor&&(i.emissiveIntensity=parseFloat(e.EmissiveFactor.value)),i.opacity=1-(e.TransparencyFactor?parseFloat(e.TransparencyFactor.value):0),(i.opacity===1||i.opacity===0)&&(i.opacity=e.Opacity?parseFloat(e.Opacity.value):null,i.opacity===null&&(i.opacity=1-(e.TransparentColor?parseFloat(e.TransparentColor.value[0]):0))),i.opacity<1&&(i.transparent=!0),e.ReflectionFactor&&(i.reflectivity=e.ReflectionFactor.value),e.Shininess&&(i.shininess=e.Shininess.value),e.Specular?i.specular=Xe.toWorkingColorSpace(new Ae().fromArray(e.Specular.value),at):e.SpecularColor&&e.SpecularColor.type==="Color"&&(i.specular=Xe.toWorkingColorSpace(new Ae().fromArray(e.SpecularColor.value),at));const s=this;return Ct.get(n).children.forEach(function(a){const o=a.relationship;switch(o){case"Bump":i.bumpMap=s.getTexture(t,a.ID);break;case"Maya|TEX_ao_map":i.aoMap=s.getTexture(t,a.ID);break;case"DiffuseColor":case"Maya|TEX_color_map":i.map=s.getTexture(t,a.ID),i.map!==void 0&&(i.map.colorSpace=at);break;case"DisplacementColor":i.displacementMap=s.getTexture(t,a.ID);break;case"EmissiveColor":i.emissiveMap=s.getTexture(t,a.ID),i.emissiveMap!==void 0&&(i.emissiveMap.colorSpace=at);break;case"NormalMap":case"Maya|TEX_normal_map":i.normalMap=s.getTexture(t,a.ID);break;case"ReflectionColor":i.envMap=s.getTexture(t,a.ID),i.envMap!==void 0&&(i.envMap.mapping=io,i.envMap.colorSpace=at);break;case"SpecularColor":i.specularMap=s.getTexture(t,a.ID),i.specularMap!==void 0&&(i.specularMap.colorSpace=at);break;case"TransparentColor":case"TransparencyFactor":i.alphaMap=s.getTexture(t,a.ID),i.transparent=!0;break;case"AmbientColor":case"ShininessExponent":case"SpecularFactor":case"VectorDisplacementColor":default:console.warn("THREE.FBXLoader: %s map is not supported in three.js, skipping texture.",o);break}}),i}getTexture(e,t){return"LayeredTexture"in Je.Objects&&t in Je.Objects.LayeredTexture&&(console.warn("THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer."),t=Ct.get(t).children[0].ID),e.get(t)}parseDeformers(){const e={},t={};if("Deformer"in Je.Objects){const n=Je.Objects.Deformer;for(const i in n){const s=n[i],a=Ct.get(parseInt(i));if(s.attrType==="Skin"){const o=this.parseSkeleton(a,n);o.ID=i,a.parents.length>1&&console.warn("THREE.FBXLoader: skeleton attached to more than one geometry is not supported."),o.geometryID=a.parents[0].ID,e[i]=o}else if(s.attrType==="BlendShape"){const o={id:i};o.rawTargets=this.parseMorphTargets(a,n),o.id=i,a.parents.length>1&&console.warn("THREE.FBXLoader: morph target attached to more than one geometry is not supported."),t[i]=o}}}return{skeletons:e,morphTargets:t}}parseSkeleton(e,t){const n=[];return e.children.forEach(function(i){const s=t[i.ID];if(s.attrType!=="Cluster")return;const a={ID:i.ID,indices:[],weights:[],transformLink:new me().fromArray(s.TransformLink.a)};"Indexes"in s&&(a.indices=s.Indexes.a,a.weights=s.Weights.a),n.push(a)}),{rawBones:n,bones:[]}}parseMorphTargets(e,t){const n=[];for(let i=0;i<e.children.length;i++){const s=e.children[i],a=t[s.ID],o={name:a.attrName,initialWeight:a.DeformPercent,id:a.id,fullWeights:a.FullWeights.a};if(a.attrType!=="BlendShapeChannel")return;o.geoID=Ct.get(parseInt(s.ID)).children.filter(function(l){return l.relationship===void 0})[0].ID,n.push(o)}return n}parseScene(e,t,n){an=new Yt;const i=this.parseModels(e.skeletons,t,n),s=Je.Objects.Model,a=this;i.forEach(function(l){const c=s[l.ID];a.setLookAtProperties(l,c),Ct.get(l.ID).parents.forEach(function(h){const d=i.get(h.ID);d!==void 0&&d.add(l)}),l.parent===null&&an.add(l)}),this.bindSkeleton(e.skeletons,t,i),this.addGlobalSceneSettings(),an.traverse(function(l){if(l.userData.transformData){l.parent&&(l.userData.transformData.parentMatrix=l.parent.matrix,l.userData.transformData.parentMatrixWorld=l.parent.matrixWorld);const c=Zf(l.userData.transformData);l.applyMatrix4(c),l.updateWorldMatrix()}});const o=new B1().parse();an.children.length===1&&an.children[0].isGroup&&(an.children[0].animations=o,an=an.children[0]),an.animations=o}parseModels(e,t,n){const i=new Map,s=Je.Objects.Model;for(const a in s){const o=parseInt(a),l=s[a],c=Ct.get(o);let u=this.buildSkeleton(c,e,o,l.attrName);if(!u){switch(l.attrType){case"Camera":u=this.createCamera(c);break;case"Light":u=this.createLight(c);break;case"Mesh":u=this.createMesh(c,t,n);break;case"NurbsCurve":u=this.createCurve(c,t);break;case"LimbNode":case"Root":u=new oo;break;case"Null":default:u=new Yt;break}u.name=l.attrName?ot.sanitizeNodeName(l.attrName):"",u.userData.originalName=l.attrName,u.ID=o}this.getTransformData(u,l),i.set(o,u)}return i}buildSkeleton(e,t,n,i){let s=null;return e.parents.forEach(function(a){for(const o in t){const l=t[o];l.rawBones.forEach(function(c,u){if(c.ID===a.ID){const h=s;s=new oo,s.matrixWorld.copy(c.transformLink),s.name=i?ot.sanitizeNodeName(i):"",s.userData.originalName=i,s.ID=n,l.bones[u]=s,h!==null&&s.add(h)}})}}),s}createCamera(e){let t,n;if(e.children.forEach(function(i){const s=Je.Objects.NodeAttribute[i.ID];s!==void 0&&(n=s)}),n===void 0)t=new dt;else{let i=0;n.CameraProjectionType!==void 0&&n.CameraProjectionType.value===1&&(i=1);let s=1;n.NearPlane!==void 0&&(s=n.NearPlane.value/1e3);let a=1e3;n.FarPlane!==void 0&&(a=n.FarPlane.value/1e3);let o=window.innerWidth,l=window.innerHeight;n.AspectWidth!==void 0&&n.AspectHeight!==void 0&&(o=n.AspectWidth.value,l=n.AspectHeight.value);const c=o/l;let u=45;n.FieldOfView!==void 0&&(u=n.FieldOfView.value);const h=n.FocalLength?n.FocalLength.value:null;switch(i){case 0:t=new Qt(u,c,s,a),h!==null&&t.setFocalLength(h);break;case 1:console.warn("THREE.FBXLoader: Orthographic cameras not supported yet."),t=new dt;break;default:console.warn("THREE.FBXLoader: Unknown camera type "+i+"."),t=new dt;break}}return t}createLight(e){let t,n;if(e.children.forEach(function(i){const s=Je.Objects.NodeAttribute[i.ID];s!==void 0&&(n=s)}),n===void 0)t=new dt;else{let i;n.LightType===void 0?i=0:i=n.LightType.value;let s=16777215;n.Color!==void 0&&(s=Xe.toWorkingColorSpace(new Ae().fromArray(n.Color.value),at));let a=n.Intensity===void 0?1:n.Intensity.value/100;n.CastLightOnObject!==void 0&&n.CastLightOnObject.value===0&&(a=0);let o=0;n.FarAttenuationEnd!==void 0&&(n.EnableFarAttenuation!==void 0&&n.EnableFarAttenuation.value===0?o=0:o=n.FarAttenuationEnd.value);const l=1;switch(i){case 0:t=new ho(s,a,o,l);break;case 1:t=new ru(s,a);break;case 2:let c=Math.PI/3;n.InnerAngle!==void 0&&(c=jt.degToRad(n.InnerAngle.value));let u=0;n.OuterAngle!==void 0&&(u=jt.degToRad(n.OuterAngle.value),u=Math.max(u,1)),t=new Af(s,a,o,c,u,l);break;default:console.warn("THREE.FBXLoader: Unknown light type "+n.LightType.value+", defaulting to a PointLight."),t=new ho(s,a);break}n.CastShadows!==void 0&&n.CastShadows.value===1&&(t.castShadow=!0)}return t}createMesh(e,t,n){let i,s=null,a=null;const o=[];return e.children.forEach(function(l){t.has(l.ID)&&(s=t.get(l.ID)),n.has(l.ID)&&o.push(n.get(l.ID))}),o.length>1?a=o:o.length>0?a=o[0]:(a=new hl({name:Zn.DEFAULT_MATERIAL_NAME,color:13421772}),o.push(a)),"color"in s.attributes&&o.forEach(function(l){l.vertexColors=!0}),s.FBX_Deformer?(i=new mf(s,a),i.normalizeSkinWeights()):i=new Ft(s,a),i}createCurve(e,t){const n=e.children.reduce(function(s,a){return t.has(a.ID)&&(s=t.get(a.ID)),s},null),i=new Fs({name:Zn.DEFAULT_MATERIAL_NAME,color:3342591,linewidth:1});return new wo(n,i)}getTransformData(e,t){const n={};"InheritType"in t&&(n.inheritType=parseInt(t.InheritType.value)),"RotationOrder"in t?n.eulerOrder=Gs(t.RotationOrder.value):n.eulerOrder=Gs(0),"Lcl_Translation"in t&&(n.translation=t.Lcl_Translation.value),"PreRotation"in t&&(n.preRotation=t.PreRotation.value),"Lcl_Rotation"in t&&(n.rotation=t.Lcl_Rotation.value),"PostRotation"in t&&(n.postRotation=t.PostRotation.value),"Lcl_Scaling"in t&&(n.scale=t.Lcl_Scaling.value),"ScalingOffset"in t&&(n.scalingOffset=t.ScalingOffset.value),"ScalingPivot"in t&&(n.scalingPivot=t.ScalingPivot.value),"RotationOffset"in t&&(n.rotationOffset=t.RotationOffset.value),"RotationPivot"in t&&(n.rotationPivot=t.RotationPivot.value),e.userData.transformData=n}setLookAtProperties(e,t){"LookAtProperty"in t&&Ct.get(e.ID).children.forEach(function(i){if(i.relationship==="LookAtProperty"){const s=Je.Objects.Model[i.ID];if("Lcl_Translation"in s){const a=s.Lcl_Translation.value;e.target!==void 0?(e.target.position.fromArray(a),an.add(e.target)):e.lookAt(new C().fromArray(a))}}})}bindSkeleton(e,t,n){const i=this.parsePoseNodes();for(const s in e){const a=e[s];Ct.get(parseInt(a.ID)).parents.forEach(function(l){if(t.has(l.ID)){const c=l.ID;Ct.get(c).parents.forEach(function(h){n.has(h.ID)&&n.get(h.ID).bind(new Ys(a.bones),i[h.ID])})}})}}parsePoseNodes(){const e={};if("Pose"in Je.Objects){const t=Je.Objects.Pose;for(const n in t)if(t[n].attrType==="BindPose"&&t[n].NbPoseNodes>0){const i=t[n].PoseNode;Array.isArray(i)?i.forEach(function(s){e[s.Node]=new me().fromArray(s.Matrix.a)}):e[i.Node]=new me().fromArray(i.Matrix.a)}}return e}addGlobalSceneSettings(){if("GlobalSettings"in Je){if("AmbientColor"in Je.GlobalSettings){const e=Je.GlobalSettings.AmbientColor.value,t=e[0],n=e[1],i=e[2];if(t!==0||n!==0||i!==0){const s=new Ae().setRGB(t,n,i,at);an.add(new g5(s,1))}}"UnitScaleFactor"in Je.GlobalSettings&&(an.userData.unitScaleFactor=Je.GlobalSettings.UnitScaleFactor.value)}}}class O1{constructor(){this.negativeMaterialIndices=!1}parse(e){const t=new Map;if("Geometry"in Je.Objects){const n=Je.Objects.Geometry;for(const i in n){const s=Ct.get(parseInt(i)),a=this.parseGeometry(s,n[i],e);t.set(parseInt(i),a)}}return this.negativeMaterialIndices===!0&&console.warn("THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected."),t}parseGeometry(e,t,n){switch(t.attrType){case"Mesh":return this.parseMeshGeometry(e,t,n);case"NurbsCurve":return this.parseNurbsGeometry(t)}}parseMeshGeometry(e,t,n){const i=n.skeletons,s=[],a=e.parents.map(function(h){return Je.Objects.Model[h.ID]});if(a.length===0)return;const o=e.children.reduce(function(h,d){return i[d.ID]!==void 0&&(h=i[d.ID]),h},null);e.children.forEach(function(h){n.morphTargets[h.ID]!==void 0&&s.push(n.morphTargets[h.ID])});const l=a[0],c={};"RotationOrder"in l&&(c.eulerOrder=Gs(l.RotationOrder.value)),"InheritType"in l&&(c.inheritType=parseInt(l.InheritType.value)),"GeometricTranslation"in l&&(c.translation=l.GeometricTranslation.value),"GeometricRotation"in l&&(c.rotation=l.GeometricRotation.value),"GeometricScaling"in l&&(c.scale=l.GeometricScaling.value);const u=Zf(c);return this.genGeometry(t,o,s,u)}genGeometry(e,t,n,i){const s=new It;e.attrName&&(s.name=e.attrName);const a=this.parseGeoNode(e,t),o=this.genBuffers(a),l=new Ut(o.vertex,3);if(l.applyMatrix4(i),s.setAttribute("position",l),o.colors.length>0&&s.setAttribute("color",new Ut(o.colors,3)),t&&(s.setAttribute("skinIndex",new qc(o.weightsIndices,4)),s.setAttribute("skinWeight",new Ut(o.vertexWeights,4)),s.FBX_Deformer=t),o.normal.length>0){const c=new qe().getNormalMatrix(i),u=new Ut(o.normal,3);u.applyNormalMatrix(c),s.setAttribute("normal",u)}if(o.uvs.forEach(function(c,u){const h=u===0?"uv":`uv${u}`;s.setAttribute(h,new Ut(o.uvs[u],2))}),a.material&&a.material.mappingType!=="AllSame"){let c=o.materialIndex[0],u=0;if(o.materialIndex.forEach(function(h,d){h!==c&&(s.addGroup(u,d-u,c),c=h,u=d)}),s.groups.length>0){const h=s.groups[s.groups.length-1],d=h.start+h.count;d!==o.materialIndex.length&&s.addGroup(d,o.materialIndex.length-d,c)}s.groups.length===0&&s.addGroup(0,o.materialIndex.length,o.materialIndex[0])}return this.addMorphTargets(s,e,n,i),s}parseGeoNode(e,t){const n={};if(n.vertexPositions=e.Vertices!==void 0?e.Vertices.a:[],n.vertexIndices=e.PolygonVertexIndex!==void 0?e.PolygonVertexIndex.a:[],e.LayerElementColor&&(n.color=this.parseVertexColors(e.LayerElementColor[0])),e.LayerElementMaterial&&(n.material=this.parseMaterialIndices(e.LayerElementMaterial[0])),e.LayerElementNormal&&(n.normal=this.parseNormals(e.LayerElementNormal[0])),e.LayerElementUV){n.uv=[];let i=0;for(;e.LayerElementUV[i];)e.LayerElementUV[i].UV&&n.uv.push(this.parseUVs(e.LayerElementUV[i])),i++}return n.weightTable={},t!==null&&(n.skeleton=t,t.rawBones.forEach(function(i,s){i.indices.forEach(function(a,o){n.weightTable[a]===void 0&&(n.weightTable[a]=[]),n.weightTable[a].push({id:s,weight:i.weights[o]})})})),n}genBuffers(e){const t={vertex:[],normal:[],colors:[],uvs:[],materialIndex:[],vertexWeights:[],weightsIndices:[]};let n=0,i=0,s=!1,a=[],o=[],l=[],c=[],u=[],h=[];const d=this;return e.vertexIndices.forEach(function(f,p){let v,g=!1;f<0&&(f=f^-1,g=!0);let m=[],S=[];if(a.push(f*3,f*3+1,f*3+2),e.color){const y=Wa(p,n,f,e.color);l.push(y[0],y[1],y[2])}if(e.skeleton){if(e.weightTable[f]!==void 0&&e.weightTable[f].forEach(function(y){S.push(y.weight),m.push(y.id)}),S.length>4){s||(console.warn("THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights."),s=!0);const y=[0,0,0,0],x=[0,0,0,0];S.forEach(function(P,R){let A=P,I=m[R];x.forEach(function(T,_,M){if(A>T){M[_]=A,A=T;const L=y[_];y[_]=I,I=L}})}),m=y,S=x}for(;S.length<4;)S.push(0),m.push(0);for(let y=0;y<4;++y)u.push(S[y]),h.push(m[y])}if(e.normal){const y=Wa(p,n,f,e.normal);o.push(y[0],y[1],y[2])}e.material&&e.material.mappingType!=="AllSame"&&(v=Wa(p,n,f,e.material)[0],v<0&&(d.negativeMaterialIndices=!0,v=0)),e.uv&&e.uv.forEach(function(y,x){const P=Wa(p,n,f,y);c[x]===void 0&&(c[x]=[]),c[x].push(P[0]),c[x].push(P[1])}),i++,g&&(d.genFace(t,e,a,v,o,l,c,u,h,i),n++,i=0,a=[],o=[],l=[],c=[],u=[],h=[])}),t}getNormalNewell(e){const t=new C(0,0,0);for(let n=0;n<e.length;n++){const i=e[n],s=e[(n+1)%e.length];t.x+=(i.y-s.y)*(i.z+s.z),t.y+=(i.z-s.z)*(i.x+s.x),t.z+=(i.x-s.x)*(i.y+s.y)}return t.normalize(),t}getNormalTangentAndBitangent(e){const t=this.getNormalNewell(e),i=(Math.abs(t.z)>.5?new C(0,1,0):new C(0,0,1)).cross(t).normalize(),s=t.clone().cross(i).normalize();return{normal:t,tangent:i,bitangent:s}}flattenVertex(e,t,n){return new Ue(e.dot(t),e.dot(n))}genFace(e,t,n,i,s,a,o,l,c,u){let h;if(u>3){const d=[],f=t.baseVertexPositions||t.vertexPositions;for(let m=0;m<n.length;m+=3)d.push(new C(f[n[m]],f[n[m+1]],f[n[m+2]]));const{tangent:p,bitangent:v}=this.getNormalTangentAndBitangent(d),g=[];for(const m of d)g.push(this.flattenVertex(m,p,v));h=nu.triangulateShape(g,[])}else h=[[0,1,2]];for(const[d,f,p]of h)e.vertex.push(t.vertexPositions[n[d*3]]),e.vertex.push(t.vertexPositions[n[d*3+1]]),e.vertex.push(t.vertexPositions[n[d*3+2]]),e.vertex.push(t.vertexPositions[n[f*3]]),e.vertex.push(t.vertexPositions[n[f*3+1]]),e.vertex.push(t.vertexPositions[n[f*3+2]]),e.vertex.push(t.vertexPositions[n[p*3]]),e.vertex.push(t.vertexPositions[n[p*3+1]]),e.vertex.push(t.vertexPositions[n[p*3+2]]),t.skeleton&&(e.vertexWeights.push(l[d*4]),e.vertexWeights.push(l[d*4+1]),e.vertexWeights.push(l[d*4+2]),e.vertexWeights.push(l[d*4+3]),e.vertexWeights.push(l[f*4]),e.vertexWeights.push(l[f*4+1]),e.vertexWeights.push(l[f*4+2]),e.vertexWeights.push(l[f*4+3]),e.vertexWeights.push(l[p*4]),e.vertexWeights.push(l[p*4+1]),e.vertexWeights.push(l[p*4+2]),e.vertexWeights.push(l[p*4+3]),e.weightsIndices.push(c[d*4]),e.weightsIndices.push(c[d*4+1]),e.weightsIndices.push(c[d*4+2]),e.weightsIndices.push(c[d*4+3]),e.weightsIndices.push(c[f*4]),e.weightsIndices.push(c[f*4+1]),e.weightsIndices.push(c[f*4+2]),e.weightsIndices.push(c[f*4+3]),e.weightsIndices.push(c[p*4]),e.weightsIndices.push(c[p*4+1]),e.weightsIndices.push(c[p*4+2]),e.weightsIndices.push(c[p*4+3])),t.color&&(e.colors.push(a[d*3]),e.colors.push(a[d*3+1]),e.colors.push(a[d*3+2]),e.colors.push(a[f*3]),e.colors.push(a[f*3+1]),e.colors.push(a[f*3+2]),e.colors.push(a[p*3]),e.colors.push(a[p*3+1]),e.colors.push(a[p*3+2])),t.material&&t.material.mappingType!=="AllSame"&&(e.materialIndex.push(i),e.materialIndex.push(i),e.materialIndex.push(i)),t.normal&&(e.normal.push(s[d*3]),e.normal.push(s[d*3+1]),e.normal.push(s[d*3+2]),e.normal.push(s[f*3]),e.normal.push(s[f*3+1]),e.normal.push(s[f*3+2]),e.normal.push(s[p*3]),e.normal.push(s[p*3+1]),e.normal.push(s[p*3+2])),t.uv&&t.uv.forEach(function(v,g){e.uvs[g]===void 0&&(e.uvs[g]=[]),e.uvs[g].push(o[g][d*2]),e.uvs[g].push(o[g][d*2+1]),e.uvs[g].push(o[g][f*2]),e.uvs[g].push(o[g][f*2+1]),e.uvs[g].push(o[g][p*2]),e.uvs[g].push(o[g][p*2+1])})}addMorphTargets(e,t,n,i){if(n.length===0)return;e.morphTargetsRelative=!0,e.morphAttributes.position=[];const s=this;n.forEach(function(a){a.rawTargets.forEach(function(o){const l=Je.Objects.Geometry[o.geoID];l!==void 0&&s.genMorphGeometry(e,t,l,i,o.name)})})}genMorphGeometry(e,t,n,i,s){const a=t.Vertices!==void 0?t.Vertices.a:[],o=t.PolygonVertexIndex!==void 0?t.PolygonVertexIndex.a:[],l=n.Vertices!==void 0?n.Vertices.a:[],c=n.Indexes!==void 0?n.Indexes.a:[],u=e.attributes.position.count*3,h=new Float32Array(u);for(let v=0;v<c.length;v++){const g=c[v]*3;h[g]=l[v*3],h[g+1]=l[v*3+1],h[g+2]=l[v*3+2]}const d={vertexIndices:o,vertexPositions:h,baseVertexPositions:a},f=this.genBuffers(d),p=new Ut(f.vertex,3);p.name=s||n.attrName,p.applyMatrix4(i),e.morphAttributes.position.push(p)}parseNormals(e){const t=e.MappingInformationType,n=e.ReferenceInformationType,i=e.Normals.a;let s=[];return n==="IndexToDirect"&&("NormalIndex"in e?s=e.NormalIndex.a:"NormalsIndex"in e&&(s=e.NormalsIndex.a)),{dataSize:3,buffer:i,indices:s,mappingType:t,referenceType:n}}parseUVs(e){const t=e.MappingInformationType,n=e.ReferenceInformationType,i=e.UV.a;let s=[];return n==="IndexToDirect"&&(s=e.UVIndex.a),{dataSize:2,buffer:i,indices:s,mappingType:t,referenceType:n}}parseVertexColors(e){const t=e.MappingInformationType,n=e.ReferenceInformationType,i=e.Colors.a;let s=[];n==="IndexToDirect"&&(s=e.ColorIndex.a);for(let a=0,o=new Ae;a<i.length;a+=4)o.fromArray(i,a),Xe.toWorkingColorSpace(o,at),o.toArray(i,a);return{dataSize:4,buffer:i,indices:s,mappingType:t,referenceType:n}}parseMaterialIndices(e){const t=e.MappingInformationType,n=e.ReferenceInformationType;if(t==="NoMappingInformation")return{dataSize:1,buffer:[0],indices:[0],mappingType:"AllSame",referenceType:n};const i=e.Materials.a,s=[];for(let a=0;a<i.length;++a)s.push(a);return{dataSize:1,buffer:i,indices:s,mappingType:t,referenceType:n}}parseNurbsGeometry(e){const t=parseInt(e.Order);if(isNaN(t))return console.error("THREE.FBXLoader: Invalid Order %s given for geometry ID: %s",e.Order,e.id),new It;const n=t-1,i=e.KnotVector.a,s=[],a=e.Points.a;for(let h=0,d=a.length;h<d;h+=4)s.push(new rt().fromArray(a,h));let o,l;if(e.Form==="Closed")s.push(s[0]);else if(e.Form==="Periodic"){o=n,l=i.length-1-o;for(let h=0;h<n;++h)s.push(s[h])}const u=new U1(n,i,s,o,l).getPoints(s.length*12);return new It().setFromPoints(u)}}class B1{parse(){const e=[],t=this.parseClips();if(t!==void 0)for(const n in t){const i=t[n],s=this.addClip(i);e.push(s)}return e}parseClips(){if(Je.Objects.AnimationCurve===void 0)return;const e=this.parseAnimationCurveNodes();this.parseAnimationCurves(e);const t=this.parseAnimationLayers(e);return this.parseAnimStacks(t)}parseAnimationCurveNodes(){const e=Je.Objects.AnimationCurveNode,t=new Map;for(const n in e){const i=e[n];if(i.attrName.match(/S|R|T|DeformPercent/)!==null){const s={id:i.id,attr:i.attrName,curves:{}};t.set(s.id,s)}}return t}parseAnimationCurves(e){const t=Je.Objects.AnimationCurve;for(const n in t){const i={id:t[n].id,times:t[n].KeyTime.a.map(G1),values:t[n].KeyValueFloat.a},s=Ct.get(i.id);if(s!==void 0){const a=s.parents[0].ID,o=s.parents[0].relationship;o.match(/X/)?e.get(a).curves.x=i:o.match(/Y/)?e.get(a).curves.y=i:o.match(/Z/)?e.get(a).curves.z=i:o.match(/DeformPercent/)&&e.has(a)&&(e.get(a).curves.morph=i)}}}parseAnimationLayers(e){const t=Je.Objects.AnimationLayer,n=new Map;for(const i in t){const s=[],a=Ct.get(parseInt(i));a!==void 0&&(a.children.forEach(function(l,c){if(e.has(l.ID)){const u=e.get(l.ID);if(u.curves.x!==void 0||u.curves.y!==void 0||u.curves.z!==void 0){if(s[c]===void 0){const h=Ct.get(l.ID).parents.filter(function(d){return d.relationship!==void 0})[0].ID;if(h!==void 0){const d=Je.Objects.Model[h.toString()];if(d===void 0){console.warn("THREE.FBXLoader: Encountered a unused curve.",l);return}const f={modelName:d.attrName?ot.sanitizeNodeName(d.attrName):"",ID:d.id,initialPosition:[0,0,0],initialRotation:[0,0,0],initialScale:[1,1,1]};an.traverse(function(p){p.ID===d.id&&(f.transform=p.matrix,p.userData.transformData&&(f.eulerOrder=p.userData.transformData.eulerOrder))}),f.transform||(f.transform=new me),"PreRotation"in d&&(f.preRotation=d.PreRotation.value),"PostRotation"in d&&(f.postRotation=d.PostRotation.value),s[c]=f}}s[c]&&(s[c][u.attr]=u)}else if(u.curves.morph!==void 0){if(s[c]===void 0){const h=Ct.get(l.ID).parents.filter(function(m){return m.relationship!==void 0})[0].ID,d=Ct.get(h).parents[0].ID,f=Ct.get(d).parents[0].ID,p=Ct.get(f).parents[0].ID,v=Je.Objects.Model[p],g={modelName:v.attrName?ot.sanitizeNodeName(v.attrName):"",morphName:Je.Objects.Deformer[h].attrName};s[c]=g}s[c][u.attr]=u}}}),n.set(parseInt(i),s))}return n}parseAnimStacks(e){const t=Je.Objects.AnimationStack,n={};for(const i in t){const s=Ct.get(parseInt(i)).children;s.length>1&&console.warn("THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.");const a=e.get(s[0].ID);n[i]={name:t[i].attrName,layer:a}}return n}addClip(e){let t=[];const n=this;return e.layer.forEach(function(i){t=t.concat(n.generateTracks(i))}),new uo(e.name,-1,t)}generateTracks(e){const t=[];let n=new C,i=new C;if(e.transform&&e.transform.decompose(n,new ht,i),n=n.toArray(),i=i.toArray(),e.T!==void 0&&Object.keys(e.T.curves).length>0){const s=this.generateVectorTrack(e.modelName,e.T.curves,n,"position");s!==void 0&&t.push(s)}if(e.R!==void 0&&Object.keys(e.R.curves).length>0){const s=this.generateRotationTrack(e.modelName,e.R.curves,e.preRotation,e.postRotation,e.eulerOrder);s!==void 0&&t.push(s)}if(e.S!==void 0&&Object.keys(e.S.curves).length>0){const s=this.generateVectorTrack(e.modelName,e.S.curves,i,"scale");s!==void 0&&t.push(s)}if(e.DeformPercent!==void 0){const s=this.generateMorphTrack(e);s!==void 0&&t.push(s)}return t}generateVectorTrack(e,t,n,i){const s=this.getTimesForAllAxes(t),a=this.getKeyframeTrackValues(s,t,n);return new sr(e+"."+i,s,a)}generateRotationTrack(e,t,n,i,s){let a,o;if(t.x!==void 0&&t.y!==void 0&&t.z!==void 0){const d=this.interpolateRotations(t.x,t.y,t.z,s);a=d[0],o=d[1]}const l=Gs(0);n!==void 0&&(n=n.map(jt.degToRad),n.push(l),n=new Bt().fromArray(n),n=new ht().setFromEuler(n)),i!==void 0&&(i=i.map(jt.degToRad),i.push(l),i=new Bt().fromArray(i),i=new ht().setFromEuler(i).invert());const c=new ht,u=new Bt,h=[];if(!o||!a)return new Oi(e+".quaternion",[0],[0]);for(let d=0;d<o.length;d+=3)u.set(o[d],o[d+1],o[d+2],s),c.setFromEuler(u),n!==void 0&&c.premultiply(n),i!==void 0&&c.multiply(i),d>2&&new ht().fromArray(h,(d-3)/3*4).dot(c)<0&&c.set(-c.x,-c.y,-c.z,-c.w),c.toArray(h,d/3*4);return new Oi(e+".quaternion",a,h)}generateMorphTrack(e){const t=e.DeformPercent.curves.morph,n=t.values.map(function(s){return s/100}),i=an.getObjectByName(e.modelName).morphTargetDictionary[e.morphName];return new rr(e.modelName+".morphTargetInfluences["+i+"]",t.times,n)}getTimesForAllAxes(e){let t=[];if(e.x!==void 0&&(t=t.concat(e.x.times)),e.y!==void 0&&(t=t.concat(e.y.times)),e.z!==void 0&&(t=t.concat(e.z.times)),t=t.sort(function(n,i){return n-i}),t.length>1){let n=1,i=t[0];for(let s=1;s<t.length;s++){const a=t[s];a!==i&&(t[n]=a,i=a,n++)}t=t.slice(0,n)}return t}getKeyframeTrackValues(e,t,n){const i=n,s=[];let a=-1,o=-1,l=-1;return e.forEach(function(c){if(t.x&&(a=t.x.times.indexOf(c)),t.y&&(o=t.y.times.indexOf(c)),t.z&&(l=t.z.times.indexOf(c)),a!==-1){const u=t.x.values[a];s.push(u),i[0]=u}else s.push(i[0]);if(o!==-1){const u=t.y.values[o];s.push(u),i[1]=u}else s.push(i[1]);if(l!==-1){const u=t.z.values[l];s.push(u),i[2]=u}else s.push(i[2])}),s}interpolateRotations(e,t,n,i){const s=[],a=[];s.push(e.times[0]),a.push(jt.degToRad(e.values[0])),a.push(jt.degToRad(t.values[0])),a.push(jt.degToRad(n.values[0]));for(let o=1;o<e.values.length;o++){const l=[e.values[o-1],t.values[o-1],n.values[o-1]];if(isNaN(l[0])||isNaN(l[1])||isNaN(l[2]))continue;const c=l.map(jt.degToRad),u=[e.values[o],t.values[o],n.values[o]];if(isNaN(u[0])||isNaN(u[1])||isNaN(u[2]))continue;const h=u.map(jt.degToRad),d=[u[0]-l[0],u[1]-l[1],u[2]-l[2]],f=[Math.abs(d[0]),Math.abs(d[1]),Math.abs(d[2])];if(f[0]>=180||f[1]>=180||f[2]>=180){const v=Math.max(...f)/180,g=new Bt(...c,i),m=new Bt(...h,i),S=new ht().setFromEuler(g),y=new ht().setFromEuler(m);S.dot(y)&&y.set(-y.x,-y.y,-y.z,-y.w);const x=e.times[o-1],P=e.times[o]-x,R=new ht,A=new Bt;for(let I=0;I<1;I+=1/v)R.copy(S.clone().slerp(y.clone(),I)),s.push(x+I*P),A.setFromQuaternion(R,i),a.push(A.x),a.push(A.y),a.push(A.z)}else s.push(e.times[o]),a.push(jt.degToRad(e.values[o])),a.push(jt.degToRad(t.values[o])),a.push(jt.degToRad(n.values[o]))}return[s,a]}}class k1{getPrevNode(){return this.nodeStack[this.currentIndent-2]}getCurrentNode(){return this.nodeStack[this.currentIndent-1]}getCurrentProp(){return this.currentProp}pushStack(e){this.nodeStack.push(e),this.currentIndent+=1}popStack(){this.nodeStack.pop(),this.currentIndent-=1}setCurrentProp(e,t){this.currentProp=e,this.currentPropName=t}parse(e){this.currentIndent=0,this.allNodes=new Kf,this.nodeStack=[],this.currentProp=[],this.currentPropName="";const t=this,n=e.split(/[\r\n]+/);return n.forEach(function(i,s){const a=i.match(/^[\s\t]*;/),o=i.match(/^[\s\t]*$/);if(a||o)return;const l=i.match("^\\t{"+t.currentIndent+"}(\\w+):(.*){",""),c=i.match("^\\t{"+t.currentIndent+"}(\\w+):[\\s\\t\\r\\n](.*)"),u=i.match("^\\t{"+(t.currentIndent-1)+"}}");l?t.parseNodeBegin(i,l):c?t.parseNodeProperty(i,c,n[++s]):u?t.popStack():i.match(/^[^\s\t}]/)&&t.parseNodePropertyContinued(i)}),this.allNodes}parseNodeBegin(e,t){const n=t[1].trim().replace(/^"/,"").replace(/"$/,""),i=t[2].split(",").map(function(l){return l.trim().replace(/^"/,"").replace(/"$/,"")}),s={name:n},a=this.parseNodeAttr(i),o=this.getCurrentNode();this.currentIndent===0?this.allNodes.add(n,s):n in o?(n==="PoseNode"?o.PoseNode.push(s):o[n].id!==void 0&&(o[n]={},o[n][o[n].id]=o[n]),a.id!==""&&(o[n][a.id]=s)):typeof a.id=="number"?(o[n]={},o[n][a.id]=s):n!=="Properties70"&&(n==="PoseNode"?o[n]=[s]:o[n]=s),typeof a.id=="number"&&(s.id=a.id),a.name!==""&&(s.attrName=a.name),a.type!==""&&(s.attrType=a.type),this.pushStack(s)}parseNodeAttr(e){let t=e[0];e[0]!==""&&(t=parseInt(e[0]),isNaN(t)&&(t=e[0]));let n="",i="";return e.length>1&&(n=e[1].replace(/^(\w+)::/,""),i=e[2]),{id:t,name:n,type:i}}parseNodeProperty(e,t,n){let i=t[1].replace(/^"/,"").replace(/"$/,"").trim(),s=t[2].replace(/^"/,"").replace(/"$/,"").trim();i==="Content"&&s===","&&(s=n.replace(/"/g,"").replace(/,$/,"").trim());const a=this.getCurrentNode();if(a.name==="Properties70"){this.parseNodeSpecialProperty(e,i,s);return}if(i==="C"){const l=s.split(",").slice(1),c=parseInt(l[0]),u=parseInt(l[1]);let h=s.split(",").slice(3);h=h.map(function(d){return d.trim().replace(/^"/,"")}),i="connections",s=[c,u],X1(s,h),a[i]===void 0&&(a[i]=[])}i==="Node"&&(a.id=s),i in a&&Array.isArray(a[i])?a[i].push(s):i!=="a"?a[i]=s:a.a=s,this.setCurrentProp(a,i),i==="a"&&s.slice(-1)!==","&&(a.a=Tl(s))}parseNodePropertyContinued(e){const t=this.getCurrentNode();t.a+=e,e.slice(-1)!==","&&(t.a=Tl(t.a))}parseNodeSpecialProperty(e,t,n){const i=n.split('",').map(function(u){return u.trim().replace(/^\"/,"").replace(/\s/,"_")}),s=i[0],a=i[1],o=i[2],l=i[3];let c=i[4];switch(a){case"int":case"enum":case"bool":case"ULongLong":case"double":case"Number":case"FieldOfView":c=parseFloat(c);break;case"Color":case"ColorRGB":case"Vector3D":case"Lcl_Translation":case"Lcl_Rotation":case"Lcl_Scaling":c=Tl(c);break}this.getPrevNode()[s]={type:a,type2:o,flag:l,value:c},this.setCurrentProp(this.getPrevNode(),s)}}class z1{parse(e){const t=new md(e);t.skip(23);const n=t.getUint32();if(n<6400)throw new Error("THREE.FBXLoader: FBX version not supported, FileVersion: "+n);const i=new Kf;for(;!this.endOfContent(t);){const s=this.parseNode(t,n);s!==null&&i.add(s.name,s)}return i}endOfContent(e){return e.size()%16===0?(e.getOffset()+160+16&-16)>=e.size():e.getOffset()+160+16>=e.size()}parseNode(e,t){const n={},i=t>=7500?e.getUint64():e.getUint32(),s=t>=7500?e.getUint64():e.getUint32();t>=7500?e.getUint64():e.getUint32();const a=e.getUint8(),o=e.getString(a);if(i===0)return null;const l=[];for(let d=0;d<s;d++)l.push(this.parseProperty(e));const c=l.length>0?l[0]:"",u=l.length>1?l[1]:"",h=l.length>2?l[2]:"";for(n.singleProperty=s===1&&e.getOffset()===i;i>e.getOffset();){const d=this.parseNode(e,t);d!==null&&this.parseSubNode(o,n,d)}return n.propertyList=l,typeof c=="number"&&(n.id=c),u!==""&&(n.attrName=u),h!==""&&(n.attrType=h),o!==""&&(n.name=o),n}parseSubNode(e,t,n){if(n.singleProperty===!0){const i=n.propertyList[0];Array.isArray(i)?(t[n.name]=n,n.a=i):t[n.name]=i}else if(e==="Connections"&&n.name==="C"){const i=[];n.propertyList.forEach(function(s,a){a!==0&&i.push(s)}),t.connections===void 0&&(t.connections=[]),t.connections.push(i)}else if(n.name==="Properties70")Object.keys(n).forEach(function(s){t[s]=n[s]});else if(e==="Properties70"&&n.name==="P"){let i=n.propertyList[0],s=n.propertyList[1];const a=n.propertyList[2],o=n.propertyList[3];let l;i.indexOf("Lcl ")===0&&(i=i.replace("Lcl ","Lcl_")),s.indexOf("Lcl ")===0&&(s=s.replace("Lcl ","Lcl_")),s==="Color"||s==="ColorRGB"||s==="Vector"||s==="Vector3D"||s.indexOf("Lcl_")===0?l=[n.propertyList[4],n.propertyList[5],n.propertyList[6]]:l=n.propertyList[4],t[i]={type:s,type2:a,flag:o,value:l}}else t[n.name]===void 0?typeof n.id=="number"?(t[n.name]={},t[n.name][n.id]=n):t[n.name]=n:n.name==="PoseNode"?(Array.isArray(t[n.name])||(t[n.name]=[t[n.name]]),t[n.name].push(n)):t[n.name][n.id]===void 0&&(t[n.name][n.id]=n)}parseProperty(e){const t=e.getString(1);let n;switch(t){case"C":return e.getBoolean();case"D":return e.getFloat64();case"F":return e.getFloat32();case"I":return e.getInt32();case"L":return e.getInt64();case"R":return n=e.getUint32(),e.getArrayBuffer(n);case"S":return n=e.getUint32(),e.getString(n);case"Y":return e.getInt16();case"b":case"c":case"d":case"f":case"i":case"l":const i=e.getUint32(),s=e.getUint32(),a=e.getUint32();if(s===0)switch(t){case"b":case"c":return e.getBooleanArray(i);case"d":return e.getFloat64Array(i);case"f":return e.getFloat32Array(i);case"i":return e.getInt32Array(i);case"l":return e.getInt64Array(i)}const o=T1(new Uint8Array(e.getArrayBuffer(a))),l=new md(o.buffer);switch(t){case"b":case"c":return l.getBooleanArray(i);case"d":return l.getFloat64Array(i);case"f":return l.getFloat32Array(i);case"i":return l.getInt32Array(i);case"l":return l.getInt64Array(i)}break;default:throw new Error("THREE.FBXLoader: Unknown property type "+t)}}}class md{constructor(e,t){this.dv=new DataView(e),this.offset=0,this.littleEndian=t!==void 0?t:!0,this._textDecoder=new TextDecoder}getOffset(){return this.offset}size(){return this.dv.buffer.byteLength}skip(e){this.offset+=e}getBoolean(){return(this.getUint8()&1)===1}getBooleanArray(e){const t=[];for(let n=0;n<e;n++)t.push(this.getBoolean());return t}getUint8(){const e=this.dv.getUint8(this.offset);return this.offset+=1,e}getInt16(){const e=this.dv.getInt16(this.offset,this.littleEndian);return this.offset+=2,e}getInt32(){const e=this.dv.getInt32(this.offset,this.littleEndian);return this.offset+=4,e}getInt32Array(e){const t=[];for(let n=0;n<e;n++)t.push(this.getInt32());return t}getUint32(){const e=this.dv.getUint32(this.offset,this.littleEndian);return this.offset+=4,e}getInt64(){let e,t;return this.littleEndian?(e=this.getUint32(),t=this.getUint32()):(t=this.getUint32(),e=this.getUint32()),t&2147483648?(t=~t&4294967295,e=~e&4294967295,e===4294967295&&(t=t+1&4294967295),e=e+1&4294967295,-(t*4294967296+e)):t*4294967296+e}getInt64Array(e){const t=[];for(let n=0;n<e;n++)t.push(this.getInt64());return t}getUint64(){let e,t;return this.littleEndian?(e=this.getUint32(),t=this.getUint32()):(t=this.getUint32(),e=this.getUint32()),t*4294967296+e}getFloat32(){const e=this.dv.getFloat32(this.offset,this.littleEndian);return this.offset+=4,e}getFloat32Array(e){const t=[];for(let n=0;n<e;n++)t.push(this.getFloat32());return t}getFloat64(){const e=this.dv.getFloat64(this.offset,this.littleEndian);return this.offset+=8,e}getFloat64Array(e){const t=[];for(let n=0;n<e;n++)t.push(this.getFloat64());return t}getArrayBuffer(e){const t=this.dv.buffer.slice(this.offset,this.offset+e);return this.offset+=e,t}getString(e){const t=this.offset;let n=new Uint8Array(this.dv.buffer,t,e);this.skip(e);const i=n.indexOf(0);return i>=0&&(n=new Uint8Array(this.dv.buffer,t,i)),this._textDecoder.decode(n)}}class Kf{add(e,t){this[e]=t}}function V1(r){const e="Kaydara FBX Binary  \0";return r.byteLength>=e.length&&e===$f(r,0,e.length)}function H1(r){const e=["K","a","y","d","a","r","a","\\","F","B","X","\\","B","i","n","a","r","y","\\","\\"];let t=0;function n(i){const s=r[i-1];return r=r.slice(t+i),t++,s}for(let i=0;i<e.length;++i)if(n(1)===e[i])return!1;return!0}function gd(r){const e=/FBXVersion: (\d+)/,t=r.match(e);if(t)return parseInt(t[1]);throw new Error("THREE.FBXLoader: Cannot find the version number for the file given.")}function G1(r){return r/46186158e3}const W1=[];function Wa(r,e,t,n){let i;switch(n.mappingType){case"ByPolygonVertex":i=r;break;case"ByPolygon":i=e;break;case"ByVertice":i=t;break;case"AllSame":i=n.indices[0];break;default:console.warn("THREE.FBXLoader: unknown attribute mapping type "+n.mappingType)}n.referenceType==="IndexToDirect"&&(i=n.indices[i]);const s=i*n.dataSize,a=s+n.dataSize;return j1(W1,n.buffer,s,a)}const bl=new Bt,Ir=new C;function Zf(r){const e=new me,t=new me,n=new me,i=new me,s=new me,a=new me,o=new me,l=new me,c=new me,u=new me,h=new me,d=new me,f=r.inheritType?r.inheritType:0;r.translation&&e.setPosition(Ir.fromArray(r.translation));const p=Gs(0);if(r.preRotation){const M=r.preRotation.map(jt.degToRad);M.push(p),t.makeRotationFromEuler(bl.fromArray(M))}if(r.rotation){const M=r.rotation.map(jt.degToRad);M.push(r.eulerOrder||p),n.makeRotationFromEuler(bl.fromArray(M))}if(r.postRotation){const M=r.postRotation.map(jt.degToRad);M.push(p),i.makeRotationFromEuler(bl.fromArray(M)),i.invert()}r.scale&&s.scale(Ir.fromArray(r.scale)),r.scalingOffset&&o.setPosition(Ir.fromArray(r.scalingOffset)),r.scalingPivot&&a.setPosition(Ir.fromArray(r.scalingPivot)),r.rotationOffset&&l.setPosition(Ir.fromArray(r.rotationOffset)),r.rotationPivot&&c.setPosition(Ir.fromArray(r.rotationPivot)),r.parentMatrixWorld&&(h.copy(r.parentMatrix),u.copy(r.parentMatrixWorld));const v=t.clone().multiply(n).multiply(i),g=new me;g.extractRotation(u);const m=new me;m.copyPosition(u);const S=m.clone().invert().multiply(u),y=g.clone().invert().multiply(S),x=s,P=new me;if(f===0)P.copy(g).multiply(v).multiply(y).multiply(x);else if(f===1)P.copy(g).multiply(y).multiply(v).multiply(x);else{const L=new me().scale(new C().setFromMatrixScale(h)).clone().invert(),U=y.clone().multiply(L);P.copy(g).multiply(v).multiply(U).multiply(x)}const R=c.clone().invert(),A=a.clone().invert();let I=e.clone().multiply(l).multiply(c).multiply(t).multiply(n).multiply(i).multiply(R).multiply(o).multiply(a).multiply(s).multiply(A);const T=new me().copyPosition(I),_=u.clone().multiply(T);return d.copyPosition(_),I=d.clone().multiply(P),I.premultiply(u.invert()),I}function Gs(r){r=r||0;const e=["ZYX","YZX","XZY","ZXY","YXZ","XYZ"];return r===6?(console.warn("THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect."),e[0]):e[r]}function Tl(r){return r.split(",").map(function(t){return parseFloat(t)})}function $f(r,e,t){return e===void 0&&(e=0),t===void 0&&(t=r.byteLength),new TextDecoder().decode(new Uint8Array(r,e,t))}function X1(r,e){for(let t=0,n=r.length,i=e.length;t<i;t++,n++)r[n]=e[t]}function j1(r,e,t,n){for(let i=t,s=0;i<n;i++,s++)r[s]=e[i];return r}const El={chest:"Chest/Styles/Shoulders",arms:"Arms/Nude",legs:"Legs/Styles/Pants",forearm:"Hands/Forearm",feet:"Feet/Feet",head:"Head/Bald",neck:"Head/Neck"},q1=["idle","run","walk","slash","hurt","death"],Y1={head:"Head",chest:"Chest",hands:"Hands",legs:"Legs",feet:"Feet",back:"Back"},K1={head:"Helmet",chest:"Chestplate",hands:"Gauntlets",legs:"Leggings",feet:"Boots"},Z1=["Short","Long","Shaggy","Pomp","Middle Part","Buns","Sideswept","Liberty Spikes"],fu=new WeakSet;function $1(r){return fu.add(r),r}const Dc=new WeakMap,As=new WeakMap,Lc=new WeakMap;function Jf(r){var n;const e=Dc.get(r);if(!e)return;Dc.delete(r),fu.delete(e);const t=As.get(e)-1;t?As.set(e,t):(As.delete(e),e.dispose(),(n=Lc.get(e))==null||n.delete(e),Lc.delete(e))}function Qf(r,e){const t=r.skeleton;let n;for(const i of e)if(i.bones.length===t.bones.length&&i.bones.every((s,a)=>s===t.bones[a]&&i.boneInverses[a].equals(t.boneInverses[a]))){n=i;break}n?n!==t&&t.dispose():(n=t,e.add(n),Lc.set(n,e)),r.skeleton=n,Dc.set(r,n),As.set(n,(As.get(n)||0)+1)}function wl(r,e=new Set){const t=Bf(r);return t.traverse(n=>{n.isSkinnedMesh&&Qf(n,e)}),t}function ar(r,e){var t;(t=e==null?void 0:e.stopAllAction)==null||t.call(e),e!=null&&e.getRoot&&e.uncacheRoot(e.getRoot()),r.removeFromParent(),r.traverse(n=>{Jf(n);for(const i of[n,n.skeleton,n.geometry,...[].concat(n.material||[])])i&&fu.delete(i)&&i.dispose()})}function J1(r,e){const t=new Set(e),n=new Map;let i=!1;function s(a){if(a=!!a,a!==i)if(i=a,a)r.traverse(o=>{o.isMesh&&(n.set(o,o.visible),o.visible=o.visible&&t.has(o))});else{for(const[o,l]of n)o.visible=l;n.clear()}}return{set:s,get active(){return i}}}async function Q1(r,e,t=[]){const n=new N1,i={},s=new WeakMap,a=_=>String(_).replace(/^mixamorig[:_]?/,"");if(await Promise.all(q1.map(async _=>{try{const M=await n.loadAsync(e(`anim/${_}.fbx`));if(M.animations[0]){M.animations[0].name=_,i[_]=M.animations[0];const L=new Map;M.traverse(U=>{U.isBone&&L.set(a(U.name),U.quaternion.clone())}),s.set(i[_],L)}}catch(M){console.warn("anim failed",_,M)}})),!i.idle)throw new Error("character animations missing");const o=new WeakMap;function l(_){if(o.has(_))return o.get(_);_.updateMatrixWorld(!0);const M=new Xt().setFromObject(_,!0),L=M.getSize(new C),U=[0,1,2].sort((K,$)=>L.getComponent($)-L.getComponent(K)),N=U[0],F=U[2],k=new C;k.setComponent(N,Math.abs(M.max.getComponent(N))>=Math.abs(M.min.getComponent(N))?1:-1);const W=new C;W.setComponent(F,1);const V={tip:k,thin:W};return o.set(_,V),V}const c=_=>e("models/playerCharacter/"+_.split("/").map(encodeURIComponent).join("/")+".glb"),u=new Map;async function h(_){if(u.has(_))return u.get(_);let M=null;try{M=await r(c(_))}catch{M=null}return u.set(_,M),M}const d=(_,M)=>`${Y1[_]}/Clothing/${M}`,f=[...Object.values(El),...Z1.map(_=>`Head/Styles/${_}`),...t];await Promise.all(f.map(h));const p=u.get(El.chest);if(!p)throw new Error("character base missing");const v=new Map,g=new Map;p.scene.updateMatrixWorld(!0),p.scene.traverse(_=>{_.isBone&&(v.set(a(_.name),_.quaternion.clone()),g.set(_.name,_))});const m=i,S=(_,M)=>{const L=$1(_.clone()),U=_.name||"";return U==="SKIN_TOP"?L.color.set(M.skin):U==="Hair.Color"?L.color.set(M.hair):/^Color/.test(U)&&M.cloth!=null&&L.color.set(M.cloth),L},y=(_,M)=>{_.material=Array.isArray(_.material)?_.material.map(L=>S(L,M)):S(_.material,M)},x=_=>{const M=_("Hips"),L=_("HeadTop_End"),U=_("LeftArm"),N=_("RightArm"),F=L.clone().sub(M),k=F.length()||1;F.normalize();const W=U.clone().sub(N);W.addScaledVector(F,-W.dot(F)).normalize();const V=new C().crossVectors(W,F).normalize();return{m:new me().makeBasis(W,F,V).setPosition(M),len:k}};function P(_,M,L,U,N){const F=wl(L.scene),k=[];F.updateMatrixWorld(!0),F.traverse(J=>{J.isSkinnedMesh&&k.push(J)});const W=new Map;F.traverse(J=>{J.isBone&&W.set(J.name,J)});const V=J=>new C().setFromMatrixPosition(W.get(`mixamorig_${J}`).matrixWorld),K=J=>new C().setFromMatrixPosition(_.get(`mixamorig_${J}`));let $=new me;try{const J=x(V),oe=x(K),Re=oe.len/J.len;$=oe.m.clone().multiply(new me().makeScale(Re,Re,Re)).multiply(J.m.clone().invert())}catch{$=new me}for(const J of k){const oe=J.skeleton.bones.map(ne=>ne.name),Re=oe.map(ne=>M.get(ne)||J.skeleton.bones[oe.indexOf(ne)]),j=oe.map(ne=>_.get(ne)?_.get(ne).clone().invert():new me);Jf(J),J.bind(new Ys(Re,j),$.clone().multiply(J.bindMatrix)),Qf(J,N),J.frustumCulled=!1,U&&y(J,U),J.position.set(0,0,0),J.quaternion.identity(),J.scale.set(1,1,1),J.updateMatrix(),J.parent&&J.parent.remove(J)}return k}function R(_={}){const M=new Set,L=wl(p.scene,M);L.updateMatrixWorld(!0);const U=new Map,N=new Map;L.traverse(Q=>{Q.isBone&&(U.set(Q.name,Q),N.set(Q.name,Q.matrixWorld.clone()))});const F=_.skin??14658187,k=_.shirt??12159557,W=_.pants??4869987,V=_.hairColor??7029795,K={},$={hair:[],armor:[]},J=[];L.traverse(Q=>{Q.isSkinnedMesh&&J.push(Q)});for(const Q of J)Q.frustumCulled=!1,y(Q,{skin:F,hair:V,cloth:k});K.chest=J;const oe=Q=>{for(const ye of Q)L.add(ye);return Q},Re=(Q,ye)=>{const D=u.get(El[Q]);K[Q]=D?oe(P(N,U,D,{skin:F,hair:V,cloth:ye},M)):[]};Re("arms",k),Re("legs",W),Re("forearm",k),Re("feet",W),Re("head",k),Re("neck",k);const j=new Yt,ne=new Yt;ne.rotation.x=-Math.PI/2,ne.add(L),j.add(ne);const ue=new Sc(L),ee={};for(const Q of Object.keys(m))ee[Q]=ue.clipAction(m[Q]);ee.idle.play();let ve="idle";ue.update(0),j.updateMatrixWorld(!0);{const Q=new Xt().setFromObject(j,!0),ye=Q.getSize(new C),D=ye.y>.01?(_.h||1.6)/ye.y:1;ne.scale.setScalar(D),ne.position.set(-(Q.min.x+Q.max.x)/2*D,-Q.min.y*D,-(Q.min.z+Q.max.z)/2*D)}for(const Q of["slash","hurt"])ee[Q]&&(ee[Q].setLoop(Kd,1),ee[Q].clampWhenFinished=!1);ee.slash&&(ee.slash.timeScale=Math.max(1,ee.slash.getClip().duration/.45));const Te=J1(j,[...K.arms,...K.forearm]),X={root:j,master:L,mixer:ue,spec:_,yaw0:0,setFirstPerson:Te.set,setMoving(Q,ye=1){const D=Q?"run":"idle";D!==ve&&ee[D]&&(ee[D].reset().fadeIn(.15).play(),ee[ve]&&ee[ve].fadeOut(.15),ve=D),ee.run&&(ee.run.timeScale=ye)},play(Q){ee[Q]&&ee[Q].reset().setEffectiveWeight(1).fadeIn(.05).play()},setArmor(Q={}){const ye=Te.active,D={};Te.set(!1);for(const fe of $.armor)ar(fe);$.armor=[];for(const fe of Object.keys(K1).concat("back")){const ae=Q[fe];if(!ae)continue;const le=u.get(d(fe,ae));if(!le){console.warn("armor missing",fe,ae);continue}const Se=P(N,U,le,null,M);if(Se.length||console.warn("armor has no skinned meshes",fe,ae),$.armor.push(...oe(Se)),Se.length&&(D[fe]=!0),typeof location<"u"&&location.search.includes("dbgarmor")){j.updateMatrixWorld(!0);for(const w of Se){const b=new Xt().setFromObject(w,!0),G=b.getSize(new C),ie=b.getCenter(new C);console.warn("ARMOR",fe,ae,w.name,"size",G.x.toFixed(2),G.y.toFixed(2),G.z.toFixed(2),"center",ie.x.toFixed(2),ie.y.toFixed(2),ie.z.toFixed(2),"vis",w.visible,"mat",w.material&&w.material.type,"tr",w.material&&w.material.transparent,"op",w.material&&w.material.opacity)}const de=new Xt().setFromObject(j,!0).getSize(new C);console.warn("ROOT size",de.x.toFixed(2),de.y.toFixed(2),de.z.toFixed(2))}}const _e=(fe,ae)=>fe&&fe.forEach(le=>{le.visible=ae});_e(K.chest,!D.chest),_e(K.arms,!D.chest),_e(K.legs,!D.legs),_e(K.forearm,!D.hands),_e(K.feet,!D.feet),_e($.hair,!D.head),$.hair.length&&_e(K.head,!!D.head),Te.set(ye)}};if(_.hair&&u.get(`Head/Styles/${_.hair}`)){$.hair=oe(P(N,U,u.get(`Head/Styles/${_.hair}`),{skin:F,hair:V,cloth:k},M));for(const Q of K.head)Q.visible=!1}X.setArmor(_.armor||{});const Le=[];X.setHeld=(Q={})=>{for(const ye of Le)ar(ye);Le.length=0,j.updateMatrixWorld(!0);for(const ye of["Right","Left"]){const D=ye.toLowerCase(),_e=Q[D],fe=U.get(`mixamorig_${ye}Hand`);if(!_e||!fe)continue;const ae=_e.scene.clone(!0);ae.traverse(G=>{G.frustumCulled=!1,G.isMesh&&(G.castShadow=!0)});const le=new C;fe.getWorldScale(le);const Se=new Yt;Se.scale.setScalar(ne.scale.x/(le.x||1)*(Q[D+"Scale"]||1)),Se.add(ae);const de=Q[D+"Aim"],w=X.handFrame&&X.handFrame[ye],b=Q[D+"Fix"];if(b)Se.position.set(...b.offset),Se.scale.set(...b.scale.map(G=>G*(Q[D+"Scale"]||1))),Se.rotation.set(...b.rotation);else if(de&&w){const G=l(_e.scene),ie=ce=>new C().addScaledVector(w.F,ce[0]).addScaledVector(w.U,ce[1]).addScaledVector(w.O,ce[2]),re=ie(de.tip).normalize(),te=ie(de.thin);te.addScaledVector(re,-te.dot(re)).normalize();const Pe=G.tip.clone().multiplyScalar(de.flip?-1:1),ge=G.thin.clone().multiplyScalar(de.thinSign||1),be=new me().makeBasis(Pe,ge,Pe.clone().cross(ge)),Ye=new me().makeBasis(re,te,re.clone().cross(te));Se.quaternion.setFromRotationMatrix(Ye.multiply(be.transpose())),w.palm&&Se.position.copy(w.palm)}else Q[D+"Rot"]&&Se.rotation.set(...Q[D+"Rot"]);fe.add(Se),Le.push(Se)}};try{ue.update(0),L.updateMatrixWorld(!0);const Q=new C,ye=new C;let D=0,_e=0;for(const fe of["Left","Right"]){const ae=U.get(`mixamorig_${fe}Foot`),le=U.get(`mixamorig_${fe}ToeBase`);ae&&le&&(ae.getWorldPosition(Q),le.getWorldPosition(ye),D+=ye.x-Q.x,_e+=ye.z-Q.z)}X.yaw0=Math.hypot(D,_e)>1e-5?Math.atan2(D,_e):0}catch{X.yaw0=0}try{j.updateMatrixWorld(!0);const Q=new C(Math.sin(X.yaw0),0,Math.cos(X.yaw0)),ye=new C(0,1,0),D=Q.clone().cross(ye);X.handFrame={};for(const _e of["Right","Left"]){const fe=U.get(`mixamorig_${_e}Hand`);if(!fe)continue;const ae=fe.getWorldQuaternion(new ht).invert(),le=fe.children.find(de=>de.isBone),Se=le?le.position.length()*.5:0;X.handFrame[_e]={F:Q.clone().applyQuaternion(ae),U:ye.clone().applyQuaternion(ae),O:(_e==="Right"?D:D.clone().negate()).applyQuaternion(ae),palm:Se?new C(0,Se,0):null}}}catch{X.handFrame=null}return X}const A=new WeakMap;function I(_,M,L=!1){const U=M.get("mixamorig_Hips"),N=_&&_.tracks.find(ee=>/Hips\.position$/.test(ee.name));if(!U||!N)return _;const F=U.position.clone(),k=new C(N.values[0],N.values[1],N.values[2]);if(!(F.length()>0&&k.length()>0))return _;const W=F.length()/k.length(),V=F.normalize().dot(k.normalize());if(!L&&W>.5&&W<2&&V>.7)return _;const K=L==="hips";let $=A.get(_);if($||A.set(_,$=new WeakMap),$.has(U))return $.get(U);const J=K?s.get(_)||new Map:v,oe=_.clone(),Re=new ht,j=new ht,ne=ee=>new ht().setFromRotationMatrix(x(ve=>ee.get("mixamorig_"+ve).getWorldPosition(new C)).m),ue=K?null:ne(g).multiply(ne(M).invert());oe.tracks=oe.tracks.filter(ee=>!/\.position$/.test(ee.name));for(const ee of oe.tracks){if(!/\.quaternion$/.test(ee.name))continue;const ve=a(ee.name.replace(/\.quaternion$/,"")),Te=M.get("mixamorig_"+ve),X=J.get(ve);if(!Te||!X||K&&ve!=="Hips")continue;j.copy(X).invert();const Le=Te.quaternion,Q=K?null:g.get("mixamorig_"+ve).getWorldQuaternion(new ht).invert().multiply(ue).multiply(Te.getWorldQuaternion(new ht)),ye=Q?Le.clone().multiply(Q.clone().invert()).multiply(j):null;for(let D=0;D<ee.values.length;D+=4)Re.fromArray(ee.values,D),Q?Re.premultiply(ye).multiply(Q):Re.premultiply(j).premultiply(Le),Re.toArray(ee.values,D)}return $.set(U,oe),oe}function T(_,M=1.6,L="walk",{zUp:U=!1,fromRest:N=!1}={}){const F=wl(_.scene),k=new Map;F.traverse(ue=>{ue.frustumCulled=!1,ue.isBone&&(/^mixamorig(?!_)/.test(ue.name)&&(ue.name=ue.name.replace(/^mixamorig:?/,"mixamorig_")),k.set(ue.name,ue))});const W=new Yt,V=new Yt;V.add(F),W.add(V),W.updateMatrixWorld(!0);const K=new Sc(F);K.clipAction(I(i[L]||i.run||i.idle,k,N)).play(),K.update(0),W.updateMatrixWorld(!0);const $=k.get("mixamorig_Hips"),J=k.get("mixamorig_HeadTop_End")||k.get("mixamorig_Head");if(U)V.rotation.x=-Math.PI/2,W.updateMatrixWorld(!0);else if($&&J){const ue=k.get("mixamorig_LeftFoot"),ee=k.get("mixamorig_RightFoot"),ve=ue&&ee?ue.getWorldPosition(new C).add(ee.getWorldPosition(new C)).multiplyScalar(.5):$.getWorldPosition(new C),Te=J.getWorldPosition(new C).sub(ve).normalize();V.quaternion.setFromUnitVectors(Te,new C(0,1,0)),W.updateMatrixWorld(!0)}const oe=new Xt().setFromObject(W,!0),Re=oe.getSize(new C),j=Re.y>1e-4?M/Re.y:1;V.scale.setScalar(j),V.position.set(-(oe.min.x+oe.max.x)/2*j,-oe.min.y*j,-(oe.min.z+oe.max.z)/2*j),W.updateMatrixWorld(!0);let ne=0;try{const ue=new C,ee=new C;let ve=0,Te=0;for(const X of["Left","Right"]){const Le=k.get(`mixamorig_${X}Foot`),Q=k.get(`mixamorig_${X}ToeBase`);Le&&Q&&(Le.getWorldPosition(ue),Q.getWorldPosition(ee),ve+=ee.x-ue.x,Te+=ee.z-ue.z)}ne=Math.hypot(ve,Te)>1e-6?Math.atan2(ve,Te):0}catch{ne=0}return{root:W,inner:F,mixer:K,kit:{yaw0:ne}}}return{build:R,load:h,animate:T,isLoaded:_=>!!u.get(_),clothingPath:d,hasHair:_=>!!u.get(`Head/Styles/${_}`)}}const eM=[{id:"1",name:"Tuner",file:"racers/karts/01-Tuner-Stock-White.glb"},{id:"2",name:"Racer",file:"racers/karts/02-Racer-Stock-White.glb"},{id:"3",name:"Formula",file:"racers/karts/03-Formula-Stock-White.glb"},{id:"4",name:"Rookie",file:"racers/karts/04-Rookie-Stock-White.glb"},{id:"5",name:"2CV",file:"racers/karts/05-2CV-Stock-White.glb"},{id:"6",name:"Dingo",file:"racers/karts/06-Dingo-Stock-White.glb"},{id:"7",name:"GoKart",file:"racers/karts/07-GoKart-Stock-White.glb"},{id:"8",name:"Lemans",file:"racers/karts/08-Lemans-Stock-White.glb"},{id:"9",name:"Semi",file:"racers/karts/09-Semi-Stock-White.glb"},{id:"10",name:"Eagle",file:"racers/karts/10-Eagle-Stock-White.glb"},{id:"11",name:"Forklift",file:"racers/karts/11-Forklift-Stock-White.glb"},{id:"12",name:"Bus",file:"racers/karts/12-Bus-Stock-White.glb"},{id:"13",name:"Hotrod",file:"racers/karts/13-Hotrod-Stock-White.glb"},{id:"14",name:"Merc",file:"racers/karts/14-Merc-Stock-White.glb"}],Ni=[...eM,{id:"miata",name:"Miata",file:"racers/cars/miata.glb"}],ep=new WeakMap,tM=new C(0,1,0),nM=new ht;function pu(r,e){const t=r.scene.clone(!0);if(t.traverse(m=>{m.isMesh&&(m.castShadow=!0,m.receiveShadow=!0)}),e.id==="miata")return t.traverse(m=>{(/LOD2|_source|hardtop|popup_open|:open/.test(m.name)||/^softtop_(?!folded)/.test(m.name))&&(m.visible=!1)}),t.userData.vehicleId=e.id,t;const n=new Yt,i=new Xt().setFromObject(t,!0),s=i.getSize(new C),a=i.getCenter(new C),o=Math.min(1.65/s.x,3.6/s.z);t.scale.multiplyScalar(o),t.position.set(-a.x*o,-i.min.y*o,-a.z*o),n.add(t),n.updateMatrixWorld(!0);const l=(m,S)=>{const y=new dt;y.name=m,y.position.copy(n.worldToLocal(S)),n.add(y)},c=t.getObjectByName("Seat_Mount"),u=t.getObjectByName("Racer_Steering");if(!c||!u)throw Error("Kart is missing its seat or steering mount");const h=new Xt().setFromObject(c,!0),d=h.getCenter(new C);d.y=h.min.y+h.getSize(new C).y*.22,l("seat_driver",d);const f=new Xt().setFromObject(u,!0),p=f.getCenter(new C),v=f.getSize(new C).x*.35;l("hand_wheel_L",p.clone().add(new C(v,0,0))),l("hand_wheel_R",p.clone().add(new C(-v,0,0)));const g=[];for(const m of["FL","FR","BL","BR"]){const S=t.getObjectByName("Wheel_"+m);if(!S)throw Error("Kart is missing wheel "+m);const y=new Xt().setFromObject(S,!0).getSize(new C).y/2,x=new Yt;x.add(...S.children),S.add(x),g.push({mount:S,spin:x,base:S.quaternion.clone(),front:m.startsWith("F"),sign:m.endsWith("R")?-1:1,radius:y})}return ep.set(n,g),n.userData.vehicleId=e.id,n}function tp(r,e,t){const n=ep.get(r);if(n){for(const i of n)i.mount.quaternion.copy(i.base),i.front&&i.mount.quaternion.multiply(nM.setFromAxisAngle(tM,-e.steer*.4)),i.spin.rotation.x+=e.speed*t/i.radius*i.sign;return}for(const i of["wheel_FL","wheel_FR"]){const s=r.getObjectByName(i);s&&(s.rotation.y=-e.steer*.4)}for(const i of["wheel_FL_LOD1","wheel_FR_LOD1","wheel_RL_LOD1","wheel_RR_LOD1"]){const s=r.getObjectByName(i);s&&(s.rotation.x+=e.speed*t/.2888)}}const np=(r=711)=>({t:0,hp:100,kills:0,mobs:[],spawn:0,nextId:1,seed:r>>>0||711,over:!1});function vd(r){let e=r.seed;return e^=e<<13,e^=e>>>17,e^=e<<5,r.seed=e>>>0,r.seed/4294967296}function iM(r,e,t){const n=t.x-e.x,i=t.z-e.z,s=n*n+i*i,a=s?Math.max(0,Math.min(1,((r.x-e.x)*n+(r.z-e.z)*i)/s)):0;return Math.hypot(r.x-e.x-n*a,r.z-e.z-i*a)}function rM(r,e,t,n,i,s=t.speed){if(r.over||!Number.isFinite(n)||n<=0||n>.1)return;if(r.t+=n,r.spawn-=n,r.spawn<=0&&(r.spawn=Math.max(.35,1.2-r.t/180),r.mobs.length<40))for(let l=0;l<8;l++){const c=vd(r)*Math.PI*2,u=15+vd(r)*10,h=t.x+Math.sin(c)*u,d=t.z+Math.cos(c)*u;if(i(h,d,0)){r.mobs.push({id:r.nextId++,x:h,z:d});break}}const a=[],o=2.2+Math.min(3,r.t/120);for(const l of r.mobs){const c=t.x-l.x,u=t.z-l.z,h=Math.hypot(c,u),d=h?Math.min(o*n,h)/h:0,f=l.x+c*d,p=l.z+u*d,v=Math.atan2(c,u);if(i(f,p,v)?(l.x=f,l.z=p):i(f,l.z,v)?l.x=f:i(l.x,p,v)&&(l.z=p),iM(l,e,t)<1.65){if(Math.abs(s)>=4){r.kills++;continue}r.hp=Math.max(0,r.hp-12*n)}a.push(l)}r.mobs=a,r.over=r.hp===0}const mu={KeyW:"throttle",ArrowUp:"throttle",KeyS:"brake",ArrowDown:"brake",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",Space:"handbrake"};function sM(r,e){const t=[...r].map(i=>mu[i]).concat([...e.values()]),n=i=>t.includes(i);return{throttle:+n("throttle"),brake:+n("brake"),steer:+n("right")-+n("left"),handbrake:+n("handbrake")}}function on(r){const e=Math.round(r*100);return`${Math.floor(e/6e3)}:${(e%6e3/100).toFixed(2).padStart(5,"0")}`}function Xa(r,e,t,n,i){if(r.remaining=Math.max(0,r.remaining-i),n.kills>e.kills)r.kind="ram",r.text=`RAM +${n.kills-e.kills}`;else if(n.hp<e.hp)r.kind="damage",r.text="HORDE DAMAGE · Keep moving!";else if(t.hit&&!e.hit)r.kind="wall",r.text="WALL HIT · Reverse and steer clear.";else return;r.remaining=.8}function aM(r,e){return r.speed<-.5?"reverse":Math.abs(r.speed)>3&&Math.abs(r.slip||0)>.025?"drift":r.speed>1&&(e.brake||e.handbrake)?"brake":""}const O=r=>document.getElementById(r),Ot=O("panel"),ip=O("panel-title"),rp=O("panel-body"),qt=new R_({canvas:O("game"),antialias:!1,powerPreference:"high-performance"});qt.setPixelRatio(Math.min(devicePixelRatio,1.5));qt.outputColorSpace=at;qt.toneMapping=Fc;qt.toneMappingExposure=1.15;const sp=qt.getContext(),xd=sp.getExtension("WEBGL_debug_renderer_info"),ap=xd&&/SwiftShader|llvmpipe/i.test(sp.getParameter(xd.UNMASKED_RENDERER_WEBGL));let Al=0;qt.shadowMap.enabled=!0;qt.shadowMap.type=Rd;const op=matchMedia("(prefers-reduced-motion: reduce)"),cn=new P_;cn.background=new Ae(10143720);cn.fog=new $c(10143720,48,110);const Bi=ly(qt.getPixelRatio());cn.add(Bi.markMesh,Bi.dustMesh);let _d=null,Cl=[];const yd=[new C,new C],lp=new d5(13428223,6844743,2);cn.add(lp);const $n=new ru(16773323,2.6);$n.position.set(365,80,320);$n.castShadow=!0;$n.shadow.mapSize.set(1024,1024);Object.assign($n.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:120});$n.shadow.bias=-3e-4;cn.add($n,$n.target);const Rt=new Qt(57,1,.06,140),Lr=new C,Gt=sy();let di=null,Et,Cs="greentown";const Jn=K5();Jn.play("menu");for(const r of["pointerdown","pointerup","click","touchend","keydown"])window.addEventListener(r,e=>Jn.unlock(e.isTrusted),{capture:!0});const mo=O("view");function gu(){Gt.firstPerson=!Gt.firstPerson,uu(Gt),Rt.fov=Gt.firstPerson?72:57,Rt.updateProjectionMatrix(),mo.textContent=Gt.firstPerson?"Chase view":"Driver view",mo.setAttribute("aria-pressed",String(Gt.firstPerson)),ze&&Su(!0)}mo.onclick=()=>{gu(),mo.blur()};O("game").addEventListener("pointerdown",r=>{r.pointerType!=="mouse"||!xt||r.button!==1||!lt&&Ot.dataset.view!=="setup"||(r.preventDefault(),di={id:r.pointerId,x:r.clientX,y:r.clientY},r.currentTarget.setPointerCapture(r.pointerId))});O("game").addEventListener("pointermove",r=>{!di||di.id!==r.pointerId||(Nf(Gt,r.clientX-di.x,r.clientY-di.y,!Ot.hidden),di.x=r.clientX,di.y=r.clientY)});O("game").addEventListener("auxclick",r=>{r.button===1&&r.preventDefault()});for(const r of["pointerup","pointercancel","lostpointercapture"])O("game").addEventListener(r,()=>di=null);let ze,Ve,Be=Ro(tn.start.x,tn.start.z,tn.start.yaw),tt=ns(),lt=!1,xt=!1,fi=null;try{fi=Uf(localStorage)}catch{}try{const r=Uf(localStorage,J5);r!==null&&(O("previous-best").textContent="Previous handling · World Circuit best "+on(r)+". New surface handling has a separate record.")}catch{}const cp=new URLSearchParams(location.search),Uc=cp.get("room"),Dr=Co.test(Uc||"")?"online":cp.get("mode");let he=Dr==="hub"?"hub":Dr==="online"?"online":Dr==="versus"?"versus":Dr==="survivors"?"survivors":Dr==="race"?"race":Dr==="free"?"free":"hub",Lt=np(),Fi,Nt;const Rs=[],Wr=[],gn=[];O("free-start").replaceChildren(...Rc.map(r=>{const e=document.createElement("option");return e.value=r.id,e.textContent=r.name,e}));let Rl=0;const or=()=>O("driver-outfit").value;O("settings").onclick=()=>{Et&&(zi(),bp(Et,Jn))};for(const[r,e]of[["vehicle-prev",-1],["vehicle-next",1]])O(r).onclick=()=>{const t=O("vehicle-choice");t.disabled||(t.selectedIndex=(t.selectedIndex+e+Ni.length)%Ni.length,t.dispatchEvent(new Event("change")))};O("driver-outfit").onchange=()=>{if(!xt||lt||he==="online")return;const r=Vs(Fi,ze,or());ar(gn[0].root,gn[0].mixer),gn[0]=r,he==="hub"&&st.state.connected&&st.appearance({name:O("hub-name").value.trim(),kart:ze.userData.vehicleId,outfit:or()})};O("vehicle-choice").replaceChildren(...Ni.map(r=>{const e=document.createElement("option");return e.value=r.id,e.textContent=(r.id==="miata"?"":"CrashOut · ")+r.name,e}));const up=()=>Rc.find(r=>r.id===O("free-start").value)||Rc[0],na=new Set;let go=!1,Wn={remaining:0,kind:"",text:""};const vo=new Map;function zi(){di=null,na.clear(),vo.clear(),document.querySelectorAll(".held").forEach(r=>r.classList.remove("held"))}O("updates").onclick=()=>{zi(),Sp()};function vu(){const r=[O("start"),O("online-ready"),O("online-create"),O("freemode"),O("configure")].find(e=>!e.disabled&&!e.hidden&&e.offsetParent);r&&r.focus()}function vn(r,e,t="Resume lap",n="setup"){go=na.has("Space"),lt=!1,zi(),Bi.clear(),document.body.classList.remove("driving"),Ot.dataset.view=n,Ot.setAttribute("aria-modal",String(n==="pause")),O("setup").hidden=n==="pause"||!xt,O("configure").hidden=n!=="pause",Ot.hidden=!1,ip.textContent=r,rp.textContent=e,O("start").textContent=t,O("panel-actions").hidden=!1,O("loading").hidden=!0,vu(),O("raceresults").hidden=!(he==="versus"&&tt.finished),O("raceresults").hidden||O("raceresults").replaceChildren(...du(Be,tt,Nt.opponents,tn).map(i=>{const s=document.createElement("li");return s.textContent=i.name+" · "+(i.finished?on(i.time):"On course"),s}))}function $r(){he==="online"&&Qe.neutral(),he==="hub"&&st.neutral(),xt&&lt&&vn("Take a breather",he==="hub"?"The public hub keeps running. Your controls are released.":he==="online"?"The online race keeps running. Your controls are released; return when ready.":"Your run is paused. Return when you’re ready.",he==="survivors"||he==="free"?"Keep driving":"Resume lap","pause")}function xu(){if(!(he==="online"&&Qe.state.room||he==="hub")){if(he==="versus")Nt=s1(tn),Be=Nt.player,tt=Nt.race;else{const r=he==="survivors"?zf:he==="free"?up():tn.start;Be=Ro(r.x,r.z,r.yaw),tt=ns(),Nt=null}Bi.clear(),Lt=np(),Wn={remaining:0,kind:"",text:""},Hn=0,zi();for(const r of Rs)r.root.visible=!1;Su(!0),mp(),gp()}}O("start").onclick=()=>{var r,e,t;if(xt){if(he==="hub"&&!st.state.connected){_u();return}he==="online"&&!["countdown","racing"].includes((r=Qe.state.room)==null?void 0:r.phase)||((t=(e=document.activeElement)==null?void 0:e.blur)==null||t.call(e),(he==="survivors"?Lt.over:tt.finished)&&xu(),Ot.hidden=!0,lt=!0,document.body.classList.add("driving"),he==="hub"&&(document.querySelector("#hub-chat details").open=!1),Cs=Be.z<210?"apache":"greentown",Jn.play(Cs),Ws=performance.now())}};O("restart").onclick=()=>{var r,e;!xt||he==="online"||he==="hub"||((e=(r=document.activeElement)==null?void 0:r.blur)==null||e.call(r),xu(),Ot.hidden=!0,lt=!0,document.body.classList.add("driving"),Ws=performance.now())};function Mi(r){if(!xt)return;he==="online"&&r!=="online"&&Qe.leave(),he==="hub"&&r!=="hub"&&st.leave(),r!==he&&(yu(),r==="hub"&&(tt=ns())),he=r,Ot.dataset.mode=he,xu(),O("start").disabled=O("restart").disabled=!xt,O("online-panel").hidden=he!=="online",O("restart").hidden=he==="online"||he==="hub",O("start").hidden=!1;const e=he==="survivors",t=he==="versus",n=he==="free";O("free-area").hidden=!n;for(const[i,s]of[["hubmode","hub"],["onlinemode","online"],["freemode","free"],["racemode","race"],["survivalmode","survivors"],["versusmode","versus"]])O(i).setAttribute("aria-pressed",String(s===he));O("mode-label").textContent=he==="hub"?"PUBLIC DRIVING HUB":he==="online"?"ONLINE WORLD RACE":n?"FREE DRIVE · SANKOQUEST WORLD":e?"SURVIVORS · SANKOQUEST WORLD":t?"WORLD RACE · GUARD & PRIEST":"WORLD CIRCUIT",vn(he==="hub"?"Sanko Racers":he==="online"?"Race your friends":n?"Free Drive":e?"Survive the traffic":t?"Race the locals":"World Circuit",he==="hub"?"Meet other drivers in the shared world. Open chat to choose your name. Cars do not block each other.":n?"Explore the whole native world without a horde or a finish line. Choose a starting area; solid walls and water still stop the car.":e?"Start south of Greentown and explore the whole world. Ram the horde at speed; slow contact damages your car.":t?"Race the Guard and Priest around the World Circuit. A shared countdown starts the race. Rivals do not block your car.":"A closed circuit through the northern and western roads, beyond Greentown. Follow the gold gates in order.",he==="hub"?"Enter the public hub":n?"Go for a drive":e?"Drive to survive":t?"Start NPC race":he==="online"?"Return to race":"Drive the circuit"),O("hub-chat").hidden=he!=="hub",O("driver-outfit").disabled=he==="online",Jn.play("menu"),he==="hub"&&(st.state.connected||_u(),Io()),he==="online"&&lr()}O("onlinemode").onclick=()=>{xt&&(Mi("online"),vn("Race your friends","Create a private room, share its invite, and ready up.","Return to race"),lr())};O("configure").onclick=()=>{vn("Modes & vehicle","Choosing a mode or vehicle starts a new drive.","Resume drive"),he==="online"&&lr()};O("hubmode").onclick=()=>Mi("hub");O("freemode").onclick=()=>Mi("free");O("free-start").onchange=()=>{he==="free"&&(Mi("free"),O("free-start").focus())};O("versusmode").onclick=()=>Mi("versus");O("racemode").onclick=()=>Mi("race");O("survivalmode").onclick=()=>Mi("survivors");O("pause").onclick=()=>lt?$r():xt&&O("start").click();window.addEventListener("keydown",r=>{var e,t,n,i;if(!((e=O("updates-dialog"))!=null&&e.open||(t=O("settings-dialog"))!=null&&t.open)&&!((i=(n=r.target).matches)!=null&&i.call(n,"input,select,option,textarea"))){if(!lt&&r.code==="Space"){r.repeat?r.preventDefault():go=!1;return}if(mu[r.code]&&(r.preventDefault(),lt&&na.add(r.code)),!r.repeat){if(he==="hub"&&lt&&["Enter","KeyT"].includes(r.code)){r.preventDefault(),zi(),st.neutral(),document.querySelector("#hub-chat details").open=!0,O("chat-input").focus();return}r.code==="Escape"&&(r.preventDefault(),lt?$r():xt&&O("start").click()),r.code==="KeyV"&&xt&&(r.preventDefault(),gu()),r.code==="KeyC"&&xt&&(r.preventDefault(),uu(Gt)),r.code==="KeyR"&&xt&&(r.preventDefault(),O("restart").click())}}});window.addEventListener("keyup",r=>{r.code==="Space"&&go&&(r.preventDefault(),go=!1),mu[r.code]&&(lt&&r.preventDefault(),na.delete(r.code))});window.addEventListener("blur",$r);document.addEventListener("visibilitychange",()=>{document.hidden&&$r(),Jn.pause(document.hidden)});for(const r of document.querySelectorAll("[data-action]")){r.addEventListener("pointerdown",t=>{t.preventDefault(),lt&&(r.setPointerCapture(t.pointerId),vo.set(t.pointerId,r.dataset.action),r.classList.add("held"))});const e=t=>{vo.delete(t.pointerId),r.classList.remove("held")};for(const t of["pointerup","pointercancel","lostpointercapture"])r.addEventListener(t,e)}const oM=iy();let Mn={input:{throttle:0,brake:0,steer:0,handbrake:0}};function Ji(){const r=sM(na,vo),e=Mn.input;return{throttle:Math.max(r.throttle,e.throttle),brake:Math.max(r.brake,e.brake),steer:Math.abs(r.steer)>=Math.abs(e.steer)?r.steer:e.steer,handbrake:Math.max(r.handbrake,e.handbrake)}}function lM(r){var o,l,c;if(Mn=oM.poll(r,!document.hidden&&document.hasFocus()),Mn.lost&&lt&&$r(),!xt||!Mn.connected)return;const e=Mn.pressed,t=document.querySelector("dialog[open]");if(e.back||e.pause){t?t.close():lt?$r():(e.pause||Ot.dataset.view==="pause")&&O("start").click();return}if(e.view&&gu(),e.recenter&&uu(Gt),lt){(Mn.look.x||Mn.look.y)&&Nf(Gt,Mn.look.x*250*r,Mn.look.y*250*r);return}const n=t||Ot,i=document.activeElement,{x:s,y:a}=Mn.direction;if(s&&(i!=null&&i.matches("select,input[type=range]"))&&n.contains(i)){if(i.tagName==="SELECT"){const u=Math.max(0,Math.min(i.options.length-1,i.selectedIndex+s));u!==i.selectedIndex&&(i.selectedIndex=u,i.dispatchEvent(new Event("change")))}else i.value=String(Math.max(Number(i.min),Math.min(Number(i.max),Number(i.value)+s*5))),i.dispatchEvent(new Event("input"));return}if(s||a){const u=[...n.querySelectorAll("button,select,input,summary,a[href]")].filter(g=>!g.disabled&&g.getClientRects().length&&getComputedStyle(g).visibility!=="hidden"&&!g.closest("details:not([open]) > :not(summary)")),h=i==null?void 0:i.getBoundingClientRect(),d=h?h.x+h.width/2:0,f=h?h.y+h.height/2:0;let p,v=1/0;for(const g of u){if(g===i)continue;const m=g.getBoundingClientRect(),S=m.x+m.width/2-d,y=m.y+m.height/2-f,x=s?S*s:y*a;if(x<=2)continue;const P=x+Math.abs(s?y:S)*3;P<v&&(v=P,p=g)}(o=p||u[0])==null||o.focus(),(c=(l=document.activeElement)==null?void 0:l.scrollIntoView)==null||c.call(l,{block:"nearest"})}e.confirm&&(n.contains(document.activeElement)?document.activeElement.matches("select,input")||document.activeElement.click():vu())}let ja=null,qa=!1,Qi="",no=0;const Xn=new Map,Ms=new Set,Ss=new Map;let Md="",xo="Driver";const st=ny(()=>{he==="hub"&&Io()});function _u(){const r=O("hub-name").value.trim();if(!Qs(r)){O("hub-status").textContent="Use a name of 1–16 characters.";return}xo=r,Qe.leave(),st.connect({name:r,kart:ze.userData.vehicleId,outfit:or()})}O("hub-connect").onclick=()=>{xt&&_u()};O("hub-name").onchange=()=>{const r=O("hub-name").value.trim();Qs(r)&&(xo=r),xt&&st.state.connected&&st.appearance({name:xo,kart:ze.userData.vehicleId,outfit:or()})};O("chat-input").onfocus=()=>{zi(),st.neutral()};O("chat-input").onkeydown=r=>{r.code==="Escape"&&(r.preventDefault(),r.stopPropagation(),r.target.blur())};O("chat-form").onsubmit=r=>{r.preventDefault();const e=O("chat-input").value.trim();if(!e){O("chat-input").blur();return}st.sendChat(e)&&(O("chat-input").value="",O("chat-input").blur())};function Io(){const r=st.state;O("hub-status").textContent=r.status,O("hub-summary").textContent="Public hub · "+r.players.length+" / 16",O("hub-connect").hidden=r.connected,O("hub-name").disabled=lt,O("chat-send").disabled=!r.connected,O("start").disabled=!xt||r.connected&&!r.car||r.status==="Connecting to the public hub…",r.connected?Ot.dataset.view==="setup"&&(O("start").textContent="Enter the public hub"):O("start").textContent="Reconnect hub";const e=r.messages.map(t=>t.id).join(",");if(e!==Md){Md=e;const t=O("chat-messages"),n=t.scrollHeight-t.scrollTop-t.clientHeight<30;t.replaceChildren(...r.messages.map(i=>{const s=document.createElement("p");return s.textContent=i.name+": "+i.text,s})),n&&(t.scrollTop=t.scrollHeight)}r.connected&&xt&&ze&&st.appearance({name:xo,kart:ze.userData.vehicleId,outfit:or()}),r.car&&dp({players:r.players}),r.connected||(yu(),lt&&(vn("Hub disconnected",r.status,"Return to hub"),Io()))}const Qe=ry(()=>{he==="online"&&lr()});Co.test(Uc||"")&&(O("online-code").value=Uc);function lr(){const r=Qe.state,e=r.room,t=e==null?void 0:e.players.find(i=>i.id===r.id),n=e&&["countdown","racing"].includes(e.phase);if(O("online-status").textContent=Qi||(t!=null&&t.ready&&!n?"Ready. Press Ready again to change your kart.":r.status),O("online-join").hidden=!!e,O("online-room").hidden=!e,O("online-name").disabled=!!e,O("vehicle-choice").disabled=!xt||!!n||!!(t!=null&&t.ready),O("start").disabled=!xt||!n,O("start").hidden=!n,O("restart").hidden=!0,!e){const i=ja!==null;ja=null,yu(),i&&vn("Race room closed",r.status,"Return to race"),Sd();return}O("online-code-label").textContent="Room: "+e.room,O("online-roster").replaceChildren(...e.players.map(i=>{const s=document.createElement("li");return s.textContent=i.name+(i.id===e.host?" (host)":"")+" · "+(i.dnf?"Disconnected":i.race.finished?on(i.race.time):i.ready?"Ready":"Choosing"),s})),O("online-ready").disabled=!xt||!!n||r.closed,O("online-ready").textContent=t.ready?"Ready ✓":"Ready",O("online-ready").setAttribute("aria-pressed",String(t.ready)),O("online-start").hidden=e.host!==r.id,O("online-start").textContent=e.phase==="ended"?"Race again":"Start race",O("online-start").disabled=r.closed||!!n||e.players.length<2||e.players.some(i=>!i.ready),e.phase!==ja&&(ja=e.phase,e.phase==="countdown"&&(qa=!1,zi(),Bi.clear(),Be=r.car,tt=t.race,Ot.hidden=!0,lt=!0,document.body.classList.add("driving"),Hn=0,Ws=performance.now()),e.phase==="ended"&&(vn(t.race.finished?"Race finished":"Race interrupted",e.message||"Ready up for another race.","Return to race"),bd(e))),t.race.finished&&!qa&&e.phase==="racing"&&(qa=!0,vn("You finished",on(t.race.time)+" · Other racers have sixty seconds to finish.","Watch the finish")),qa&&!Ot.hidden&&bd(e),Ot.hidden||Sd(),dp(e)}function Sd(){(!document.activeElement||document.activeElement.disabled||!document.activeElement.offsetParent)&&vu()}function bd(r){O("raceresults").hidden=!1,O("raceresults").replaceChildren(...[...r.players].sort((e,t)=>Number(t.race.finished)-Number(e.race.finished)||e.race.time-t.race.time).map(e=>{const t=document.createElement("li");return t.textContent=e.name+" · "+(e.race.finished?on(e.race.time):e.dnf||r.phase==="ended"?"Did not finish":"On course"),t}))}function hp(r){const e=O("online-name").value.trim(),t=O("online-code").value.trim();if(Qi="",!Qs(e)||r==="join"&&!Co.test(t)){O("online-status").textContent="Use a name of 1–16 characters and the exact 16-character invite code.";return}st.leave(),Qe.connect(r,e,ze.userData.vehicleId,t)}O("online-create").onclick=()=>hp("create");O("online-connect").onclick=()=>hp("join");O("online-ready").onclick=()=>{var e;Qi="";const r=(e=Qe.state.room)==null?void 0:e.players.find(t=>t.id===Qe.state.id);r&&Qe.ready(!r.ready,ze.userData.vehicleId)};O("online-start").onclick=()=>Qe.start();O("online-leave").onclick=()=>{Qi="",Qe.leave(),vn("Race your friends","Create or join another room.","Return to race"),lr()};O("online-copy").onclick=async()=>{var t;const r=(t=Qe.state.room)==null?void 0:t.room;if(!r)return;const e=new URL(location.href);e.search="",e.hash="",e.searchParams.set("mode","online"),e.searchParams.set("room",r);try{await navigator.clipboard.writeText(e.href),Qi="Invite copied. Send it to your friends."}catch{Qi="Copy this invite: "+e.href}O("online-status").textContent=Qi};function yu(){no++;for(const{vehicle:r,actor:e,label:t}of Xn.values())ar(e.root,e.mixer),t.material.map.dispose(),t.material.dispose(),r.removeFromParent();Xn.clear(),Ms.clear(),Ss.clear()}function dp(r){const e=he==="hub"?st.state.id:Qe.state.id,t=new Set(r.players.filter(n=>n.id!==e&&!n.gone).map(n=>n.id));for(const n of Ss.keys())t.has(n)||Ss.delete(n);for(const[n,i]of Xn)t.has(n)||(ar(i.actor.root,i.actor.mixer),i.label.material.map.dispose(),i.label.material.dispose(),i.vehicle.removeFromParent(),Xn.delete(n));for(const n of r.players){if(n.id===e||n.gone)continue;const i=Xn.get(n.id);if((Ss.get(n.id)||0)>performance.now()||(i==null?void 0:i.kart)===n.kart&&(i==null?void 0:i.outfit)===(n.outfit||"casual")&&(i==null?void 0:i.name)===n.name||Ms.has(n.id))continue;i&&(ar(i.actor.root,i.actor.mixer),i.label.material.map.dispose(),i.label.material.dispose(),i.vehicle.removeFromParent(),Xn.delete(n.id));const s=no;Ms.add(n.id);const a=Ni.find(o=>o.id===n.kart);if(!a){Ms.delete(n.id);continue}Ve.loadGLB(Sn(a.file)).then(o=>{var p,v;const l=(v=he==="hub"?st.state.players:(p=Qe.state.room)==null?void 0:p.players)==null?void 0:v.find(g=>g.id===n.id);if(!["online","hub"].includes(he)||s!==no||(l==null?void 0:l.kart)!==n.kart||(l==null?void 0:l.outfit)!==n.outfit||(l==null?void 0:l.name)!==n.name)return;const c=pu(o,a),u=Vs(Fi,c,n.outfit||"casual"),h=document.createElement("canvas");h.width=256,h.height=64;const d=h.getContext("2d");d.font="bold 28px sans-serif",d.textAlign="center",d.lineWidth=6,d.strokeStyle="#14271b",d.fillStyle="#fff4cc",d.strokeText(n.name,128,42,248),d.fillText(n.name,128,42,248);const f=new Jc(new Eo({map:new eu(h)}));f.position.y=2.2,f.scale.set(2,.5,1),c.add(f),c.visible=!1,cn.add(c),Xn.set(n.id,{vehicle:c,actor:u,label:f,kart:n.kart,outfit:n.outfit||"casual",name:n.name,pose:{...l.car}})}).catch(()=>{Ss.set(n.id,performance.now()+2e3),O(he==="hub"?"hub-status":"online-status").textContent="A rival model could not load; retrying."}).finally(()=>{s===no&&Ms.delete(n.id)})}}function Td(r){const e=he==="hub"?{players:st.state.players}:Qe.state.room;if(!(!["online","hub"].includes(he)||!e))for(const t of e.players){const n=Xn.get(t.id);if(!n)continue;const i=1-Math.exp(-r*15);n.pose.x+=(t.car.x-n.pose.x)*i,n.pose.z+=(t.car.z-n.pose.z)*i,n.pose.yaw+=Math.atan2(Math.sin(t.car.yaw-n.pose.yaw),Math.cos(t.car.yaw-n.pose.yaw))*i,n.vehicle.visible=Math.hypot(n.pose.x-Be.x,n.pose.z-Be.z)>2,Mu(n.vehicle,n.pose),tp(n.vehicle,t.car,r)}}window.addEventListener("pagehide",()=>{Qe.leave(),st.leave(),Jn.dispose()});const Vn=tn.gates.map((r,e)=>{const t=new Yt,n=new Ks({color:16108630,emissive:7491852,emissiveIntensity:.3});for(const l of[-1,1]){const c=new Ft(new tu(.09,.15,2.8,7),n);c.position.set(r.nz*r.width/2*l,1.4,-r.nx*r.width/2*l),t.add(c)}const i=new Ft(new Jr(r.width,.15,.15),n);i.position.y=2.8,i.rotation.y=Math.atan2(r.nx,r.nz),t.add(i);const s=document.createElement("canvas");s.width=s.height=128;const a=s.getContext("2d");a.fillStyle="#182c20",a.beginPath(),a.arc(64,64,58,0,Math.PI*2),a.fill(),a.strokeStyle="#f5cc56",a.lineWidth=5,a.stroke(),a.fillStyle="#fff4bb",a.font="bold 70px sans-serif",a.textAlign="center",a.textBaseline="middle",a.fillText(e===tn.gates.length-1?"★":String(e+1),64,65);const o=new Jc(new Eo({map:new eu(s),depthTest:!1}));return o.position.y=3.8,o.scale.set(1.25,1.25,1.25),t.add(o),t.position.set(r.x,0,r.z),cn.add(t),t});function Mu(r,e){const t=Ve.collision.ground,n=t(e.x+Math.sin(e.yaw)*1.13,e.z+Math.cos(e.yaw)*1.13),i=t(e.x-Math.sin(e.yaw)*1.13,e.z-Math.cos(e.yaw)*1.13),s=t(e.x+Math.cos(e.yaw)*.7,e.z-Math.sin(e.yaw)*.7),a=t(e.x-Math.cos(e.yaw)*.7,e.z+Math.sin(e.yaw)*.7);r.position.set(e.x,(n+i+s+a)/4+.025,e.z),r.rotation.set(Math.atan2(i-n,2.26),e.yaw,Math.atan2(s-a,1.4),"YXZ")}function Su(r=!1){if(!ze)return;const e=hu(Be,he==="online"?Qe.state.correction:he==="hub"?st.state.correction:null);Mu(ze,e),r&&fp(0,!0)}function fp(r,e=!1){const t=hu(Be,he==="online"?Qe.state.correction:he==="hub"?st.state.correction:null),n=!Ot.hidden,i=Gt.firstPerson&&!n,s=oy(t.speed,op.matches||(Et==null?void 0:Et.getSettings().fx)==="reduced"),a=i?72:n?57:s.fov;if(gn[0].setFirstPerson(i),Math.abs(Rt.fov-a)>.05&&(Rt.fov=a,Rt.updateProjectionMatrix()),i){ze.updateMatrixWorld(!0);const o=ze.getObjectByName("seat_driver"),l=gn[0].master.getObjectByName("mixamorig_Head"),c=l?l.getWorldPosition(new C).add(new C(Math.sin(t.yaw)*.06,.12,Math.cos(t.yaw)*.06)):o?o.getWorldPosition(new C).add(new C(0,.82,0)):ze.localToWorld(new C(0,1.2,0)),u=ze.getObjectByName("hand_wheel_L");u&&(c.y=Math.max(c.y,u.getWorldPosition(new C).y+.55)),c.x-=Math.sin(t.yaw)*.45,c.z-=Math.cos(t.yaw)*.45,Rt.position.copy(c);const h=ay({...Gt,pitch:Gt.pitch-.16},t.yaw);Lr.set(c.x+h.x*10,c.y+h.y*10,c.z+h.z*10)}else{const o=t.yaw+Gt.yaw,l=n?5.8:s.distance,c=n?2.6:s.height,u=n?0:s.ahead,h=new C(t.x-Math.sin(o)*l*Math.cos(Gt.pitch),ze.position.y+c+Math.sin(Gt.pitch)*l,t.z-Math.cos(o)*l*Math.cos(Gt.pitch));h.y=Math.max(h.y,Ve.collision.ground(h.x,h.z)+1.3);const d=new C(t.x+Math.sin(t.yaw-(t.slip||0))*u,ze.position.y+.65,t.z+Math.cos(t.yaw-(t.slip||0))*u);e||Rt.position.distanceToSquared(h)>100?(Rt.position.copy(h),Lr.copy(d)):(Rt.position.lerp(h,1-Math.exp(-r*6)),Lr.lerp(d,1-Math.exp(-r*9)));const f=new C(t.x,ze.position.y+.65,t.z);Ve.cameraCollision.resolve(f,Rt.position)&&Lr.copy(f)}Rt.lookAt(Lr)}let Ps=!0,Ed=!0;const pp=()=>Ps=!0;window.addEventListener("resize",pp);new ResizeObserver(pp).observe(document.querySelector(".panel-inner"));function cM(r,e){if(Ed!==Ot.hidden&&(Ed=Ot.hidden,Ps=!0),!!Ps)if(Ps=!1,!Ot.hidden&&r>=760){const t=document.querySelector(".panel-inner").getBoundingClientRect();Rt.setViewOffset(r,e,-(t.right+Math.max(0,t.left))/2,0,r,e)}else if(!Ot.hidden&&e>=600){const t=document.querySelector(".panel-inner").getBoundingClientRect();Rt.setViewOffset(r,e,0,(e-t.top)/2,r,e)}else Rt.clearViewOffset()}function uM(r){var e;if(ze!==_d&&(_d=ze,Bi.clear(),Cl=[ze.getObjectByName("Wheel_BL")||ze.getObjectByName("wheel_RL"),ze.getObjectByName("Wheel_BR")||ze.getObjectByName("wheel_RR")]),!(!lt||he==="online"&&((e=Qe.state.room)==null?void 0:e.phase)!=="racing")){ze.updateMatrixWorld(!0);for(let t=0;t<2;t++){const n=yd[t];Cl[t]?Cl[t].getWorldPosition(n):n.copy(ze.position),n.y=Ve.collision.ground(n.x,n.z)}Bi.update(Be,Ji(),yd,r,op.matches||(Et==null?void 0:Et.getSettings().fx)==="reduced")}}function mp(){for(let r=0;r<Wr.length;r++)Wr[r].visible=he==="versus",he==="versus"&&Mu(Wr[r],Nt.opponents[r].car)}function gp(){const r=aM(Be,Ji());if(O("speed").dataset.act=r,O("drive-state").textContent=r.toUpperCase(),O("surface-state").textContent=((Ve==null?void 0:Ve.collision.surfaceAt(Be.x,Be.z))||"ground").toUpperCase(),O("best").parentElement.hidden=he==="free"||he==="hub",he==="online"){const s=Qe.state.room,a=s==null?void 0:s.players.find(l=>l.id===Qe.state.id);O("health-label").textContent="ONLINE",O("health").textContent=s?s.players.length+" / 4":"—",O("time").textContent=on((a==null?void 0:a.race.time)||0),O("best-label").textContent="GATES",O("best").textContent=((a==null?void 0:a.race.next)||0)+" / "+Vn.length,O("crowd-label").textContent="ROOM",O("gates").textContent=(s==null?void 0:s.phase)||"LOBBY",O("speed").firstElementChild.textContent=String(Math.round(Math.abs(Be.speed)*3.6)),O("guide").textContent=Be.hit?"Brake, reverse, then steer clear.":Qe.state.status;const o=(s==null?void 0:s.phase)==="countdown"?String(Math.max(1,Math.ceil(s.countdown))):"";O("racecountdown").hidden=!o,O("racecountdown").textContent=o,O("rivalhud").hidden=!s,s&&(O("rivalhud").textContent=s.players.map(l=>l.name+" · "+(l.race.finished?"✓":l.race.next+"/"+Vn.length)).join(`
`)),Vn.forEach((l,c)=>l.visible=!!a&&c>=a.race.next&&c<=a.race.next+1);return}const e=Wn.remaining>0,t=he==="versus";O("guide").dataset.impact=e?Wn.kind:"",O("rivalhud").hidden=!t;const n=t&&lt?Nt.countdown>0?String(Math.ceil(Nt.countdown)):tt.time<.8?"GO!":"":"";if(O("racecountdown").hidden=!n,O("racecountdown").textContent!==n&&(O("racecountdown").textContent=n),he==="hub"){O("health-label").textContent="HUB",O("health").textContent=st.state.players.length+" / 16",O("time").textContent=on(tt.time),O("crowd-label").textContent="MAP",O("gates").textContent="WORLD",O("guide").textContent=Be.hit?"Brake, reverse, then steer clear.":"Enter / T to chat · Space to drift",O("speed").firstElementChild.textContent=String(Math.round(Math.abs(Be.speed)*3.6)),O("rivalhud").hidden=!0,O("racecountdown").hidden=!0,Vn.forEach(s=>s.visible=!1);return}if(he==="free"){O("health-label").textContent="MODE",O("health").textContent="FREE DRIVE",O("time").textContent=on(tt.time),O("crowd-label").textContent="MAP",O("gates").textContent="WORLD",O("guide").textContent=e?Wn.text:Be.hit?"Brake, reverse, then steer clear.":"Explore freely · Space / Drift for handbrake",O("speed").firstElementChild.textContent=String(Math.round(Math.abs(Be.speed)*3.6)),Vn.forEach(s=>s.visible=!1);return}if(he==="survivors"){O("health-label").textContent="CAR HP",O("health").textContent=String(Math.ceil(Lt.hp)),O("time").textContent=on(Lt.t),O("best-label").textContent="SLAIN",O("best").textContent=String(Lt.kills),O("crowd-label").textContent="HORDE",O("gates").textContent=String(Lt.mobs.length),O("guide").textContent=e?Wn.text:Be.hit?"Reverse out! The horde is coming.":"Keep moving · ram above 15 km/h",O("speed").firstElementChild.textContent=String(Math.round(Math.abs(Be.speed)*3.6)),Vn.forEach(s=>s.visible=!1);return}if(O("health-label").textContent="LAP",O("health").textContent="1 / 1",O("best-label").textContent="BEST",O("crowd-label").textContent="GATES",t){const s=du(Be,tt,Nt.opponents,tn);O("best-label").textContent="POSITION",O("best").textContent=s.find(a=>a.id==="you").place+" / 3",O("rivalhud").textContent=s.map(a=>a.place+". "+a.name+(a.finished?" ✓":"")).join(`
`)}else O("best").textContent=fi===null?"—":on(fi);O("time").textContent=on(tt.time),O("gates").textContent=`${tt.next} / ${Vn.length}`,O("speed").firstElementChild.textContent=String(Math.round(Math.abs(Be.speed)*3.6));const i=tn.gates[tt.next];O("guide").textContent=t&&Nt.countdown>0?"Get ready · Guard & Priest":e?Wn.text:Be.hit?"Brake, reverse, then steer clear.":tt.started?i?`Gate ${tt.next+1} · ${Math.round(Math.hypot(i.x-Be.x,i.z-Be.z))} m`:"Lap complete":"Accelerate to start your lap.",Vn.forEach((s,a)=>{s.visible=a>=tt.next&&a<=tt.next+1,s.scale.setScalar(a===tt.next?1:.75)})}const hM=O("map"),dM=hM.getContext("2d");function fM(){var a;const r=dM;r.fillStyle="#152c21",r.fillRect(0,0,200,240);const e=Math.min(184/(et.maxX-et.minX),208/(et.maxZ-et.minZ)),t=(200-(et.maxX-et.minX)*e)/2,n=8,i=(o,l)=>[t+(o-et.minX)*e,n+(l-et.minZ)*e];if(r.strokeStyle="#827c55",r.lineWidth=1,r.strokeRect(t,n,(et.maxX-et.minX)*e,(et.maxZ-et.minZ)*e),Ve!=null&&Ve.overview&&r.drawImage(Ve.overview,t,n,(et.maxX-et.minX)*e,(et.maxZ-et.minZ)*e),r.lineWidth=2,r.strokeStyle="#aab57e",r.beginPath(),["free","hub"].includes(he)||tn.route.forEach(([o,l],c)=>{const u=i(o,l);c?r.lineTo(...u):r.moveTo(...u)}),r.stroke(),he==="survivors")for(const o of Lt.mobs){const l=i(o.x,o.z);r.fillStyle="#ff775f",r.beginPath(),r.arc(...l,2,0,Math.PI*2),r.fill()}else if(!["free","hub"].includes(he)){if(he==="online")for(const o of((a=Qe.state.room)==null?void 0:a.players)||[]){const l=i(o.car.x,o.car.z);r.fillStyle="#78b5ff",r.fillRect(l[0]-2,l[1]-2,4,4)}if(he==="versus")for(const o of Nt.opponents){const l=i(o.car.x,o.car.z);r.fillStyle=o.id==="guard"?"#78b5ff":"#fff1c9",r.beginPath(),r.arc(...l,3,0,Math.PI*2),r.fill()}tn.gates.forEach((o,l)=>{const c=i(o.x,o.z);r.fillStyle=l<tt.next?"#53775c":l===tt.next?"#ffe583":"#b9bd89",r.beginPath(),r.arc(...c,l===tt.next?5:3,0,Math.PI*2),r.fill()})}if(he==="hub")for(const o of st.state.players){if(o.id===st.state.id)continue;const l=i(o.car.x,o.car.z);r.fillStyle="#78b5ff",r.fillRect(l[0]-2,l[1]-2,4,4)}const s=i(Be.x,Be.z);r.save(),r.translate(...s),r.rotate(-Be.yaw),r.fillStyle="#fff",r.beginPath(),r.moveTo(0,7),r.lineTo(-5,-5),r.lineTo(5,-5),r.closePath(),r.fill(),r.restore(),r.fillStyle="#e5e9bc",r.font="9px sans-serif",r.fillText("SANKOQUEST WORLD",10,230)}async function pM(){Ve=await e1(cn,e=>O("loading").textContent=e),Et=Y5({renderer:qt,scene:cn,camera:Rt,sun:$n,hemi:lp,world:Ve,software:ap}),Et.resize(innerWidth,innerHeight),O("loading").textContent="Seating your driver",await Promise.all(fd.map(e=>Ve.loadGLB(Sn("models/playerCharacter/"+e+".glb")))),Fi=await Q1(Ve.loadGLB,e=>"/assets/"+e,fd);const r=await Promise.all([Ni[0],Ni[1],Ni[3]].map(async e=>pu(await Ve.loadGLB(Sn(e.file)),e)));ze=r[0],cn.add(ze),gn.push(Vs(Fi,ze));for(let e=0;e<Hs.length;e++){const t=Hs[e],n=r[e+1];cn.add(n),gn.push(Vs(Fi,n,to[t.id])),n.visible=!1;const i=document.createElement("canvas");i.width=256,i.height=64;const s=i.getContext("2d");s.font="bold 32px sans-serif",s.textAlign="center",s.fillStyle="#fff4cc",s.strokeStyle="#14271b",s.lineWidth=7,s.strokeText(t.name,128,44),s.fillText(t.name,128,44);const a=new Jc(new Eo({map:new eu(i)}));a.position.y=2.2,a.scale.set(2,.5,1),n.add(a),Wr.push(n)}O("vehicle-choice").value=ze.userData.vehicleId,O("vehicle-choice").disabled=!1;for(let e=0;e<Vn.length;e++)Vn[e].position.y=Ve.collision.ground(tn.gates[e].x,tn.gates[e].z);xt=!0,Mi(he)}O("vehicle-choice").onchange=async()=>{var i,s,a;if(lt||he==="online"&&(["countdown","racing"].includes((i=Qe.state.room)==null?void 0:i.phase)||(a=(s=Qe.state.room)==null?void 0:s.players.find(o=>o.id===Qe.state.id))!=null&&a.ready)||!Ve||!Fi){O("vehicle-choice").value=(ze==null?void 0:ze.userData.vehicleId)||"1";return}const r=Ni.find(o=>o.id===O("vehicle-choice").value);if(!r)return;const e=++Rl;xt=!1,lt=!1,zi(),he==="online"&&(O("online-ready").disabled=!0),O("start").disabled=O("restart").disabled=!0,O("vehicle-status").textContent="Loading "+r.name+"…";let t,n;try{const o=await Ve.loadGLB(Sn(r.file));if(e!==Rl)return;t=pu(o,r),n=Vs(Fi,t,or())}catch{if(e!==Rl)return;O("vehicle-choice").value=ze.userData.vehicleId,xt=!0,O("start").disabled=O("restart").disabled=!1,O("vehicle-status").textContent="Could not load this vehicle. Your current vehicle is kept; choose again to retry.",he==="online"&&lr();return}ar(gn[0].root,gn[0].mixer),ze.removeFromParent(),ze=t,gn[0]=n,cn.add(ze),xt=!0,O("start").disabled=O("restart").disabled=!1,he==="hub"&&st.state.connected?(st.appearance({name:O("hub-name").value.trim(),kart:ze.userData.vehicleId,outfit:or()}),vn("Sanko Racers","Your kart is ready.","Enter the public hub"),Io()):he==="online"&&Qe.state.room?(Qe.ready(!1,ze.userData.vehicleId),lr()):Mi(he),O("vehicle-status").textContent="Same handling for every vehicle. Changing vehicles restarts your drive."};let Ws=performance.now(),Hn=0,wd=0;function vp(r){requestAnimationFrame(vp);const e=(r-Ws)/1e3,t=Math.max(0,Math.min(.1,e));Ws=r;const n=innerWidth,i=innerHeight;if((qt.domElement.width!==Math.floor(n*qt.getPixelRatio())||qt.domElement.height!==Math.floor(i*qt.getPixelRatio()))&&(Et?Et.resize(n,i):(qt.setSize(n,i,!1),Rt.aspect=n/i,Rt.updateProjectionMatrix()),Ps=!0),lM(t),xt){if(he==="hub"){const s=lt&&document.activeElement!==O("chat-input")?Ji():{throttle:0,brake:0,steer:0,handbrake:0};st.input(s),st.advance(t,s,Ve.collision.clear,Ve.collision.surfaceAt),st.state.car&&(Be=st.state.car),lt&&(tt.time+=t),Td(t)}if(he==="online"){const s=lt?Ji():{throttle:0,brake:0,steer:0,handbrake:0};Qe.input(s),Qe.advance(t,s,Ve.collision.clear,Ve.collision.surfaceAt),Qe.state.car&&(Be=Qe.state.car,tt=Qe.state.room.players.find(a=>a.id===Qe.state.id).race),Td(t)}if(lt&&!["online","hub"].includes(he))for(he==="race"&&tt.started&&(tt.time+=Math.max(0,e-t)),Hn+=t;Hn>=1/60;){const s={x:Be.x,z:Be.z,hp:Lt.hp,kills:Lt.kills,hit:Be.hit};if(he==="versus"){if(a1(Nt,Ji(),1/60,Ve.collision.clear,Ve.collision.surfaceAt),Xa(Wn,s,Be,Lt,1/60),Hn-=1/60,tt.finished){const o=du(Be,tt,Nt.opponents,tn).find(l=>l.id==="you").place;vn("Race finished",`You finished ${o} / 3 in ${on(tt.time)}.`,"Race again"),Hn=0;break}continue}const a=ea(Be,Ji(),1/60,Ve.collision.clear,Ve.collision.surfaceAt);if(Hn-=1/60,he==="survivors"){if(rM(Lt,s,Be,1/60,Ve.collision.clear,a),Xa(Wn,s,Be,Lt,1/60),Lt.over){vn("The horde caught your shitbox",`${on(Lt.t)} survived · ${Lt.kills} slain. One more drive?`,"Drive again"),Hn=0;break}}else if(he==="free")tt.time+=1/60,Xa(Wn,s,Be,Lt,1/60);else if(Po(tt,s,Be,1/60,tn.gates),Xa(Wn,s,Be,Lt,1/60),tt.finished){try{fi=ey(localStorage,tt.time,fi)}catch{fi=fi===null?tt.time:Math.min(fi,tt.time)}vn("Lap complete",`${on(tt.time)} · Personal best ${on(fi)}. Take another lap around the world.`,"Race again"),Hn=0;break}}else Hn=0;lt&&Ve.updateProps(t);for(let s=0;s<Math.max(Lt.mobs.length,Rs.length);s++){const a=he==="survivors"&&Lt.mobs[s];let o=Rs[s];a&&!o&&(o=Fi.build({hair:"Short",h:1.65,shirt:s%2?9391928:5464954,pants:3685685}),o.setMoving(!0),Rs.push(o),cn.add(o.root)),o&&(o.root.visible=!!a,a&&(o.root.position.set(a.x,Ve.collision.ground(a.x,a.z),a.z),o.root.rotation.y=Math.atan2(Be.x-a.x,Be.z-a.z)-o.yaw0,lt&&o.mixer.update(t)))}Su(),mp(),cM(n,i),fp(t),uM(t),$n.position.set(Be.x+20,70,Be.z+15),$n.target.position.set(Be.x,0,Be.z),Et==null||Et.update(t,{x:Be.x,y:ze.position.y,z:Be.z}),Jn.duck(!lt),lt&&(Be.z<202?Cs="apache":Be.z>218&&(Cs="greentown"),Jn.play(Cs));for(const[s,a]of[[ze,Be],...he==="versus"?Wr.map((o,l)=>[o,Nt.opponents[l].car]):[]])tp(s,a,lt?t:0);r-wd>80&&(gp(),fM(),wd=r)}r-Al>=(Et?Et.frameInterval()*1e3:ap?200:0)-2&&(Et?Et.render((r-Al)/1e3):qt.render(cn,Rt),Al=r)}requestAnimationFrame(vp);pM().catch(r=>{console.error(r),ip.textContent="The world could not load",rp.textContent="A required native asset is missing. Reload after checking the local asset setup.",O("loading").textContent=r.message});new URLSearchParams(location.search).has("qa")&&(window.__racersInspect=()=>{var r,e,t,n;return{ready:xt,running:lt,mode:he,view:{...Gt},panelView:Ot.dataset.view,fx:Bi.inspect(),controller:{connected:!!Mn.connected,input:Mn.input},graphics:Et==null?void 0:Et.inspect(),music:Jn.inspect(),hub:{id:st.state.id,connected:st.state.connected,players:st.state.players,messages:st.state.messages,status:st.state.status,peers:Xn.size},displayPose:hu(Be,he==="online"?Qe.state.correction:he==="hub"?st.state.correction:null),carScreen:ze?ze.getWorldPosition(new C).project(Rt).toArray():null,online:{id:Qe.state.id,room:Qe.state.room,status:Qe.state.status,peers:Xn.size},driverVisible:(r=gn[0])==null?void 0:r.root.visible,vehicle:ze==null?void 0:ze.userData.vehicleId,vehicleLoading:!xt,vehicleWheels:ze?["Wheel_FL","Wheel_FR","Wheel_BL","Wheel_BR"].map(i=>{var a;const s=ze.getObjectByName(i);return s?{name:i,quaternion:s.quaternion.toArray(),roll:(a=s.children[0])==null?void 0:a.rotation.x}:null}):[],vehicleMarkers:ze?["seat_driver","hand_wheel_L","hand_wheel_R"].map(i=>{var s;return{name:i,position:(s=ze.getObjectByName(i))==null?void 0:s.getWorldPosition(new C).toArray()}}):[],surface:Ve==null?void 0:Ve.collision.surfaceAt(Be.x,Be.z),world:{bounds:{...et},placements:Ve==null?void 0:Ve.placementCount,terrainTiles:Ve==null?void 0:Ve.terrainTiles,propChunks:Ve==null?void 0:Ve.propChunks,skinnedProps:Ve==null?void 0:Ve.skinnedProps,propTimes:Ve==null?void 0:Ve.propTimes()},startingArea:he==="free"?up().id:null,input:Ji(),survival:structuredClone(Lt),actors:Rs.filter(i=>i.root.visible).length,state:{...Be},race:{...tt},driver:(e=ze==null?void 0:ze.getObjectByName("mixamorig_Hips"))==null?void 0:e.getWorldPosition(new C).toArray(),car:ze==null?void 0:ze.position.toArray(),camera:Rt.position.toArray(),cameraFov:Rt.fov,driverHead:(n=(t=gn[0])==null?void 0:t.master.getObjectByName("mixamorig_Head"))==null?void 0:n.getWorldPosition(new C).toArray(),cameraTarget:Lr.toArray(),cameraChecks:Ve==null?void 0:Ve.cameraCollision.stats(),countdown:Nt==null?void 0:Nt.countdown,opponents:Nt==null?void 0:Nt.opponents.map(i=>({id:i.id,name:i.name,car:{...i.car},race:{...i.race}})),rivalCars:Wr.map(i=>({id:i.uuid,visible:i.visible,position:i.position.toArray()})),drivers:gn.map(i=>{var s;return{spec:i.spec,hips:(s=i.master.getObjectByName("mixamorig_Hips"))==null?void 0:s.getWorldPosition(new C).toArray()}}),calls:qt.info.render.calls,triangles:qt.info.render.triangles}});
