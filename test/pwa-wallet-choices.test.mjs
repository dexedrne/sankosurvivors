import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const code=main.slice(main.indexOf('function walletChoices('),main.indexOf('async function pickWallet('));
test('a plain iPhone PWA never labels wallet-browser game navigation as a connection',()=>{
  const choices=Function('wallets','isPhone','walletAppLinks','esc','walletIcon',`${code};return walletChoices(()=>{});`)(()=>[],()=>true,()=>[['MetaMask','https://metamask.app.link/dapp/sankosurvivors.quest'],['Rabby','https://go.rabby.io/mobile/?_cmd=open-dapp&dapp=game']],s=>s,()=> '');
  assert.doesNotMatch(choices.html,/metamask\.app\.link\/dapp|_cmd=open-dapp/);
  assert.doesNotMatch(choices.html,/Phone browsers have no wallet inside/);
});
