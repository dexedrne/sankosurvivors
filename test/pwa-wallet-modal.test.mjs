import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {walletConnectLinks} from '../src/wallet-connect.js';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=main.slice(main.indexOf('function renderWalletConnect('),main.indexOf('\nwatchWalletConnect(renderWalletConnect)')).replace("import('qrcode')",'loadQr()');
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function fixture(){
 const nodes=new Map(),drawn=[];let state=null,resolve;
 const ready=new Promise(r=>resolve=r),$=id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{textContent:'',innerHTML:'',width:0,height:0,contains:()=>false,querySelector:()=>({focus(){}}),classList:{toggle:(n,on)=>on?classes.add(n):classes.delete(n),contains:n=>classes.has(n)}});}return nodes.get(id);};
 const render=Function('$','walletConnectLinks','walletConnectState','esc','navScreen','document','loadQr',code+';return renderWalletConnect;')($,walletConnectLinks,()=>state,s=>s,()=>null,{},()=>ready);
 return{$,drawn,show:s=>{state=s;render(s);},ready:()=>resolve({default:{toCanvas:async(...args)=>drawn.push(args)}})};
}
test('standard WalletConnect shows a local QR for the pairing URI and removes it during approval',async()=>{
 const f=fixture();f.show({phase:'pair',uri:'wc:fixture-standard@2?fixture-only'});f.ready();await tick();
 assert.equal(f.drawn.length,1);assert.equal(f.drawn[0][1],'wc:fixture-standard@2?fixture-only');
 assert.equal(f.$('walletlinkqr').classList.contains('hidden'),false);
 f.show({phase:'request'});assert.equal(f.$('walletlinkqr').classList.contains('hidden'),true);
});
test('late QR encoder cannot paint a cancelled or replacement pairing',async()=>{
 const f=fixture();f.show({phase:'pair',uri:'wc:old-fixture@2?fixture-only'});f.show(null);f.ready();await tick();assert.deepEqual(f.drawn,[]);
 assert.equal(f.$('walletlinkqr').classList.contains('hidden'),true);
});
