// Touch holds inspect HUD items; this pointer must never become the movement stick.
export function bindItemInspection(root,{show,hide,canInspect}) {
  const doc=root.ownerDocument,win=doc.defaultView,listeners=[];
  let press=null,timer;
  const current=()=>press&&press.item.isConnected&&root.contains(press.item)&&!doc.hidden&&canInspect()
    &&press.item.dataset.inspect===press.kind&&press.item.dataset.inspectId===press.id;
  const cancel=()=>{clearTimeout(timer);press=null;hide();};
  const on=(target,event,fn)=>{target.addEventListener(event,fn);listeners.push(()=>target.removeEventListener(event,fn));};
  on(root,'pointerdown',e=>{
    if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
    const item=e.target.closest('[data-inspect]');
    if(press||!item||!root.contains(item)||!canInspect())return;
    e.preventDefault();e.stopPropagation();
    press={pointer:e.pointerId,item,kind:item.dataset.inspect,id:item.dataset.inspectId,x:e.clientX,y:e.clientY};
    root.setPointerCapture(e.pointerId);
    timer=setTimeout(()=>{if(current())show({target:item,type:'touchhold'});else cancel();},500);
  });
  on(root,'pointermove',e=>{if(press?.pointer===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)cancel();});
  for(const event of['pointerup','pointercancel','lostpointercapture'])on(root,event,e=>{if(press?.pointer===e.pointerId)cancel();});
  on(root,'contextmenu',e=>{if(e.target.closest('[data-inspect]'))e.preventDefault();});
  on(doc,'visibilitychange',cancel);if(win)on(win,'blur',cancel);
  return()=>{cancel();for(const off of listeners)off();};
}
