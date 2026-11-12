// Wake the main-thread co-op clock without depending on rendering or window timers.
self.onmessage=({data:interval})=>{
 if(!Number.isFinite(interval)||interval<16||interval>1000)return;
 self.onmessage=null;
 setInterval(()=>self.postMessage(0),interval);
};
