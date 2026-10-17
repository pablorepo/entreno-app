// Versionado de caché: subir C en CADA publicación de app (entreno-v8 → entreno-v9 …). Ver README "Publicar una versión nueva".
// plan.json NO requiere bump: va por red primero (S-2); Coach solo sube planVersion.
const C='entreno-v8',F=['./','index.html','app.js','validar-plan.js','plan.json','manifest.json','icon.svg','icon-192.png','icon-512.png'],TO=3000;
const NETFIRST=['/','/index.html','/app.js','/validar-plan.js','/sw.js','/plan.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(f=>new Request(f,{cache:'reload'}))))));
// Sin skipWaiting automático: la app muestra "Versión nueva → Actualizar" (solo en Inicio/Resumen) y manda este mensaje.
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
const key=req=>req.url.split('?')[0];
const put=(req,r)=>{if(r&&r.ok&&r.type==='basic'){const cp=r.clone();caches.open(C).then(c=>c.put(key(req),cp))}return r};// QA-05: no cachear no-ok
// Respuesta desde caché marcada con x-from-cache: la app no acepta un plan más viejo que gt_plan_ok si viene de acá (§4.b)
const mark=m=>{if(!m)return m;const h=new Headers(m.headers);h.set('x-from-cache','1');return new Response(m.body,{status:m.status,statusText:m.statusText,headers:h})};
const fromCache=req=>caches.match(req,{ignoreSearch:true}).then(m=>m?mark(m):(req.mode==='navigate'?caches.match('index.html'):undefined));
// index/app.js/plan.json/navegación: network-first sin caché HTTP, con timeout → caché
function netFirst(req){return new Promise(res=>{let ok=false;const fin=r=>{if(!ok&&r){ok=true;clearTimeout(t);res(r)}};
 const t=setTimeout(()=>fromCache(req).then(fin),TO);
 fetch(req,{cache:'no-cache'}).then(r=>{put(req,r);return r.ok?fin(r):fromCache(req).then(m=>fin(m||r))})
  .catch(()=>fromCache(req).then(m=>{if(m)fin(m);else{clearTimeout(t);fin(Response.error())}}))})}
const cacheFirst=req=>caches.match(req,{ignoreSearch:true}).then(m=>m||fetch(req).then(r=>put(req,r)));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==location.origin)return;
 const base=new URL(self.registration.scope).pathname.replace(/\/$/,''),p=u.pathname.slice(base.length)||'/';
 e.respondWith(req.mode==='navigate'||NETFIRST.includes(p)?netFirst(req):cacheFirst(req))});
