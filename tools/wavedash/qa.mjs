// One owned, muted SwiftShader browser on alexbl. No account or production service.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wavedashEdition } from './edition.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const catalogue = Object.fromEntries(await Promise.all(['tr','es','fil'].map(async language => [language, await import('data:text/javascript,' + encodeURIComponent(wavedashEdition().transform('', `/fixture/src/locales/${language}.js`).code))])));
const { CHANGELOG } = await import('data:text/javascript,' + encodeURIComponent(wavedashEdition().transform('', '/fixture/src/changelog.js').code));
const out = resolve(process.argv[2]); mkdirSync(out, { recursive: true });
assert.equal(spawnSync('pgrep', ['-c', '-x', 'chromium'], { encoding: 'utf8' }).stdout.trim(), '0');
const profile = mkdtempSync('/tmp/sqs-wavedash-browser-');
const port = 22505, debugPort = 24505;
const server = spawn('python3', [resolve(root, 'tools/wavedash/review-server.py'), resolve(root, 'dist-wavedash'), String(port)], { stdio: 'ignore' });
const chrome = spawn('nice', ['-n','19','/usr/bin/chromium','--headless=new','--no-sandbox',`--user-data-dir=${profile}`,'--mute-audio','--disable-gpu','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--hide-scrollbars','--window-size=1280,720',`--remote-debugging-port=${debugPort}`,'--remote-allow-origins=*','about:blank'], { stdio:'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const issues = [], notes = [], frames = []; let ws, context, frameSession, id = 0, capture = false;
const pending = new Map();
let failed = false;
try {
  let pages;
  for (let i=0;i<60&&!pages;i++) { try { pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json(); } catch { await sleep(250); } }
  ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  const send = (method, params={}, sessionId) => new Promise((resolve,reject) => { const current=++id; pending.set(current, m => m.error ? reject(Error(JSON.stringify(m.error))) : resolve(m.result)); ws.send(JSON.stringify({id:current,method,params,...(sessionId?{sessionId}:{})})); });
  ws.addEventListener('message', async event => {
    const m=JSON.parse(event.data);
    if (m.id) { pending.get(m.id)?.(m); pending.delete(m.id); }
    else if (m.method === 'Target.attachedToTarget') {
      const session=m.params.sessionId;
      if(m.params.targetInfo.type==='iframe') {
        frameSession=session;context=null;
        await send('Runtime.enable',{},session);await send('Page.enable',{},session);await send('Network.enable',{},session);
        await send('Page.addScriptToEvaluateOnNewDocument',{source:readFileSync(resolve(root,'tools/wavedash/qa-init.js'),'utf8')},session);
      }
      await send('Runtime.runIfWaitingForDebugger',{},session);
    }
    else if (m.method === 'Target.detachedFromTarget' && m.params.sessionId===frameSession) {frameSession=null;context=null;}
    else if (m.method === 'Runtime.executionContextCreated' && m.sessionId===frameSession && m.params.context.auxData?.isDefault && m.params.context.origin === `http://127.0.0.1:${port}`) context=m.params.context.id;
    else if (m.method === 'Runtime.executionContextDestroyed' && m.sessionId===frameSession && m.params.executionContextId === context) context=null;
    else if (m.method === 'Runtime.exceptionThrown') issues.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Network.responseReceived' && m.params.response.status>=400 && !m.params.response.url.endsWith('/favicon.ico')) issues.push(`HTTP${m.params.response.status} ${m.params.response.url}`);
    else if (m.method === 'Network.loadingFailed' && !m.params.canceled) issues.push(m.params.errorText);
    else if (m.method === 'Page.screencastFrame') {
      if(capture) { const name=`frame-${String(frames.length).padStart(5,'0')}.jpg`; writeFileSync(resolve(out,name), Buffer.from(m.params.data,'base64')); frames.push({name,t:m.params.metadata.timestamp}); }
      await send('Page.screencastFrameAck',{sessionId:m.params.sessionId});
    }
  });
  const evaluate=async expression=>{ assert.ok(frameSession,'iframe session'); const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},frameSession); if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text); return r.result?.value; };
  const wait=async(expression,ms=120000)=>{const start=Date.now();while(Date.now()-start<ms){try{if(frameSession&&await evaluate(expression))return;}catch(e){if(!/context|Cannot find|Cannot read|not defined|Session with given id not found/.test(e.message))throw e;}await sleep(200);}throw Error(`Timeout: ${expression}`);};
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(resolve(out,name+'.png'),Buffer.from(r.data,'base64'));};
  const click=async selector=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'})`);const r=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});};
  const health="window.__sqReady===true&&!document.getElementById('start').disabled&&document.getElementById('loadtext').textContent===''";
  const assertNoServices=async()=>{
    assert.equal(await evaluate('__wavedashFixture.providerReads'),0);
    assert.deepEqual(await evaluate("__wavedashFixture.reads.filter(k=>/cloud|wallet|ranked|sq-dmt|wc@/.test(k))"),[]);
    assert.ok(await evaluate('__wavedashFixture.calls.every(c=>c.method===\'GET\'&&new URL(c.url).origin===location.origin&&!c.url.includes(\'/api/\'))'));
  };
  await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
  await send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:true,flatten:true});
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Page.bringToFront');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:readFileSync(resolve(root,'tools/wavedash/qa-init.js'),'utf8')});
  await send('Page.navigate',{url:`http://localhost:${port}/review.html`});
  await wait(health);
  assert.equal(await evaluate('crossOriginIsolated'),true);
  assert.deepEqual(await evaluate('__wavedashFixture.ready'),[{startDisabled:false,isolated:true}]);
  assert.ok(await evaluate('__wavedashFixture.progress.every((p,i,a)=>p>=0&&p<=1&&(!i||p>=a[i-1]))'));
  await shot('desktop-menu');
  await evaluate("(()=>{const r=__sq.renderer(),load=r.preloadGear;r.preloadGear=async(...args)=>{await load(...args);await new Promise(resolve=>__wavedashFixture.releaseStart=resolve);r.preloadGear=load;};})()");
  await click('#start');await wait("typeof __wavedashFixture.releaseStart==='function'");
  await evaluate("dispatchEvent(new Event('blur'));dispatchEvent(new Event('focus'));__wavedashFixture.releaseStart()");await wait("__sq.mode==='pause'&&!!__sq.sim");
  assert.equal(await evaluate('__sq.sim.t'),0);await sleep(300);assert.equal(await evaluate('__sq.sim.t'),0);await click('#resume');
  await wait("['play','pause'].includes(__sq.mode)");
  if(await evaluate("__sq.mode==='pause'")){notes.push('Initial iframe geometry/focus pause: '+JSON.stringify(await evaluate('__wavedashFixture.events')));await click('#resume');}
  await wait("__sq.mode==='play'&&__sq.sim.t>.5");
  const before=await evaluate('({x:__sq.sim.players[0].x,z:__sq.sim.players[0].z})');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});await sleep(1000);await send('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  const after=await evaluate('({x:__sq.sim.players[0].x,z:__sq.sim.players[0].z})');assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.2);
  await evaluate("dispatchEvent(new Event('blur'))");assert.equal(await evaluate('__sq.mode'),'pause');await click('#resume');
  notes.push('PASS isolated cross-origin nested iframe, local assets, exactly one SDK ready, native keyboard movement and focus-loss pause.');
  await sleep(3000);
  capture=true;await send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1280,maxHeight:720,everyNthFrame:1});
  await sleep(11000);capture=false;await send('Page.stopScreencast');
  assert.ok(frames.length>=10,'actual gameplay frames');
  let concat='';for(let i=0;i<frames.length;i++){concat+=`file '${frames[i].name}'\nduration ${i+1<frames.length?Math.max(.001,frames[i+1].t-frames[i].t):.1}\n`;}concat+=`file '${frames.at(-1).name}'\n`;writeFileSync(resolve(out,'frames.txt'),concat);
  await evaluate('__sq.pause(true)');await shot('actual-casual-gameplay');
  await evaluate("__sq.toMenu();document.getElementById('lbbtn').click()");assert.ok(await evaluate("document.getElementById('lblist').textContent.includes('none yet')"));await click('#lbclose');
  await assertNoServices();
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5},frameSession);await send('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:1,mobile:true});
  await evaluate("document.getElementById('setbtn').click();Array.from(document.querySelectorAll('#setlist button')).find(b=>b.dataset.id==='layout'&&JSON.parse(b.dataset.v)==='ds').click();document.getElementById('setclose').click()");
  await evaluate("(()=>{const e=document.querySelector('[data-language]');e.value='fil';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await evaluate('location.reload()');context=null;await wait("__wavedashFixture.loads===2&&"+health);
  assert.equal(await evaluate('document.documentElement.lang'), 'fil');
  assert.equal(await evaluate("document.body.classList.contains('touch')"),true);
  for(const lang of ['tr','es','fil','en']){
    await evaluate(`(()=>{const e=document.querySelector('[data-language]');e.value='${lang}';e.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('morebtn').click();})()`);await sleep(100);
    assert.ok(await evaluate("(()=>{const r=document.querySelector('#more .panel').getBoundingClientRect();return r.x>=0&&r.right<=393&&r.y>=0&&r.bottom<=852;})()"));
    assert.ok(!await evaluate("/wallet|DMT|Ranked/.test(document.getElementById('more').textContent)"));await shot('mobile-more-'+lang);await click('#moreclose');
    await click('#morebtn');await click('#updbtn');
    const translated = text => lang === 'en' ? text : catalogue[lang].text[text];
    await wait(`document.querySelector('#updlist .upd b').textContent===${JSON.stringify(translated(CHANGELOG[0].title))}`);
    for (const [i, entry] of CHANGELOG.entries()) {
      for (const text of [entry.title, ...entry.items]) { assert.equal(typeof translated(text), 'string'); if (lang !== 'en') assert.notEqual(translated(text), text); }
      assert.equal(await evaluate(`document.querySelectorAll('#updlist .updhead b')[${i}].textContent`), translated(entry.title));
      assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('#updlist .upd')[${i}].querySelectorAll('li'),node=>node.textContent)`), entry.items.map(translated));
      assert.equal(await evaluate(`document.querySelectorAll('#updlist .updhead span')[${i}].textContent`), `${entry.date} · v${entry.version}`);
    }
    assert.ok(await evaluate("(()=>{const p=document.querySelector('#updates .panel').getBoundingClientRect(),b=document.getElementById('updclose').getBoundingClientRect();return p.x>=0&&p.right<=393&&p.y>=0&&p.bottom<=852&&b.bottom<=852&&document.body.scrollWidth<=393;})()"));
    await shot('mobile-updates-'+lang);await click('#updclose');
    const scalingStart = {en:'Each skill rank',tr:'Her beceri kademesi',es:'Cada rango de habilidad',fil:'Bawat antas ng kasanayan'}[lang];
    for (const [button,panel,close] of [['skillsbtn','skills','skillsclose'],['gearbtn','gear','gearclose']]) {
      await click('#'+button);await sleep(100);
      const note=await evaluate(`document.querySelector('#${panel} .progression-note small').textContent`);
      assert.ok(note.startsWith(scalingStart),`${lang} ${panel}: ${note}`);
      assert.ok(note.includes('1.5')&&/75%|%75/.test(note));
      await shot('mobile-'+panel+'-'+lang);await click('#'+close);
    }
  }
  await evaluate("document.getElementById('start').click()");await wait("['play','pause'].includes(__sq.mode)");
  await sleep(300);if(await evaluate("__sq.mode==='pause'"))await click('#resume');
  const controls=await evaluate("(()=>{const r=document.getElementById('dscontrols').getBoundingClientRect();return{x:r.x+r.width*.55,y:r.y+r.height*.65};})()");
  const p0=await evaluate('({x:__sq.sim.players[0].x,z:__sq.sim.players[0].z})');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:controls.x,y:controls.y,id:0}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:controls.x+45,y:controls.y,id:0}]});await sleep(800);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const p1=await evaluate('({x:__sq.sim.players[0].x,z:__sq.sim.players[0].z})');assert.ok(Math.hypot(p1.x-p0.x,p1.z-p0.z)>.1);
  await evaluate("(()=>{const s=__sq.sim,p=s.players[0];s.gems.push({id:s.nextId++,x:p.x,z:p.z,v:s.xpNeed,vx:0,vz:0});})()");
  await wait("__sq.mode==='levelup'");
  const levelLeft=await evaluate("dispatchEvent(new Event('blur'));dispatchEvent(new Event('focus'));__sq.sim.pending.p1.left");assert.equal(await evaluate('__sq.mode'),'pause');await sleep(350);assert.equal(await evaluate('__sq.sim.pending.p1.left'),levelLeft);await click('#resume');assert.equal(await evaluate('__sq.mode'),'levelup');
  assert.ok(await evaluate("(()=>{const c=document.getElementById('cards').getBoundingClientRect(),v=document.getElementById('c').getBoundingClientRect(),p=document.querySelector('#levelup .panel').getBoundingClientRect();return c.y>=v.bottom&&p.y>=v.bottom&&p.bottom<=852&&p.x>=0&&p.right<=393;})()"));
  for (const which of ['last-child','first-child']) {
    await evaluate(`document.querySelector('#cards .card:${which}').scrollIntoView({block:'nearest'})`);
    assert.ok(await evaluate(`(()=>{const e=document.querySelector('#cards .card:${which}'),r=e.getBoundingClientRect();return r.y>=426&&r.bottom<=852&&r.width>=44&&r.height>=44&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})()`),which+' card remains visible and reachable while scrolling');
  }
  await shot('mobile-ds-upgrade');
  await evaluate("document.querySelector('#cards .card:last-child').scrollIntoView({block:'nearest'})");
  const card=await evaluate("(()=>{const r=document.querySelector('#cards .card:last-child').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...card,id:0}]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait("__sq.mode==='play'");
  const pausedTime=await evaluate('__sq.sim.t');await sleep(350);assert.equal(await evaluate('__sq.sim.t'),pausedTime);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:controls.x,y:controls.y,id:0}]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:controls.x+45,y:controls.y,id:0}]});await sleep(400);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok(await evaluate(`__sq.sim.t>${pausedTime}`));
  await evaluate("(()=>{const s=__sq.sim,p=s.players[0];s.gems.push({id:s.nextId++,x:p.x,z:p.z,v:s.xpNeed,vx:0,vz:0});})()");
  await wait("__sq.mode==='levelup'");
  assert.ok(await evaluate("(()=>{const e=document.querySelector('#cards .card.sel'),r=e.getBoundingClientRect();return e.dataset.i==='0'&&r.y>=426&&r.bottom<=852;})()"),'the next reward must reveal its first selected card after scrolling the previous reward');
  await shot('mobile-second-upgrade');await click('#cards .card.sel');await wait("__sq.mode==='play'");
  await evaluate("__sq.wearNow({head:'Bronze Helmet'});__sq.casketOf('Iron Helmet')");await wait("__sq.mode==='casket'");
  const casketLeft=await evaluate("dispatchEvent(new Event('blur'));dispatchEvent(new Event('focus'));__sq.sim.pending.p1.left");assert.equal(await evaluate('__sq.mode'),'pause');await sleep(350);assert.equal(await evaluate('__sq.sim.pending.p1.left'),casketLeft);await click('#resume');assert.equal(await evaluate('__sq.mode'),'casket');await click('#ckwear');await wait("__sq.mode==='play'");
  notes.push('PASS focus loss during awaited Start, levelup and casket preserves sim/choice timers and requires explicit Resume; touch reward waits for movement.');
  await evaluate("__wavedashFixture.fault={op:'set',key:'sq-coins'};(()=>{const s=__sq.sim,p=s.players[0];Object.assign(s,{t:600,kills:6,bossKills:0,evolves:0,loot:['Bronze Helmet','Iron Helmet'],alched:[],killsByType:{goblin:6},over:'win'});Object.assign(p,{coins:2,alch:7});})()");
  await wait("__sq.mode==='recovery'");assert.equal(await evaluate("localStorage.getItem('sq-coins')"),'100');assert.equal(await evaluate("JSON.parse(localStorage.getItem('sq-run-save-v1')).data['sq-coins']"),'609');await shot('mobile-reward-retry');
  await evaluate('__wavedashFixture.fault=null');await click('#progressretry');await wait("__sq.mode==='end'");assert.equal(await evaluate("localStorage.getItem('sq-coins')"),'609');assert.equal(await evaluate("localStorage.getItem('sq-run-save-v1')"),null);
  await click('#tomenu');await click('#lbbtn');assert.ok(await evaluate("document.getElementById('lblist').textContent.includes('Greentown')&&document.getElementById('lblist').textContent.includes('10:00')"));await shot('device-best-run');await click('#lbclose');
  await assertNoServices();
  await evaluate('location.reload()');context=null;await wait("__wavedashFixture.loads===3&&"+health);assert.equal(await evaluate("localStorage.getItem('sq-coins')"),'609');await assertNoServices();await shot('mobile-reloaded-save');
  await click('#start');await wait("['play','pause'].includes(__sq.mode)");if(await evaluate("__sq.mode==='pause'"))await click('#resume');
  await evaluate("__wavedashFixture.fault={op:'set',key:'sq-coins'};(()=>{const s=__sq.sim,p=s.players[0];Object.assign(s,{t:1,kills:0,bossKills:0,evolves:0,loot:[],alched:[],killsByType:{},over:'dead'});Object.assign(p,{coins:1,alch:0});})()");await wait("__sq.mode==='recovery'");
  assert.equal(await evaluate("localStorage.getItem('sq-coins')"),'609');assert.equal(await evaluate("JSON.parse(localStorage.getItem('sq-run-save-v1')).data['sq-coins']"),'612');await assertNoServices();
  await evaluate('location.reload()');context=null;await wait("__wavedashFixture.loads===4&&"+health);assert.equal(await evaluate("localStorage.getItem('sq-coins')"),'612');assert.equal(await evaluate("localStorage.getItem('sq-run-save-v1')"),null);await assertNoServices();await shot('startup-recovers-interrupted-run');
  notes.push('PASS393px DS trusted touch movement, actual translated update titles/items and exact date/version in four languages, realreload Filipino choice, four-language menus, full609coin/gear/quest retry once, local record10:00, actual reload persistence and zero credential/provider/API traffic.');
  await send('Page.navigate',{url:`http://localhost:${port}/review.html?failboot=1`});context=null;
  await wait("document.getElementById('loadtext').textContent.startsWith('Could not load the world:')");
  assert.equal(await evaluate('__wavedashFixture.ready.length'),0);assert.notEqual(await evaluate('window.__sqReady'),true);await assertNoServices();await shot('failed-boot-no-sdk-ready');
  notes.push('PASS intentional world-load failure never initializes SDK or reports ready. Local fixture; platform account and physical phone not tested.');
} catch(error) { failed=true;issues.push('[QA] '+error.stack); }
finally {
  writeFileSync(resolve(out,'QA.json'),JSON.stringify({fixture:'local SDK contract; not platform verification',notes,issues,frames:frames.length},null,2)+'\n');
  console.log(JSON.stringify({notes,issues,frames:frames.length}));
  try{ws?.close();}catch{} chrome.kill('SIGTERM');server.kill('SIGTERM');await sleep(700);rmSync(profile,{recursive:true,force:true});
}
process.exitCode=failed||issues.length?1:0;
