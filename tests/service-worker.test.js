import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function setup(){const listeners={},cached=new Map(),puts=[],scope='https://sladeykins-glitch.github.io/bone-oracle/';let additions=[];
 const self={registration:{scope},addEventListener:(name,callback)=>listeners[name]=callback,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 const caches={open:async()=>({addAll:async paths=>{additions=paths;},put:async(request,response)=>puts.push({request,response})}),keys:async()=>['unrelated-cache','bone-oracle-v2'],delete:async()=>true,match:async request=>cached.get(typeof request==='string'?request:request.url)};
 const context={self,caches,URL,Response,fetch:async()=>new Response('shell',{status:200})};vm.runInNewContext(source,context);return {listeners,context,cached,puts,scope,added:()=>additions};
}
test('offline install includes only real shell and art files',async()=>{
 const h=setup(),pending=[];h.listeners.install({waitUntil:p=>pending.push(p)});await Promise.all(pending);assert.equal(h.added().length,13);
 for(const name of h.added()){if(name==='./')continue;assert.ok(fs.existsSync(new URL('../'+name.replace(/^\.\//,'').split('?')[0],import.meta.url)),name+' is missing');}
});
test('Worker requests, POST bodies and non-shell query URLs are never intercepted or cached',()=>{
 const h=setup();let intercepts=0;const event=request=>({request,respondWith:()=>intercepts++,waitUntil:()=>{}});
 h.listeners.fetch(event(new Request('https://bone-oracle-ai.sladeykins.workers.dev/',{method:'POST',body:'private question'})));
 h.listeners.fetch(event(new Request(h.scope+'api',{method:'POST',body:'private question'})));
 h.listeners.fetch(event(new Request(h.scope+'core.js?question=private')));
 h.listeners.fetch(event(new Request(h.scope+'cloudflare-worker.js')));
 assert.equal(intercepts,0);assert.equal(h.puts.length,0);
});
test('same-origin static requests refresh the shell and serve cached files offline',async()=>{
 const h=setup(),request=new Request(h.scope+'app.js?v=3.0.0'),pending=[];let response;
 h.listeners.fetch({request,respondWith:p=>response=p,waitUntil:p=>pending.push(p)});assert.equal((await response).status,200);await Promise.all(pending);assert.equal(h.puts.length,1);
 h.context.fetch=async()=>{throw Error('offline');};h.cached.set(request.url,new Response('cached app',{status:200}));h.listeners.fetch({request,respondWith:p=>response=p,waitUntil:()=>{}});assert.equal(await (await response).text(),'cached app');
});
