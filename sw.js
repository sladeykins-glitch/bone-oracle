const CACHE='bone-oracle-v3.0.0';
const SHELL=['./','./index.html','./app.css?v=3.0.0','./app.js?v=3.0.0','./core.js?v=3.0.0','./journal.js?v=3.0.0','./assets/favicon.svg',...['raven','wolf','serpent','deer','owl','ancestor'].map(id=>'./assets/'+id+'.webp')];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bone-oracle-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 // A strict allowlist excludes Worker source, journal backups and any API data.
 const allowed=SHELL.some(path=>new URL(path,self.registration.scope).href===url.href);
 if(request.mode!=='navigate'&&!allowed)return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok&&allowed){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
  return response;
 }).catch(async()=>{
  const cached=await caches.match(request);if(cached)return cached;
  if(request.mode==='navigate')return (await caches.match(new URL('./',self.registration.scope).href))||Response.error();
  return Response.error();
 }));
});
