// Versionado de caché: subir C en CADA publicación (entreno-v6 → entreno-v7 …). Ver README "Publicar una versión nueva".
const C='entreno-v6',F=['./','index.html','app.js','manifest.json','icon.svg','icon-192.png','icon-512.png'],TO=3000;
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(f=>new Request(f,{cache:'reload'}))))));
// Sin skipWaiting automático: la app muestra "Versión nueva → Actualizar" (solo en Inicio) y manda este mensaje.
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
const key=req=>req.url.split('?')[0];
const put=(req,r)=>{if(r&&r.ok&&r.type==='basic'){const cp=r.clone();caches.open(C).then(c=>c.put(key(req),cp))}return r};// QA-05: no cachear no-ok
const fromCache=req=>caches.match(req,{ignoreSearch:true}).then(m=>m||(req.mode==='navigate'?caches.match('index.html'):undefined));
// index/app.js/navegación: network-first sin caché HTTP, con timeout → caché
function netFirst(req){return new Promise(res=>{let ok=false;const fin=r=>{if(!ok&&r){ok=true;clearTimeout(t);res(r)}};
 const t=setTimeout(()=>fromCache(req).then(fin),TO);
 fetch(req,{cache:'no-cache'}).then(r=>{put(req,r);return r.ok?fin(r):fromCache(req).then(m=>fin(m||r))})
  .catch(()=>fromCache(req).then(m=>{if(m)fin(m);else{clearTimeout(t);fin(Response.error())}}))})}
// Resto (íconos, manifest): caché primero, red si falta
const cacheFirst=req=>fromCache(req).then(m=>m||fetch(req).then(r=>put(req,r)));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
 const p=u.pathname;e.respondWith(req.mode==='navigate'||p.endsWith('/')||p.endsWith('/index.html')||p.endsWith('/app.js')||p.endsWith('/sw.js')?netFirst(req):cacheFirst(req))});
