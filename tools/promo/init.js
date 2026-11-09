(()=>{
 window.__promoCapture={errors:[],blocked:0};
 addEventListener('error',e=>window.__promoCapture.errors.push(e.message));
 const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>window.__stopRAF?0:raf(f);
 for(const[k,v]of Object.entries({'sq-settings':JSON.stringify({v:2,quality:'high',res:'1',fps:'30',shadows:true,shadowq:'medium',ao:false,dof:false,bloom:true,grade:true,shake:false,numbers:false,time:'day'}),'sq-muted':'1','sq-vol':'{"s":0,"m":0}','sq-name':'"Staged fan promo"'}))localStorage.setItem(k,v);
 const native=fetch.bind(window),reply=value=>new Response(JSON.stringify(value));
 window.fetch=async(url,options={})=>{
  const u=new URL(String(url),location.href);
  if(u.pathname==='/api/scores')return reply({rows:[]});
  if(u.pathname.startsWith('/api/'))return new Response('{}',{status:404});
  if(u.pathname==='/version.json')return reply({build:'promo-offline',sim:'staged'});
  if(u.origin!==location.origin||!['GET','HEAD'].includes((options.method||'GET').toUpperCase())){window.__promoCapture.blocked++;throw Error('Offline promo blocks remote requests and writes');}
  return native(url,options);
 };
})();
