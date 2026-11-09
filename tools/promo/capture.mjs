import {spawn} from 'node:child_process';
import {encoderPipe,cdpRequests} from './transport.mjs';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.cwd(),out=path.join(base,'out');mkdirSync(out,{recursive:true});
const staticRoot=process.env.PROMO_STATIC || path.join(process.env.HOME,'work/sqs-racers-npc-1109/.vercel/output/static');
const vendor=path.join(process.env.HOME,'work/sqs-racers-npc-1109/node_modules/three');
const profile=mkdtempSync(path.join(base,'profile-')),port=22579,debug=23579;
const server=spawn('nice',['-n','19','python3',path.join(base,'promo/server.py'),staticRoot,path.join(base,'promo'),vendor,String(port)],{stdio:'ignore'});
const browser=spawn('nice',['-n','19','/usr/bin/chromium','--headless=new','--no-sandbox','--mute-audio','--disable-gpu','--use-angle=swiftshader','--use-gl=angle','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--hide-scrollbars',`--user-data-dir=${profile}`,'--window-size=720,1280',`--remote-debugging-port=${debug}`,'--remote-allow-origins=*','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;const enc=[];const errors=[];
async function main(){
 let tabs;for(let n=0;n<100&&!tabs;n++){try{tabs=await(await fetch(`http://127.0.0.1:${debug}/json/list`)).json();}catch{await sleep(200);}}
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 const send=cdpRequests(ws);ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
 const evaluate=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(m.result.exceptionDetails.exception?.description||m.result.exceptionDetails.text);return m.result.result.value;};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:720,height:1280,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:readFileSync(path.join(base,'promo/init.js'),'utf8')});
 await send('Page.navigate',{url:`http://127.0.0.1:${port}/?qa&clean`});
 for(let n=0;n<300;n++){if(await evaluate("!!window.__sqReady&&!!window.__sq&&document.getElementById('loadtext').textContent===''") )break;await sleep(400);}
 assert.ok(await evaluate('!!window.__sq'));console.log('Native application ready');
 await evaluate("import('/promo/scene.js')");console.log('Scene ready',await evaluate('window.__promoReady'));
 if(process.env.PROMO_TRIAL){for(const i of [0,100,200,280,320,390,460]){const f=await evaluate(`window.__promoFrame(${i})`);writeFileSync(path.join(out,`trial-${i}.jpg`),Buffer.from(f.copy,'base64'));console.log('trial',i,f.scene,f.enemies);}return;}
 const ff=path.join(base,'encoder/usr/bin/ffmpeg');
 for(const kind of ['clean','copy']){
  const p=spawn('nice',['-n','19',ff,'-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-r','24','-i','pipe:0','-i',path.join(staticRoot,'assets/music/Adobe_Fantasy.mp3'),'-af','volume=0.16,afade=t=in:st=0:d=0.6,afade=t=out:st=18.5:d=1.5','-c:a','aac','-b:a','160k','-t','20','-shortest','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,`sankosurvivors-${kind}.mp4`)],{stdio:['pipe','ignore','pipe']});p.input=encoderPipe(p);p.stderr.on('data',b=>errors.push(b.toString()));enc.push(p);
 }
 const keys=new Set([0,60,108,192,264,312,360,408,456,479]);
 const keyframes=[];const started=Date.now();for(let i=0;i<480;i++){
  const f=await evaluate(`window.__promoFrame(${i})`);if(errors.length)throw Error(errors.join('\n'));
  for(const [j,k]of ['clean','copy'].entries()){await enc[j].input.write(Buffer.from(f[k],'base64'));}
  if(keys.has(i)){keyframes.push({...f,clean:undefined,copy:undefined});writeFileSync(path.join(out,`key-${String(i).padStart(3,'0')}.jpg`),Buffer.from(f.copy,'base64'));}
  if(i%24===0)console.log(`frame ${i}/480 elapsed ${((Date.now()-started)/1000).toFixed(1)}s`);
 }
 await Promise.all(enc.map(p=>p.input.finish()));
 const state=await evaluate('({errors:window.__promoCapture.errors,blocked:window.__promoCapture.blocked,ready:window.__promoReady,bounds:window.__promoBounds,canvas:[c.width,c.height]})');assert.deepEqual(state.errors,[]);assert.deepEqual(state.canvas,[720,1280]);console.log('DONE',state);writeFileSync(path.join(out,'capture-report.json'),JSON.stringify({state,errors,keyframes,elapsedMs:Date.now()-started},null,2));assert.equal(errors.length,0);
}
try{await main();}finally{for(const p of enc)if(p.exitCode===null)p.kill('SIGTERM');ws?.close();browser.kill('SIGTERM');server.kill('SIGTERM');await sleep(1000);rmSync(profile,{recursive:true,force:true});}
