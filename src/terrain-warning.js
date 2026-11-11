import {BufferGeometry,Float32BufferAttribute} from 'three';

// Match the ground's unit tiles and triangle diagonal; a radial fan can still cut through hills.
export function fitHazardTerrain(disc,field,x,z,radius,baseY){
 if(![x,z,radius,baseY].every(Number.isFinite)||radius<=0)throw RangeError('Invalid warning position or radius');
 const old=disc.userData.terrainWarning;
 if(old&&old.x===x&&old.z===z&&old.radius===radius&&old.baseY===baseY&&old.data===field.data&&old.n===field.n&&old.x0===field.x0&&old.z0===field.z0)return false;
 const x0=field.x0+Math.floor(x-radius-field.x0),z0=field.z0+Math.floor(z-radius-field.z0);
 const cols=Math.ceil(x+radius-field.x0)-(x0-field.x0),rows=Math.ceil(z+radius-field.z0)-(z0-field.z0);
 if(cols>field.n||rows>field.n)throw RangeError('Warning exceeds terrain grid');
 let geo=disc.geometry;
 if(!old||old.cols!==cols||old.rows!==rows){
  geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(new Float32Array((cols+1)*(rows+1)*3),3));
  const indices=[],stride=cols+1;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*stride+i,b=a+1,c=a+stride,d=c+1;indices.push(a,c,b,b,c,d);}
  geo.setIndex(indices);disc.geometry.dispose();disc.geometry=geo;
 }
 const pos=geo.attributes.position,n=field.n;
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const wx=x0+i,wz=z0+j,k=Math.max(0,Math.min(n-1,wz-field.z0))*n+Math.max(0,Math.min(n-1,wx-field.x0)),height=field.data?field.data[k]:baseY;
  pos.setXYZ(j*(cols+1)+i,(wx-x)/radius,(height-baseY)/radius,(wz-z)/radius);
 }
 pos.needsUpdate=true;geo.computeBoundingSphere();
 disc.userData.terrainWarning={x,z,radius,baseY,data:field.data,n:field.n,x0:field.x0,z0:field.z0,cols,rows};
 return true;
}
