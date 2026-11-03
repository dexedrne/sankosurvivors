import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

// Run after tools/build-vercel.sh; no deploy or credentials are involved.
test('Vercel output preserves the site/API and deploys no payout function or cron (prizes are signed on the laptop)', {skip:!process.env.SQS_VERCEL_OUTPUT},async()=>{
  const out=process.env.SQS_VERCEL_OUTPUT;
  const json=async path=>JSON.parse(await readFile(join(out,path),'utf8'));
  const config=await json('config.json');assert.equal(config.version,3);
  assert.deepEqual(config.crons,[]);
  assert.equal(config.routes.find(r=>r.src==='^/api/payout-cron$'),undefined);
  assert.deepEqual(config.routes.filter(r=>r.dest?.startsWith('/api?')), [{src:'^/api/(scores|score|report|run|nonce|holder|ranked-week|ranked-nonce|ranked-enter|ranked-start|ranked-submit|ranked-void|save-nonce|save-login|save-get|save-put)$',dest:'/api?route=$1'}]);
  assert.equal(config.routes.at(-1).handle,'filesystem');
  assert.ok(config.routes.some(r=>r.dest==='/preview'));
  await assert.rejects(readFile(join(out,'functions/payout.func/.vc-config.json')),'no payout function is deployed');
  assert.deepEqual(await json('functions/api.func/.vc-config.json'),{runtime:'nodejs22.x',handler:'index.js',launcherType:'Nodejs',shouldAddHelpers:false,maxDuration:800,memory:2048});
  for(const file of ['index.js','ranked.js','cloud.js','noble-crypto.cjs'])assert.deepEqual(await readFile(join(out,'functions/api.func',file)),await readFile(new URL('../tools/vercel-api/'+file,import.meta.url)));
  const files=async dir=>{const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())paths.push(...await files(p));else paths.push(p);}return paths;};
  const sims=new URL('../tools/vercel-api/sims/',import.meta.url);
  for(const file of await files(sims.pathname))assert.deepEqual(await readFile(join(out,'functions/api.func/sims',relative(sims.pathname,file))),await readFile(file));
  assert.deepEqual(await readFile(join(out,'static/index.html')),await readFile(new URL('../dist/index.html',import.meta.url)));
  assert.deepEqual(await readFile(join(out,'functions/preview.func/index.js')),await readFile(new URL('../tools/vercel-probe/index.js',import.meta.url)));
  assert.deepEqual(await readFile(join(out,'functions/preview.func/index.html')),await readFile(new URL('../dist/index.html',import.meta.url)));
  assert.ok(config.routes[0].headers['X-Frame-Options']==='DENY'&&/frame-ancestors 'none'/.test(config.routes[0].headers['Content-Security-Policy']),'never framed');
});

// security pass 3: the wallet key never goes back into Vercel. Nothing in the game or its tools reads the old Vercel
// variable, no build script makes a payout function or a cron, and the Vercel payout handler is gone (payouts run only
// on the owner's laptop: node tools/payout/run.mjs with the keystore).
test('no code reads the Vercel wallet-key variable and no build script writes a payout function or a cron',async()=>{
  const root=new URL('../',import.meta.url).pathname;
  const files=async dir=>{const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','.vercel','dist','.git'].includes(e.name))continue;const p=join(dir,e.name);if(e.isDirectory())paths.push(...await files(p));else paths.push(p);}return paths;};
  const code=[...await files(join(root,'tools')),...await files(join(root,'src'))].filter(p=>/\.(m?js|cjs|ts|sh|py|json|sql|html)$/.test(p));
  assert.ok(code.length>50,'scanned the tree');
  const name=['PAYOUT','WALLET','PRIVATE','KEY'].join('_');
  const readers=[];for(const p of code)if((await readFile(p,'utf8')).includes(name))readers.push(relative(root,p));
  assert.deepEqual(readers,[]);
  const scripts=code.filter(p=>p.endsWith('.sh'));
  assert.ok(scripts.some(p=>p.endsWith('tools/build-vercel.sh'))&&scripts.some(p=>p.endsWith('tools/deploy.sh')));
  for(const p of scripts){
    const text=await readFile(p,'utf8');
    assert.ok(!/payout\.func|functions\/payout/.test(text),relative(root,p)+' writes no payout function');
    for(const m of text.matchAll(/"crons"\s*:\s*(\[[^\]]*\])/g))assert.equal(m[1].replace(/\s/g,''),'[]',relative(root,p)+' writes no cron');
    assert.equal((text.match(/"crons"/g)||[]).length,[...text.matchAll(/"crons"\s*:\s*\[\s*\]/g)].length,relative(root,p)+': every crons list is empty');
  }
  assert.match(await readFile(join(root,'tools/build-vercel.sh'),'utf8'),/"crons":\[\]/);
  for(const gone of ['tools/payout/vercel.mjs','vercel.json'])await assert.rejects(readFile(join(root,gone)),{code:'ENOENT'},gone);
});
