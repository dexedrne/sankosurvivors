import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const config=JSON.parse(read('tools/build-vercel.sh').match(/cat > \.vercel\/output\/config\.json <<'JSON'\n([\s\S]*?)\nJSON/)[1]);
const target=(path,host,ua='Mozilla/5.0')=>config.routes.find(r=>r.dest&&new RegExp(r.src).test(path)&&(r.has||[]).every(h=>h.type==='host'?h.value.eq===host:h.type==='header'&&h.key==='user-agent'&&new RegExp(h.value).test(ua)))?.dest;

test('GTS root reaches the absolute-asset game before Survivors crawler routing',()=>{
 for(const path of ['/','/index.html'])for(const ua of ['Mozilla/5.0','Twitterbot/1.0','TelegramBot (like TwitterBot)'])assert.equal(target(path,'gts.sankosurvivors.quest',ua),'/racers/index.html');
});
test('GTS routing leaves the apex, legacy hosts, dependencies and API paths alone',()=>{
 for(const host of ['sankosurvivors.quest','sankosurvivors.vyvanse.beer','gts.sankosurvivors.quest.evil.test','not-gts.sankosurvivors.quest']){
  assert.equal(target('/',host),undefined);assert.equal(target('/',host,'Twitterbot/1.0'),'/preview');
 }
 for(const path of ['/fun/racers/','/assets/racers/placements.json','/racers/','/sw.js'])assert.equal(target(path,'gts.sankosurvivors.quest'),undefined);
 assert.equal(target('/api/ranked-week','gts.sankosurvivors.quest'),'/api?route=$1');
 assert.equal(config.routes[0].headers['X-Frame-Options'],'DENY');
});
test('both old Racers pages share the new GTS preview and an explicit Survivors return',()=>{
 for(const path of ['public/racers/index.html','public/fun/racers/index.html']){
  const html=read(path);
  assert(html.includes('property="og:url" content="https://gts.sankosurvivors.quest/"'));
  assert(html.includes('rel="canonical" href="https://gts.sankosurvivors.quest/"'));
  assert(html.includes('class="racers-back" href="https://sankosurvivors.quest/?menu=fun"'));
  for(const field of ['og:image','og:image:secure_url','twitter:image'])assert.match(html,new RegExp('(?:property|name)="'+field+'" content="https://gts\\.sankosurvivors\\.quest/fun/racers/preview-[a-f0-9]{12}\\.png"'));
 }
 const alias=read('public/racers/index.html');assert(!/(?:src|href)="\.\//.test(alias));
});
