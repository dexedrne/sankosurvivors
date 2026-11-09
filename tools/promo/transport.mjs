// Every failure reaches the capture runner's finally, including errors before a write.
export function encoderPipe(child){
 let failure,closed=false,finishing=false,resolveDone,rejectDone,rejectClosed;
 const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});done.catch(()=>{});
 const ended=new Promise((_,reject)=>{rejectClosed=reject;});ended.catch(()=>{});
 const fail=error=>{failure||=error;rejectClosed(failure);rejectDone(failure);};
 child.once('error',fail);child.stdin.on('error',fail);
 child.once('close',(code,signal)=>{
  closed=true;const error=failure||Error(`Encoder closed: exit ${code}, signal ${signal}`);rejectClosed(error);
  if(code===0&&finishing&&!failure)resolveDone();else fail(error);
 });
 return {
  write(data){
   if(failure||closed)return Promise.reject(failure||Error('Encoder already closed'));
   return Promise.race([new Promise((resolve,reject)=>child.stdin.write(data,error=>error?reject(error):resolve())),ended]);
  },
  finish(){finishing=true;child.stdin.end();return done;},
 };
}

export function cdpRequests(ws,timeout=180000){
 let id=0,failure,openTimer,rejectOpen;const pending=new Map();
 const stop=error=>{
  failure||=error;clearTimeout(openTimer);rejectOpen?.(failure);
  for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(failure);}pending.clear();
 };
 const ready=ws.readyState===1?Promise.resolve():new Promise((resolve,reject)=>{
  rejectOpen=reject;ws.addEventListener('open',()=>{clearTimeout(openTimer);resolve();},{once:true});
  openTimer=setTimeout(()=>stop(Error('CDP open timeout')),timeout);
 });ready.catch(()=>{});
 ws.addEventListener('close',()=>stop(Error('CDP socket closed')));
 ws.addEventListener('error',()=>stop(Error('CDP socket error')));
 ws.addEventListener('message',event=>{
  let response;try{response=JSON.parse(event.data);}catch{return stop(Error('CDP invalid response'));}
  const entry=pending.get(response.id);if(!entry)return;
  clearTimeout(entry.timer);pending.delete(response.id);
  if(response.error)entry.reject(Error(`CDP: ${response.error.message}`));else entry.resolve(response);
 });
 return async(method,params={})=>{
  await ready;if(failure)throw failure;
  return new Promise((resolve,reject)=>{
   const request=++id,timer=setTimeout(()=>stop(Error(`CDP timeout: ${method}`)),timeout);
   pending.set(request,{resolve,reject,timer});
   try{ws.send(JSON.stringify({id:request,method,params}));}catch(error){stop(error);}
  });
 };
}
