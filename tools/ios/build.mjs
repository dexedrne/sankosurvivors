// Web compilation runs on alexbl. This script never signs, uploads or reads environment files.
import {build} from 'vite';
import {readdir,lstat,mkdir,link,copyFile,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {iosEdition} from './edition.mjs';
import {assertCasualBundle} from '../wavedash/edition.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url)),out=path.join(root,'tools/ios/www');
await build({root,configFile:false,envDir:false,base:'./',publicDir:false,plugins:[iosEdition()],build:{outDir:out,emptyOutDir:true,chunkSizeWarningLimit:1500}});
async function nativeTree(source,dest){
  const s=await lstat(source);assert(!s.isSymbolicLink(),'Native resource symlink refused: '+source);
  if(s.isDirectory()){
    await mkdir(dest,{recursive:true});
    for(const name of await readdir(source)){assert(!name.startsWith('.'));await nativeTree(path.join(source,name),path.join(dest,name));}
  }else{
    assert(s.isFile());await mkdir(path.dirname(dest),{recursive:true});
    try{await link(source,dest);}catch(e){if(e.code==='EEXIST'){assert((await readFile(source)).equals(await readFile(dest)));}else if(e.code==='EXDEV')await copyFile(source,dest);else throw e;}
  }
}
for(const name of await readdir(path.join(root,'public/assets')))if(!['sanko','racers'].includes(name))await nativeTree(path.join(root,'public/assets',name),path.join(out,'assets',name));
for(const name of ['draco','licenses'])await nativeTree(path.join(root,'public',name),path.join(out,name));
const files=[];
async function inventory(dir){
  for(const name of await readdir(dir)){
    const file=path.join(dir,name),s=await lstat(file);assert(!s.isSymbolicLink());
    if(s.isDirectory())await inventory(file);else{
      const rel=path.relative(out,file).split(path.sep).join('/'),data=await readFile(file);assertCasualBundle('',[rel]);
      if(/\.(html|js|css)$/.test(rel))assertCasualBundle(data.toString('utf8'),[rel]);
      files.push({name:rel,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
    }
  }
}
await inventory(out);
const html=await readFile(path.join(out,'index.html'),'utf8');
assert(!/id="(?:rankedbtn|walletchip|petbuns|racersbtn|coopbtn)"/.test(html));
await writeFile(path.join(root,'tools/ios/build-manifest.json'),JSON.stringify({edition:'ios-casual-1.0.0',files:files.sort((a,b)=>a.name.localeCompare(b.name)),bytes:files.reduce((a,b)=>a+b.bytes,0)},null,2)+'\n');
console.log(JSON.stringify({edition:'ios-casual-1.0.0',files:files.length,bytes:files.reduce((a,b)=>a+b.bytes,0),uploaded:false}));
