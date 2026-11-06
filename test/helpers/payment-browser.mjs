export function storage() { const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}; }
export function paymentBrowser() {
  let busy=false;
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage()});
  Object.defineProperty(globalThis.navigator,'locks',{configurable:true,value:{async request(name,options,callback){
    if(busy)return callback(null);
    busy=true;try{return await callback({name});}finally{busy=false;}
  }}});
}

export const CLIENT = {build:'test-client', sim:'abcdefabcdef'};
export function mockRankedFetch(t, handler) {
  t.mock.method(globalThis,'fetch',(url,options)=>String(url).endsWith('/api/ranked-version')
    ? Promise.resolve(new Response(JSON.stringify(CLIENT))) : handler(url,options));
}
