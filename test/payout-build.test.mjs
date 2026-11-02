import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

// Run after tools/build-vercel.sh; no deploy or credentials are involved.
test('Vercel output preserves the site/API and exposes an authenticated CommonJS payout cron', {skip:!process.env.SQS_VERCEL_OUTPUT},async()=>{
  const out=process.env.SQS_VERCEL_OUTPUT;
  const json=async path=>JSON.parse(await readFile(join(out,path),'utf8'));
  const config=await json('config.json');assert.equal(config.version,3);
  assert.deepEqual(config.crons,[{path:'/api/payout-cron',schedule:'*/15 * * * *'}]);
  assert.deepEqual(config.routes.find(r=>r.src==='^/api/payout-cron$'),{src:'^/api/payout-cron$',dest:'/payout'});
  assert.deepEqual(config.routes.filter(r=>r.dest?.startsWith('/api?')), [{src:'^/api/(scores|score|report|run|nonce|holder|ranked-week|ranked-nonce|ranked-enter|ranked-start|ranked-submit|ranked-void)$',dest:'/api?route=$1'}]);
  assert.equal(config.routes.at(-1).handle,'filesystem');
  assert.ok(config.routes.some(r=>r.dest==='/preview'));
  assert.deepEqual(await json('functions/payout.func/.vc-config.json'),{runtime:'nodejs22.x',handler:'index.js',launcherType:'Nodejs',shouldAddHelpers:false,maxDuration:300});
  assert.deepEqual(await json('functions/api.func/.vc-config.json'),{runtime:'nodejs22.x',handler:'index.js',launcherType:'Nodejs',shouldAddHelpers:false,maxDuration:60,memory:1024});
  for(const file of ['index.js','ranked.js','noble-crypto.cjs'])assert.deepEqual(await readFile(join(out,'functions/api.func',file)),await readFile(new URL('../tools/vercel-api/'+file,import.meta.url)));
  const files=async dir=>{const paths=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())paths.push(...await files(p));else paths.push(p);}return paths;};
  const sims=new URL('../tools/vercel-api/sims/',import.meta.url);
  for(const file of await files(sims.pathname))assert.deepEqual(await readFile(join(out,'functions/api.func/sims',relative(sims.pathname,file))),await readFile(file));
  assert.deepEqual(await readFile(join(out,'static/index.html')),await readFile(new URL('../dist/index.html',import.meta.url)));
  assert.deepEqual(await readFile(join(out,'functions/preview.func/index.js')),await readFile(new URL('../tools/vercel-probe/index.js',import.meta.url)));
  assert.deepEqual(await readFile(join(out,'functions/preview.func/index.html')),await readFile(new URL('../dist/index.html',import.meta.url)));
  const module={exports:{}};
  runInNewContext(await readFile(join(out,'functions/payout.func/index.js'),'utf8'),{module,exports:module.exports,require:createRequire(import.meta.url),process:{env:{}},Buffer,setTimeout,clearTimeout,AbortController,AbortSignal,console:{log(){throw Error('unexpected log');},error(){throw Error('unexpected log');}}});
  assert.equal(typeof module.exports,'function');const res={statusCode:200,setHeader(){},end(body){this.body=JSON.parse(body);}};
  await module.exports({method:'GET',headers:{}},res);assert.equal(res.statusCode,401);
});
