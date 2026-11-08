export const STORM_CLEAR = 12, STORM_FAR = 32;
const DURATION = Object.freeze({rainstorm:20,snowstorm:20,blizzard:14,sandstorm:12});

export function extraStorms(region,snowReady) {
  if(region?.under||region?.id==='paya')return [];
  return snowReady&&!['apache','duel'].includes(region?.id)?['rainstorm','snowstorm']:['rainstorm'];
}

export function stormView(event) {
  if(!event||typeof event.kind!=='string'||!Object.hasOwn(DURATION,event.kind)||!Number.isFinite(event.t)||event.t<=1e-9)return null;
  const duration=DURATION[event.kind],left=Math.min(duration,event.t);
  return {kind:event.kind,left:Math.round(left*100)/100,intensity:Math.max(0,Math.min(1,(duration-left)/2,left/2))};
}
