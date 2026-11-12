import {captureRunBuild,effectNames} from './run-build.js';
import {playerStats} from './sim.js';

const effectStats={speed:'speed',strength:'might',agility:'speed',wisdom:'growth',chill:'speed'};

// Read-only display data from this run, including live co-op actor state.
export function pauseBuild(sim,player){
 if(!sim||!player)return null;
 const build=captureRunBuild(sim,player),stats=playerStats(player);
 const icons=new Map((build.sections.find(s=>s.title==='Active effects')?.rows||[]).map(row=>[row.name,row.icon]));
 const effects=Object.entries(effectNames).flatMap(([id,name])=>{
  const time=player.buffs?.[id];if(!Number.isFinite(time)||time<=0)return[];
  const stat=effectStats[id],without=playerStats({...player,buffs:{...player.buffs,[id]:0}})[stat],value=stats[stat];
  const factor=Number.isFinite(value)&&without>0?Math.round(value/without*1000)/1000:null;
  return[{id,name,icon:icons.get(name),seconds:Math.ceil(time),stat:build.stats.find(s=>s.id===stat)?.name||'',factor}];
 }).sort((a,b)=>Number(b.factor!==null&&b.factor<1)-Number(a.factor!==null&&a.factor<1));
 return{sections:build.sections.filter(s=>s.title!=='Active effects'),stats:build.stats,effects,hp:Math.max(0,Math.round(player.hp)),maxHp:Math.round(player.maxHp)};
}

export function pauseBuildHTML(build,asset,esc){
 if(!build)return '';
 const primary=new Set(['maxHp','armor','might','haste','speed','area','magnet','growth']);
 const statRows=rows=>`<div class="runbuild-stats">${rows.map(s=>`<div data-pause-stat="${s.id}"><small>${esc(s.name)}</small><b translate="no">${s.value.toLocaleString()}${esc(s.suffix)}</b></div>`).join('')}</div>`;
 const effects=build.effects.length?build.effects.map(e=>`<div class="pauseeffect${e.factor!==null&&e.factor<1?' negative':''}"><img src="${esc(asset(e.icon))}" alt=""><div><b>${esc(e.name)}</b>${e.factor!==null?`<small><span>${esc(e.stat)}</span> <span translate="no">×${e.factor}</span></small>`:''}</div><b data-pause-seconds="${e.id}" role="timer" aria-live="off" translate="no">${e.seconds}s</b></div>`).join(''):'<p class="dim">No active effects</p>';
 const items=build.sections.map(section=>`<section class="runbuild-section"><h4>${esc(section.title)}</h4><div class="runbuild-items">${section.rows.length?section.rows.map(row=>`<div class="runbuild-item${row.evolved?' evolved':''}"><img src="${esc(asset(row.icon))}" alt=""><div><b>${esc(row.name)}</b><small>${row.details.map(esc).join(' · ')}</small></div></div>`).join(''):'<p class="dim">None</p>'}</div></section>`).join('');
 return `<details data-pause-group="effects" open><summary>Active effects</summary>${effects}</details><details data-pause-group="stats" open><summary>Current stats</summary>${statRows(build.stats.filter(s=>primary.has(s.id)))}<details data-pause-group="more"><summary>More stats</summary>${statRows(build.stats.filter(s=>!primary.has(s.id)))}</details></details><details data-pause-group="build"><summary>Current build</summary>${items}</details>`;
}
