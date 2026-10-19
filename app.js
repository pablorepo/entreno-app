// entreno-app v8 — el plan vive en plan.json (lo edita Coach); acá queda solo la app. Diseño: plan-vs-app.md (FINAL).
const APP_VERSION='12';// subir en cada versión de la app; plan.json puede pedir un mínimo con "minApp"
// Nombre visible de la app: cambiarlo SOLO acá (y en manifest.json name/short_name; ver README).
const APP_NAME='Entreno';document.title=APP_NAME;
const DC=['dom','lun','mar','mié','jue','vie','sáb'],DN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],DK=['dom','lun','mar','mie','jue','vie','sab'];
// Migración v2→v3 sin depender de plan.json: ids viejos del bloque 1 → slug + nombre (QA §5.5)
const B1='bloque-01',B1_START=new Date(2026,9,19),MAPB1={"A0":["hack-squat","Hack squat o péndulo"],"A1":["prensa-45","Prensa 45°"],"A2":["curl-femoral-acostado","Curl femoral acostado"],"A3":["extension-cuadriceps","Extensión de cuádriceps 90°→30°"],"A4":["abductora","Abductora"],"A5":["aductora","Aductora"],"A6":["gemelos-sentado","Gemelos sentado con discos"],"A7":["pallof-press","Pallof press en polea"],"A8":["elevacion-rodillas-silla-romana","Elevación de rodillas en silla romana"],"B0":["jalon-discos","Jalón con discos"],"B1":["press-inclinado-hammer","Press inclinado con discos (Hammer)"],"B2":["remo-t-pecho-apoyado","Remo T con pecho apoyado"],"B3":["press-hombros-maquina","Press de hombros en máquina"],"B4":["pec-deck-invertido","Pec deck invertido"],"B5":["laterales-polea","Laterales en polea"],"B6":["curl-scott-z","Curl Scott con barra Z"],"B7":["triceps-polea","Tríceps en polea"],"B8":["muneca-polea","Muñeca en polea, liviano (flexión y extensión)"],"C0":["prensa-explosiva","Prensa explosiva"],"C1":["hip-thrust-maquina","Hip thrust en máquina"],"C2":["rumano-smith","Rumano en Smith"],"C3":["remo-polea-baja-un-brazo","Remo en polea baja a un brazo"],"C4":["hiperextension-45","Hiperextensión 45°"],"C5":["patada-gluteo-maquina","Patada de glúteo en máquina"],"C6":["rotadora-tronco","Rotadora de tronco"],"C7":["final-bike-eliptico","Final: assault bike o elíptico"]};
const N=()=>Object.create(null);// mapas sin prototipo (evita __proto__)
const own=(o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k);
const okKg=n=>n>0&&n<=500;// peso corporal y meta
const okKgEj=n=>n>=0&&n<=500;// v12 (Coach L3): kg de ejercicio admite 0 = sin peso (vacío sigue siendo "sin dato" y borrar = kg:null en hist)
const num=v=>{const s=String(v??'').trim();return/^\d{1,3}([.,]\d{1,2})?$/.test(s)?parseFloat(s.replace(',','.')):NaN};
const sig=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};
// ---------- plan en uso ----------
let PL=null,PLNEXT=null,PLERR=null,PLTOAST=null,PLWARN=[],START=B1_START,ROUTINE=false;
const NW=()=>PL?PL.bloque.semanas:6,BLK=()=>PL?PL.bloque.id:B1,RUTS=()=>PL?PL.rutinas:[];
const rut=id=>RUTS().find(r=>r.id===id);
const isoDay=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);return new Date(+m[1],m[2]-1,+m[3])};
// Semana de calendario (v10): depende SOLO de la fecha. Lunes de inicio = S1; antes del inicio cuenta como S1; después de la última sigue (S7, S8…) con la prescripción de la última semana (wEff).
function week(){if(!PL)return 0;const t=new Date();t.setHours(0,0,0,0);const d=Math.round((t-START)/864e5);if(d<0)return 1;return Math.min(520,Math.floor(d/7)+1)}// tope 520 = mismo límite que load3
const inBlock=w=>w>=1;// v10: se registra en cualquier semana real (también 7, 8…)
const wkOfB=(dt,st)=>{const t=new Date(dt);t.setHours(0,0,0,0);const d=Math.round((t-st)/864e5);return d<0?0:Math.floor(d/7)+1};
const wTag=f=>{if(!PL)return null;const w=wkOfB(f,START);return w>=1?w:null};// semana real del plan: solo etiqueta (null antes del inicio)
const isDesc=w=>!!PL&&PL.bloque.descarga.includes(w);
const dmShort=d=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
// ---------- datos v2 (formato viejo, solo lectura) ----------
const DEF2=()=>({log:N(),hist:[],hechos:N(),peso:[],meta:''});
function esDate(s){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s||'');if(!m)return null;const d=new Date(+m[3],m[2]-1,+m[1],12);return isNaN(d)?null:d.toISOString()}
const wkDate1=w=>new Date(B1_START.getTime()+(w-1)*7*864e5+12*36e5).toISOString();
const name1=id=>own(MAPB1,id)?MAPB1[id][1]:String(id);
function parseV2(o){const d=DEF2();
 if(o.log&&typeof o.log==='object'&&!Array.isArray(o.log))for(const[k,v]of Object.entries(o.log))if(v&&typeof v==='object'){const e=N();for(const[w,kg]of Object.entries(v)){const n=+kg;if(okKg(n)&&+w>=1&&+w<=6)e[w]=n}d.log[k]=e}
 if(Array.isArray(o.hist))d.hist=o.hist.filter(x=>x&&typeof x.ex==='string'&&(x.kg===null||okKg(+x.kg))&&!isNaN(Date.parse(x.f))).map(x=>({ex:x.ex,e:String(x.e||name1(x.ex)),r:String(x.r||x.ex[0]||''),kg:x.kg===null?null:+x.kg,f:x.f,w:+x.w||0,...(x.mig?{mig:1}:{})}));
 if(o.hechos&&typeof o.hechos==='object')for(const[k,v]of Object.entries(o.hechos))if(v&&typeof v==='object'){d.hechos[k]=N();for(const w of Object.keys(v))if(+w>=1&&+w<=6)d.hechos[k][w]=1}
 if(Array.isArray(o.peso))d.peso=o.peso.filter(x=>x&&okKg(+x.kg)).map(x=>{const f=!isNaN(Date.parse(x.f))?x.f:esDate(x.d)||new Date(0).toISOString();const w=wkOfB(f,B1_START,6);return{kg:+x.kg,f,w:+x.w>=1&&+x.w<=6?+x.w:(w>=1&&w<=6?w:null)}});
 const m=num(o.meta);d.meta=m>0?m:(typeof o.meta==='number'&&okKg(o.meta)?o.meta:'');
 if(!d.hist.length)for(const id of Object.keys(d.log))for(const w of Object.keys(d.log[id]).map(Number).sort((a,b)=>a-b))d.hist.push({ex:id,e:name1(id),r:id[0]||'',kg:d.log[id][w],f:wkDate1(w),w,mig:1});
 d.hist.sort((a,b)=>a.f<b.f?-1:a.f>b.f?1:0);return d}
// ---------- datos v3 (gt_data3, por bloque + id) ----------
const DEF3=()=>({v:3,migratedAt:null,log:N(),hechos:N(),hist:[],nombres:N(),rutas:N(),peso:[],meta:'',v2sig:'',v2hechos:[],v2meta:''});
function legacyMapper(){const used=N(),m=N();return id=>{id=String(id);if(own(MAPB1,id))return MAPB1[id][0];if(own(m,id))return m[id];let s='legacy-'+(id.replace(/[^A-Za-z0-9]/g,'_')||'vacio'),t=s,k=2;while(own(used,t))t=s+'-'+k++;used[t]=1;return m[id]=t}}
function toV3(d2,migratedAt){const d=DEF3(),map=legacyMapper();d.migratedAt=migratedAt;d.log[B1]=N();d.hechos[B1]=N();
 for(const id of Object.keys(d2.log)){const x=map(id);d.log[B1][x]=Object.assign(N(),d2.log[id]);d.nombres[x]=name1(id)}
 for(const id of Object.keys(d2.hechos)){const x=map(id);d.hechos[B1][x]=Object.assign(N(),d2.hechos[id]);if(!own(d.nombres,x))d.nombres[x]=name1(id)}
 d.hist=d2.hist.map(x=>{const e=map(x.ex);if(!own(d.nombres,e))d.nombres[e]=x.e;return{blockId:B1,exId:e,e:x.e,r:x.r,kg:x.kg,f:x.f,w:x.w,...(x.mig?{mig:1}:{})}});
 d.peso=d2.peso;d.meta=d2.meta;return d}
const isV2shape=o=>(Array.isArray(o.hist)&&o.hist.some(x=>x&&own(x,'ex')))||(o.log&&typeof o.log==='object'&&Object.values(o.log).some(v=>v&&typeof v==='object'&&Object.values(v).some(x=>typeof x!=='object')));
function load3(o){const d=DEF3();d.migratedAt=typeof o.migratedAt==='string'?o.migratedAt:null;d.v2sig=typeof o.v2sig==='string'?o.v2sig:'';d.v2hechos=Array.isArray(o.v2hechos)?o.v2hechos.filter(x=>typeof x==='string'):[];d.v2meta=o.v2meta??'';
 for(const k of['log','hechos'])if(o[k]&&typeof o[k]==='object')for(const[b,exs]of Object.entries(o[k]))if(exs&&typeof exs==='object'){d[k][b]=N();for(const[id,ws]of Object.entries(exs))if(ws&&typeof ws==='object'){const e=N();for(const[w,v]of Object.entries(ws))if(+w>=1&&+w<=520&&(k==='hechos'?v:v!==null&&v!==''&&okKgEj(+v)))e[w]=k==='hechos'?1:+v;d[k][b][id]=e}}
 if(Array.isArray(o.hist))d.hist=o.hist.filter(x=>x&&(x.tipo==='alias'?typeof x.de==='string'&&typeof x.a==='string':typeof x.exId==='string'&&typeof x.blockId==='string'&&(x.kg===null||x.kg!==''&&okKgEj(+x.kg))&&!isNaN(Date.parse(x.f)))).map(x=>x.tipo==='alias'?{tipo:'alias',blockId:String(x.blockId||''),de:x.de,a:x.a,f:String(x.f||'')}:{blockId:x.blockId,exId:x.exId,e:String(x.e||x.exId),r:String(x.r||''),kg:x.kg===null?null:+x.kg,f:x.f,w:+x.w||0,...(x.mig?{mig:1}:{})});
 if(o.rutas&&typeof o.rutas==='object')for(const[k,v]of Object.entries(o.rutas))if(typeof v==='string')d.rutas[k]=v;
 if(o.nombres&&typeof o.nombres==='object')for(const[k,v]of Object.entries(o.nombres))if(typeof v==='string')d.nombres[k]=v;
 if(Array.isArray(o.peso))d.peso=o.peso.filter(x=>x&&okKg(+x.kg)&&!isNaN(Date.parse(x.f))).map(x=>({kg:+x.kg,f:x.f,w:Number.isInteger(x.w)&&x.w>=1?x.w:null}));
 const m=+o.meta;d.meta=okKg(m)?m:'';return d}
const hkeys2=d2=>Object.keys(d2.hechos).flatMap(id=>Object.keys(d2.hechos[id]).map(w=>id+'|'+w));
// S-3: merge append-only de lo que una app vieja haya escrito en gt_data después de migrar
function mergeV2(d,r2){let o;try{o=JSON.parse(r2)}catch(e){return 0}if(!o||typeof o!=='object')return 0;const d2=parseV2(o),c=toV3(d2,d.migratedAt),m=d.migratedAt||'';let n=0;
 const L=(d.log[B1]=d.log[B1]||N());
 for(const x of c.hist)if(!x.mig&&x.f>m&&!d.hist.some(y=>y.exId===x.exId&&y.f===x.f&&y.kg===x.kg)){d.hist.push(x);n++;if(x.w>=1&&x.w<=6){if(x.kg==null){if(L[x.exId])delete L[x.exId][x.w]}else(L[x.exId]=L[x.exId]||N())[x.w]=x.kg}}
 for(const x of c.peso)if(x.f>m&&!d.peso.some(y=>y.f===x.f&&y.kg===x.kg)){d.peso.push(x);n++}
 const old=new Set(d.v2hechos),map=legacyMapper(),H=(d.hechos[B1]=d.hechos[B1]||N());for(const k of hkeys2(d2))if(!old.has(k)){const[id,w]=k.split('|');(H[map(id)]=H[map(id)]||N())[w]=1;n++}
 if(String(d2.meta)!==String(d.v2meta)){d.meta=d2.meta;n++}
 d.v2sig=sig(r2);d.v2hechos=hkeys2(d2);d.v2meta=d2.meta;return n}
let DATAERR=false,STORERR=false,DIRTY=false,BADRAW='';
function bad(raw){BADRAW=raw;try{localStorage.setItem('gt_data_bad',raw)}catch(e){}DATAERR=true;return DEF3()}
function loadAll(){const r3=localStorage.getItem('gt_data3'),r2=localStorage.getItem('gt_data');
 if(r3){let o;try{o=JSON.parse(r3)}catch(e){return bad(r3)}if(!o||typeof o!=='object'||Array.isArray(o))return bad(r3);
  const d=isV2shape(o)?toV3(parseV2(o),typeof o.migratedAt==='string'?o.migratedAt:new Date().toISOString()):load3(o);if(isV2shape(o))DIRTY=true;
  if(r2&&sig(r2)!==d.v2sig){mergeV2(d,r2);DIRTY=true}return d}
 if(!r2)return DEF3();
 let o;try{o=JSON.parse(r2)}catch(e){return bad(r2)}if(!o||typeof o!=='object'||Array.isArray(o))return bad(r2);
 // gt_data queda CONGELADO (es la copia cruda): esta app nunca lo escribe (S-3)
 const d2=parseV2(o),d=toV3(d2,new Date().toISOString());d.v2sig=sig(r2);d.v2hechos=hkeys2(d2);d.v2meta=d2.meta;DIRTY=true;return d}
let D=DEF3(),cur=null,view=null;
function saveRaw(){try{localStorage.setItem('gt_data3',JSON.stringify(D));return true}catch(e){return false}}
function save(){if(saveRaw())return true;toast('No se pudo guardar (memoria llena o modo privado)',true);return false}// QA-08
// ---------- helpers por id (con alias de "renombres" en el bloque actual) ----------
function aliases(id){const ids=[id];const ren=PL&&PL.renombres||{};let add=true;while(add){add=false;for(const[de,a]of Object.entries(ren))if(ids.includes(a)&&!ids.includes(de)){ids.push(de);add=true}}return ids}
const logB=b=>D.log[b]||(D.log[b]=N()),hecB=b=>D.hechos[b]||(D.hechos[b]=N());
function logGet(b,id,w){for(const x of(b===BLK()?aliases(id):[id])){const v=D.log[b]&&D.log[b][x]&&D.log[b][x][w];if(v!=null)return v}return undefined}
function isDone(id,w){const H=D.hechos[BLK()];return !!H&&aliases(id).some(x=>H[x]&&H[x][w])}
function setDone(id,w,on){const H=hecB(BLK());if(on)(H[id]=H[id]||N())[w]=1;else for(const x of aliases(id))if(H[x])delete H[x][w]}
const histKg=()=>D.hist.filter(x=>!x.tipo);
// Prellenado (QA §3.a2): borrador > último no nulo del bloque actual > último no nulo de bloques anteriores (marcado) > vacío
function lastKg(id){const ids=aliases(id),b=BLK();let cb=null,ob=null;for(const x of histKg())if(x.kg!=null&&(x.blockId===b?ids.includes(x.exId):x.exId===id)){if(x.blockId===b){if(!cb||x.f>=cb.f)cb=x}else if(!ob||x.f>=ob.f)ob=x}
 return cb?{kg:cb.kg,prev:false}:ob?{kg:ob.kg,prev:true}:null}
function lastInBlock(id){const ids=aliases(id),b=BLK();let r;for(const x of histKg())if(x.blockId===b&&ids.includes(x.exId)&&(!r||x.f>=r.f))r=x;return r}
const nombreDe=id=>{for(const r of RUTS())for(const e of r.ejercicios)if(e.id===id)return e.nombre;return D.nombres[id]||id};
// v12 (Coach L7): se quita el prefijo 'Final:' ANTES y se pone en mayúscula la primera letra ('Final: assault bike…' → 'Assault bike o elíptico')
const short=n=>{const s=String(n).replace(/^\s*final\s*:\s*/i,'').replace(/\s*\(.*?\)/g,'').replace(/,.*$/,'').trim();return s.charAt(0).toLocaleUpperCase('es')+s.slice(1)};
// v12 (Coach L7): series cortas para el Resumen sin texto fijo: cualquier par de tiempos «(N″ algo / M″ algo)» → «(N″/M″)»
const seriesCortas=s=>String(s).replace(/ por lado/g,' c/lado').replace(/ por pierna/g,' c/pierna').replace(/\(\s*(\d+(?:[.,]\d+)?\s*[″"′']+)[^()/]*\/\s*(\d+(?:[.,]\d+)?\s*[″"′']+)[^()]*\)/g,'($1/$2)');
const corto=e=>e.nombreCorto||short(e.nombre);
// ---------- UI base ----------
const $=id=>document.getElementById(id),app=()=>$('app');
// ---------- v11: set de íconos propio (SVG inline, grilla 24, trazo 2,5, extremos/uniones redondeados, currentColor). Lámina: capturas-v11-propuesta/iconos.png ----------
const ICP={
inicio:'<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
check:'<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
listo:'<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5 10.5 15.5 16.5 9"/>',
alerta:'<path d="M12 3.5 2.5 20h19Z"/><path d="M12 9.5v5"/><path d="M12 17.5h.01"/>',
actualizar:'<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.5h-4.5"/>',
alternativa:'<path d="M4 8h15"/><path d="M15.5 4.5 19 8l-3.5 3.5"/><path d="M20 16H5"/><path d="M8.5 12.5 5 16l3.5 3.5"/>',
ajustes:'<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 5.5v-3M12 18.5v3M5.5 12h-3M18.5 12h3M7.4 7.4 5.3 5.3M16.6 16.6l2.1 2.1M7.4 16.6l-2.1 2.1M16.6 7.4l2.1-2.1"/>',
meta:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12h.01"/>',
peso:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M7.5 10a6 6 0 0 1 9 0"/><path d="M12 10.5l1.5-2.5"/>',
historial:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M9.5 9.5v10M15 9.5v10"/>',
metricas:'<path d="M3.5 20h17"/><path d="M4.5 16 9.5 11l3.5 3.5 6.5-7"/><path d="M15 7.5h4.5V12"/>',
exportar:'<path d="M12 3.5v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 16.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2.5"/>',
borrar:'<path d="M4 6.5h16"/><path d="M9.5 6.5V4h5v2.5"/><path d="M6 6.5 7 20h10l1-13.5"/><path d="M10 10.5v6M14 10.5v6"/>',
descanso:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10"/><path d="M9.5 2.5h5M12 2.5V6"/><path d="M18 6.5l1.5-1.5"/>',
formato:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
superserie:'<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>',
carga:'<path d="M7 6.5v11M17 6.5v11M3.5 9.5v5M20.5 9.5v5M7 12h10"/>',
trofeo:'<path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z"/><path d="M7.5 6h-3a3.5 3.5 0 0 0 3.5 4.5M16.5 6h3a3.5 3.5 0 0 1-3.5 4.5"/><path d="M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5"/>',
atras:'<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
siguiente:'<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
izq:'<path d="M15 5l-7 7 7 7"/>',
der:'<path d="M9 5l7 7-7 7"/>'};
const ic=(n,c)=>`<svg class="ic${c?' '+c:''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICP[n]}</svg>`;
// v11: el contenido del plan puede traer emojis (objetivo de semana); en pantalla se quitan (el plan.json no se toca)
const noEmo=t=>String(t??'').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,'').replace(/\s{2,}/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));// S-1: todo lo del plan pasa por acá
const fmt=v=>v===''||v==null?'':String(v).replace('.',',');
// V7-02: ignora toques durante NAVMS tras cada cambio de pantalla (doble toque)
const NAVMS=typeof window.__NAVLOCK_MS==='number'?window.__NAVLOCK_MS:600;let navUntil=0;
document.addEventListener('click',e=>{if((Date.now()<navUntil||hechoT&&!(e.target.closest&&e.target.closest('[data-act=hecho]')))&&e.target.closest&&e.target.closest('#app button,#app a,#app [data-act]')){e.preventDefault();e.stopImmediatePropagation()}},true);
function h(html){app().innerHTML=html;window.scrollTo(0,0);navUntil=Date.now()+NAVMS;fit();queueMicrotask(fitAll)}
// UX v10: agranda la fuente hasta llenar el espacio sin desbordar (búsqueda binaria, entero de px). Corre después de shrinkEx (microtask al final de h()).
function fitFont(el,min,max,ok){if(!el)return;el.style.fontSize=max+'px';if(ok())return;let lo=min,hi=max;el.style.fontSize=lo+'px';if(!ok())return;while(hi-lo>1){const m=Math.floor((lo+hi)/2);el.style.fontSize=m+'px';if(ok())lo=m;else hi=m}el.style.fontSize=lo+'px'}
// demo v12 (Pablo 19/10): 'Última' queda fija a 44px como en v11; solo el input de kg se ajusta (56px, baja hasta 36) para que el número no se corte.
// El tamaño se calcula con el peor valor tipeable, así no cambia mientras se tipea. v12.2: '888,88' (la demo usaba '888,8', pero num() acepta 2 decimales
// y '199,75' se cortaba a 56px: 178px de texto en 147px de interior).
const fitKg=()=>{const k=$('kg');if(!k)return;const v=k.value;k.value='888,88';let px=56;
 for(;px>36;px--){k.style.fontSize=px+'px';if(k.scrollWidth<=k.clientWidth)break}k.style.fontSize=px+'px';k.value=v};
function fitAll(){const a=app();if(!a)return;
 const tb=a.querySelector('.grow>table');if(tb){const no=()=>over()||tb.scrollWidth>tb.parentElement.clientWidth+1;// QA M-1/M-2: Historial siempre entero. 1) sin letra grande (.cn) si no entra; 2) último recurso: nombres en 2 líneas y corte en cualquier letra (.c2)
  if(tb.classList.contains('cn')&&no())tb.classList.add('cs');if(tb.classList.contains('cn')&&no())tb.classList.remove('cn','cs');if(no())tb.classList.add('c2')}
 const sr=a.querySelector('.exg>.sr'),inf=a.querySelector('.exg>.info'),cg=a.querySelector('.exg>.carga');for(const x of[sr,inf,cg])if(x)x.style.fontSize='';// demo v12: base fija antes de repartir (fitAll corre más de una vez)
 fitKg();// demo v12: primero el input de kg (ancho); después el cue reparte el alto
 const n=a.querySelector('.exg>.note');// v12: en el ejercicio, ajuste estricto (sin el 1px de tolerancia de over()) para que el cue no quede cortado 1px en el peor caso
 const eg=a.querySelector('.exg'),ok2=()=>!over()&&(!eg||[...eg.children].every(c=>c.getBoundingClientRect().bottom<=eg.getBoundingClientRect().bottom+.5));
 if(n){const t=a.querySelector('h2'),ts=t?Math.round(parseFloat(getComputedStyle(t).fontSize)):28;fitFont(n,Math.min(22,ts),ts,ok2)}// v10: cue del mismo tamaño que el título (h2); solo achica si no entra
 // demo v12: el alto que sobra con el cue topeado en 28px agranda las series (52→72px, solo si siguen en 1 línea); el kg se achica (56→36) si el número no entra en el recuadro
 if(sr&&n&&!sr.classList.contains('c')&&!sr.classList.contains('l')){const one=()=>sr.getBoundingClientRect().height<=parseFloat(getComputedStyle(sr).fontSize)*1.2+2;if(one())fitFont(sr,52,72,()=>ok2()&&one())}
 if(n&&inf&&!inf.classList.contains('alt1'))fitFont(inf,22,28,ok2);if(n&&cg&&!cg.classList.contains('inbox'))fitFont(cg,22,28,ok2);// demo v12: después, info y carga hasta 28px
 const cl=a.querySelector('ul.cl.grow');if(cl)fitFont(cl,22,30,()=>!over()&&cl.scrollHeight<=cl.clientHeight+1);// v11: Peso y Cambios agrandan la letra si sobra alto
 const s=a.querySelector('ol.sum,ul.sum,.sum');if(s)fitFont(s,21,26,()=>!over()&&s.scrollHeight<=s.clientHeight+1);
 const t=a.querySelector('#tt');if(t&&!t.classList.contains('tdone'))fitFont(t,120,200,()=>t.scrollWidth<=t.parentElement.clientWidth&&!over())}
addEventListener('resize',()=>fitAll());addEventListener('orientationchange',()=>setTimeout(fitAll,150));document.fonts&&document.fonts.ready.then(()=>fitAll());
// Elementos .opt (línea del bloque, banners en Resumen) solo se muestran si entran sin scroll
function over(){const a=app();if(a.scrollHeight>a.clientHeight+1)return true;return[...a.querySelectorAll('.grow')].some(g=>{const b=g.getBoundingClientRect().bottom;return[...g.children].some(c=>c.getBoundingClientRect().bottom>b+1)})}
function fit(){for(const el of[...app().querySelectorAll('.opt')]){if(!over())break;el.remove()}}
// Toasts de a uno, en cola; los normales (Guardado) tienen prioridad sobre "Plan actualizado"
let TT=null,TCUR=null,TQ=[];
function toast(msg,bad,o={}){const it={msg,bad:!!bad,dur:o.dur||(bad?2500:1200),plan:!!o.plan};if(it.plan&&TCUR){TQ.push(it);return}if(!it.plan&&TCUR&&TCUR.plan)TQ.unshift(TCUR);showT(it)}
function showT(it){document.querySelector('.toast')?.remove();clearTimeout(TT);TCUR=it;const t=document.createElement('div');t.className='toast'+(it.bad?' bad':'');t.setAttribute('role',it.bad?'alert':'status');t.setAttribute('aria-live',it.bad?'assertive':'polite');{let m=String(it.msg),pre='',post='';if(it.bad)pre=ic('alerta');else if(m.startsWith('✓ ')){pre=ic('check');m=m.slice(2)}if(m.endsWith(' 💪')){m=m.slice(0,-3);post=ic('trofeo')}t.innerHTML=pre+`<span>${esc(m)}</span>`+post}document.body.appendChild(t);TT=setTimeout(()=>{t.remove();TCUR=null;const n=TQ.shift();if(n)showT(n)},it.dur)}
// ---------- v10: sin bloqueo (Pablo, 17/10 10:27): se quitó el bloqueo con huella/cara por completo. Migración: al arrancar se borran gt_cred y gt_fails; los datos no se tocan ----------
let resume=null;
function afterBoot(){if(DATAERR)return dataError();if(STORERR)return storageError();if(!PL)return noPlan();const r=resume;resume=null;(r||home)()}
function keepDraft(){const k=$('kg');if(k&&cur)cur.draft=k.value}
document.addEventListener('visibilitychange',()=>{if(document.hidden)keepDraft();else REG&&REG.update().catch(()=>{})});
function dataError(){view=dataError;h(`<div class=grow><div class=wk>${ic('alerta','em')}</div><h1 class=today>No se pudieron leer los datos guardados.</h1><p style="font-size:22px;margin-top:10px">Guardé una copia. Podés exportarla o empezar de cero.</p></div>
 <button class="big bi" data-act=exportBad>${ic('exportar')}Exportar copia</button><button class="big acc bi" data-act=resetData>${ic('borrar')}Empezar de cero</button>`)}
function exportBad(){download(localStorage.getItem('gt_data_bad')||BADRAW||'','entrenamiento-copia-datos.txt','text/plain');toast('✓ Copia exportada')}
function storageError(){view=storageError;h(`<div class=grow><div class=wk>${ic('alerta','em')}</div><h1 class=today>No hay espacio para guardar los datos.</h1><p style="font-size:22px;margin-top:10px">Tus datos están cargados, pero no se pudieron guardar en el celular. Exportá un respaldo ahora.</p></div>
 <button class="big acc bi" data-act=exportar>${ic('exportar')}Exportar respaldo</button><button class="big bi" data-act=storeOk>Seguir igual${ic('siguiente')}</button>`)}
// Borrar todos los datos (v10): pantalla de confirmación + confirm() final. Borra kilos, hechos, historial, peso, meta y copias viejas (gt_data3, gt_data, gt_data_bad).
// NO toca el plan (gt_plan_ok).
function borrarTodo(){view=borrarTodo;h(`${topBar()}<h1 class=ttl>${ic('borrar')}Borrar todos los datos</h1><div class=grow>
 <p style="font-size:22px;margin:8px 0">Se borran <b>todos</b> tus registros de este celular: kilos, ejercicios hechos, historial, peso corporal y meta.</p>
 <p class=muted style="margin:8px 0">No se puede deshacer. Si querés guardar una copia, exportá un respaldo antes.</p>
 <p class=muted style="margin:8px 0">El plan se mantiene.</p></div>
 <button class="big bi" data-act=exportar>${ic('exportar')}Exportar respaldo</button><button class="big del2 bi" data-act=borrarSi>${ic('borrar')}Sí, borrar todo</button><button class="big bi" data-act=ajustes>${ic('atras')}Cancelar</button>`)}
let BORRANDO=false;
async function borrarSi(){if(BORRANDO)return;if(!confirm('¿Seguro? Se borran todos los datos de la app y no se pueden recuperar.'))return;
 BORRANDO=true;try{
 // QA A-1: se borra TODA clave gt_* salvo el plan (gt_plan_ok): gt_data3, gt_data, gt_data_bad, gt_data_v*_backup (v7/v7.1) y cualquier otra
 try{const KEEP=new Set(['gt_plan_ok']);for(const k of Object.keys(localStorage))if(k.startsWith('gt_')&&!KEEP.has(k))localStorage.removeItem(k)}catch(e){}
 D=DEF3();cur=null;BADRAW='';DATAERR=false;if(!save())return;home();toast('✓ Datos borrados')}finally{BORRANDO=false}}
function resetData(){if(!confirm('¿Empezar de cero? La copia de los datos viejos queda guardada.'))return;D=DEF3();if(save()){DATAERR=false;home()}}
// ---------- plan.json: carga, validación y fallback (plan-vs-app.md §4) ----------
function planOk(){try{const o=JSON.parse(localStorage.getItem('gt_plan_ok')||'null');if(o&&o.plan&&!validarPlan(o.plan,{appVersion:APP_VERSION}).fatal.length)return o.plan}catch(e){}return null}
function dataIds(b){const s=new Set();for(const k of['log','hechos'])for(const[id,ws]of Object.entries(D[k][b]||{}))if(Object.keys(ws).length)s.add(id);for(const x of histKg())if(x.blockId===b)s.add(x.exId);return s}
function applyPlan(o){PL=o;START=isoDay(o.bloque.inicio);let ch=false;
 for(const r of o.rutinas)for(const e of r.ejercicios){const k=o.bloque.id+'|'+e.id;if(D.nombres[e.id]!==e.nombre||D.rutas[k]!==r.id){D.nombres[e.id]=e.nombre;D.rutas[k]=r.id;ch=true}}
 for(const[de,a]of Object.entries(o.renombres||{}))if(!D.hist.some(x=>x.tipo==='alias'&&x.blockId===o.bloque.id&&x.de===de&&x.a===a)){D.hist.push({tipo:'alias',blockId:o.bloque.id,de,a,f:new Date().toISOString()});ch=true}
 if(ch&&!DATAERR)saveRaw()}
const planFail=(msg,upd)=>{PLERR={msg:String(msg),upd:!!upd};console.warn('plan.json:',msg);return false};
// v11 (QA B-12): si plan.json no responde en 8 s (primera instalación con mala señal) → 'No se pudo cargar el plan' en vez de 'Cargando…' infinito
const PLAN_TO=typeof window.__PLAN_TO==='number'?window.__PLAN_TO:8000;
async function loadPlan(){let res,txt,fromCache=false;
 try{const ac=typeof AbortController==='function'?new AbortController():null,tm=setTimeout(()=>ac&&ac.abort(),PLAN_TO);try{res=await fetch('plan.json',{cache:'no-cache',signal:ac?ac.signal:undefined});txt=res.ok?await res.text():''}catch(e){throw e.name==='AbortError'?new Error('sin respuesta en '+PLAN_TO/1000+' s'):e}finally{clearTimeout(tm)}fromCache=res.headers.get('x-from-cache')==='1';if(!res.ok)throw new Error('HTTP '+res.status)}catch(e){return planFail('No se pudo descargar el plan ('+e.message+')')}
 if(txt.length>65536)return planFail('plan.json supera 64 KB');
 let o;try{o=JSON.parse(txt)}catch(e){return planFail('plan.json no es JSON válido')}
 const prev=planOk(),b=o&&o.bloque&&o.bloque.id;
 const v=validarPlan(o,{appVersion:APP_VERSION,datos:{blockId:b,ids:[...dataIds(b)]},prev});
 if(v.fatal.length)return planFail(v.fatal[0],v.upd);
 if(prev&&o.planVersion<prev.planVersion&&fromCache){PLERR=null;return true}// sin volver a un plan viejo desde la caché
 PLWARN=[...v.warn,...v.largos,...v.check,...v.priv];PLWARN.forEach(x=>console.warn('plan.json (aviso):',x));
 const changed=!prev||JSON.stringify(prev)!==JSON.stringify(o);
 try{localStorage.setItem('gt_plan_ok',JSON.stringify({plan:o,planVersion:o.planVersion,at:new Date().toISOString()}))}catch(e){}
 PLERR=null;if(changed&&prev)PLTOAST='✓ Plan actualizado: Bloque '+o.bloque.numero;
 if(!PL||!ROUTINE)applyPlan(o);else PLNEXT=o;return true}
function retryPlan(){loadPlan().then(ok=>{if(ok)toast('✓ Plan cargado');if(!PL)return noPlan();home()})}
function noPlan(){view=noPlan;h(`<div class=grow><div class=wk>${ic('alerta','em')}</div><h1 class=today>No se pudo cargar el plan de entrenamiento.</h1><p style="font-size:22px;margin-top:10px">Tus kg y tu peso están guardados. Probá de nuevo con conexión.</p></div>
 <button class="big acc bi" data-act=retryPlan>${ic('actualizar')}Reintentar</button><div class=row><button class="mid bi" data-act=peso>${ic('peso')}Peso</button><button class="mid bi" data-act=exportar>${ic('exportar')}Exportar</button></div>`)}
// ---------- banners (solo Inicio y Resumen, nunca en una rutina) ----------
let REG=null,newVer=false,reloading=false;
function banners(){const two=newVer&&PLERR,o=[];
 if(newVer)o.push(`<div class=banner role=status>${ic('actualizar')}<span>Versión nueva</span><button data-act=actualizar>Actualizar</button></div>`);
 if(PLERR)o.push(PLERR.upd?`<div class="banner warn" role=alert>${ic('alerta')}<span>Plan nuevo: actualizá la app</span><button data-act=actualizar>Actualizar</button></div>`:`<div class="banner warn" role=alert>${ic('alerta')}<span>${two?'Plan nuevo no cargó':'No se pudo cargar el plan nuevo'}</span><button data-act=retryPlan>Reintentar</button></div>`);
 return{html:o.join(''),n:o.length}}
function actualizar(){reloading=true;if(REG&&REG.waiting)REG.waiting.postMessage('skipWaiting');else location.reload()}
function ajustes(){view=ajustes;h(`${topBar()}<h1 class=ttl>${ic('ajustes')}Ajustes</h1><div class="grow aj">
 <p class=muted style="margin:12px 0">Tus datos quedan solo en este celular. Exportá un respaldo de vez en cuando.</p><button class="big bi" data-act=exportar>${ic('exportar')}Exportar respaldo</button>
 <button class="big del bi" data-act=borrarTodo style="margin-top:16px">${ic('borrar')}Borrar todos los datos</button>
 <p class="muted sm2" style="margin-top:12px">App ${APP_VERSION}${PL?` · Plan v${PL.planVersion} · Bloque ${PL.bloque.numero}`:''}</p>${PLERR?`<p class="err sm2">${ic('alerta')} Plan: ${esc(PLERR.msg)}</p>`:''}${PLWARN.length?`<p class="muted sm2">Avisos del plan: ${PLWARN.length} (${esc(PLWARN[0])})</p>`:''}</div>`)}
const wtxt=w=>`Semana ${w} de ${NW()}${w<=NW()&&isDesc(w)?' · Descarga':''}`;
function wlabel(){return wtxt(week())}
// demo v12 (Pablo 19/10): Inicio arriba a la izquierda solo con el ícono de la casita (56×56, aria-label)
const topBar=(t)=>`<div class=top><button class="back bi home1" data-act=home aria-label=Inicio>${ic('inicio')}</button><span class=wl>${wlabel()}</span></div>${t?`<h1 class=vh>${esc(t)}</h1>`:''}`;
// ---------- home ----------
function home(){ROUTINE=false;if(PLNEXT){applyPlan(PLNEXT);PLNEXT=null}if(!PL)return noPlan();view=home;
 const w=week(),dw=new Date().getDay(),ag=PL.agenda[DK[dw]]||{},B=banners();
 const wt=wtxt(w),we=wEff();
 const wn=PL.semanas&&PL.semanas[we]&&PL.semanas[we].nota?`<p class="wnote${B.n>1?' one':''}">${esc(noEmo(PL.semanas[we].nota))}</p>`:'';
 const obj=B.n<2&&PL.semanas&&PL.semanas[we]?`<p class=obj>${ic('meta')} ${esc(noEmo(PL.semanas[we].objetivo))}</p>`:'';
 h(`${B.html}<p class=brand>${APP_NAME}</p><h1 class=wk>${wt}</h1><p class="blk opt">Bloque ${PL.bloque.numero} · ${esc(PL.bloque.nombre)}</p><p class=ini>Inicio del plan: ${DC[START.getDay()]} ${dmShort(START)}/${START.getFullYear()}</p>${obj}${wn}
 <p class=today>Hoy (${DN[dw]}): <b>${esc(ag.rutina?'Rutina '+ag.rutina:ag.texto||'')}</b></p><div class=grow></div>
 ${RUTS().map(r=>`<button class="big ${r.id===ag.rutina?'acc':''}" data-act=resumen data-a="${esc(r.id)}">${esc(r.titulo)}</button>`).join('')}
 <div class="hgrid${B.n>1?' b2':''}"><button class="mid bi" data-act=peso>${ic('peso')}Peso</button><button class="mid bi" data-act=hist>${ic('historial')}Historial</button><button class="mid bi" data-act=metricas>${ic('metricas')}Métricas</button><button class="mid bi" data-act=ajustes>${ic('ajustes')}Ajustes</button></div><p class=ver>Versión ${APP_VERSION}</p>`);
 if(PLTOAST){toast(PLTOAST,false,{plan:true,dur:2500});PLTOAST=null}}
// ---------- resumen + guía ----------
const firstPending=r=>{const w=week();return inBlock(w)?exs(r).findIndex(e=>!isDone(e.id,w)):0};
function resumen(rid){const r=rut(rid);if(!r)return home();if(!cur||cur.r!==rid)cur={r:rid,i:0};ROUTINE=true;view=()=>resumen(rid);const w=week(),inB=inBlock(w),B=banners(),fp=firstPending(r);
 h(`${topBar()}${B.html.replace(/class="banner/g,'class="opt banner').replace(/class=banner/g,'class="opt banner"')}<h2>${esc(r.titulo)}${inB?` <span class=cnt>${exs(r).filter(e=>isDone(e.id,w)).length}/${exs(r).length} ${ic('check')}</span>`:''}</h2><ol class="sum grow">${exs(r).map((e,i)=>{const L=lastKg(e.id),ok=inB&&isDone(e.id,w);
  return`<li data-act=goEx data-a="${i}" role=button tabindex=0>${ok?`<span class=ok role=img aria-label=Hecho>${ic('check')}</span>`:`<span class=no>${i+1}</span>`}<span class=tx><span class=nm2>${e.grupo&&grupoDe(exs(r),i)?ic('superserie'):''}${esc(corto(e))}</span> <b>${esc(seriesCortas(eff(e).series))}${L?` · ${fmt(L.kg)} kg`:''}</b></span></li>`}).join('')}</ol>
 <button class="big acc bi" data-act=start data-a="${esc(rid)}">${fp<0?'Repasar':'Empezar'}${ic('der')}</button>`)}
function start(rid){const r=rut(rid);if(!r)return;const fp=firstPending(r);cur={r:rid,i:fp<0?0:fp};ex()}
function goEx(i){const r=rut(cur&&cur.r||'');if(!r)return;cur={r:r.id,i:Math.min(Math.max(0,+i||0),exs(r).length-1)};ex()}
// v8.1: semana efectiva (antes del bloque = semana 1; después = última), ejercicios visibles (omitirEn) y valores por semana (porSemana)
const wEff=()=>{const w=week();return w<1?1:w>NW()?NW():w};
const exs=r=>r.ejercicios.filter(e=>!(e.omitirEn||[]).includes(wEff()));
const eff=e=>{const o=e.porSemana&&e.porSemana[wEff()];return o?{...e,...o}:e};
function grupoDe(E,i){const g=E[i].grupo;if(!g)return null;let a=i,b=i;while(a>0&&E[a-1].grupo===g)a--;while(b<E.length-1&&E[b+1].grupo===g)b++;if(a===b)return null;return{otros:E.slice(a,b+1).filter((_,k)=>k+a!==i),ultimo:i===b}}
const descDe=e=>e.descanso??(PL.defaults&&PL.defaults.descanso)??'—';
const vidUrl=id=>'https://www.youtube.com/watch?v='+encodeURIComponent(String(id||''));
const nextPending=(r,i,w)=>{const n=exs(r).length;for(let k=1;k<n;k++){const j=(i+k)%n;if(!isDone(exs(r)[j].id,w))return j}return -1};
function ex(){const r=rut(cur.r);if(!r)return home();ROUTINE=true;view=ex;const E=exs(r);if(cur.i>=E.length)cur.i=E.length-1;const i=cur.i,e0=E[i],e=eff(e0),G=grupoDe(E,i),w=week(),inB=inBlock(w),L=lastKg(e.id),done=inB&&isDone(e.id,w),val=cur.draft??fmt(L?L.kg:''),d=G&&!G.ultimo?'—':descDe(e);
 const sinD=G&&!G.ultimo;
 // UX v8 (ux-revision.md "Campos nuevos del plan"): superserie en la fila .st; tempo en la línea de descanso/RPE; carga en línea propia; formato solo sin kg
 const ssTxt=G?esc(G.otros.map(corto).join(' y ')):'',ssLab=G?`aria-label="Superserie con ${ssTxt}"`:'';
 // v11 (BACKLOG): sin cartel/chip HECHO arriba; el estado lo muestra solo el botón Hecho (relleno = hecho, borde = pendiente)
 const st=G?`<div class=st><p class=ss ${ssLab}>${ic('superserie')}<span>Superserie con ${ssTxt}</span></p></div>`:`<p class="muted sm2 hd">${esc(r.titulo)}</p>`;
 const sinKg=e0.registraKg===false;
 h(`${topBar('Entrenamiento')}${st}<h2><span class=vh>Ejercicio ${i+1} de ${E.length}: </span><span class=exn aria-hidden=true>${i+1}/${E.length}</span> ${esc(e.nombre)}</h2>
 <div class="grow exg"><i class=sp0></i><div class="sr${[...e.series].length>14?' l':''}">${esc(e.series)}</div>${sinKg&&e.formato?`<p class=fmt>${ic('formato')} ${esc(e.formato)}</p>`:''}<i class=sp></i><p class=info>${sinD||d==='—'?'':`${ic('descanso')} ${esc(d)} · `}RPE ${esc(e.rpe)}${e.tempo?` · Tempo ${esc(e.tempo)}`:''}<span class=alt>${ic('alternativa')} ${esc(e.alternativa)}</span></p>${e.carga?`<p class=carga>${ic('carga')} ${esc(e.carga)}</p>`:''}<i class=sp></i><p class=note>${esc(e.nota)}</p><i class=sp0></i></div>
 ${sinKg?'':`<div class=kgrow><div class=lastbox>Última<br><b>${L?fmt(L.kg):'—'}</b>${L&&L.prev?'<small class=prevb>bloque ant.</small>':''}</div><label for=kg class=vh>Kilos</label><input id=kg class=kg type=text inputmode=decimal value="${esc(val)}" placeholder="kg"><span class=kgl>kg</span></div>`}
 <div class="row exb1">${sinD?'<span class="mid nodesc">Sin descanso</span>':d!=='—'?`<button class="mid bi tmr" data-act=timerI data-a="${i}">${ic('descanso')}${esc(d)}</button>`:''}<button class="mid nb hecho bi${done?' on':''}" data-act=hecho aria-pressed=${done}>${ic('check')}Hecho</button></div>
 <div class="row exb2"><a class="mid vid" href="${esc(vidUrl(e.video))}" target=_blank rel=noopener aria-label="Ver video del ejercicio">Video</a><button class="mid arr" data-act=done data-a=-1 aria-label=Anterior>${ic('atras')}</button><button class="mid arr" data-act=done data-a=1 aria-label=Siguiente>${ic('siguiente')}</button></div>`);
 // demo v12 (Pablo 19/10): fila grande Timer | Hecho; debajo, más chica, Video ← →
 shrinkEx()}
// Orden de reducción de UX si el ejercicio no entra: 1) alternativa en 1 línea, 2) series 44→36px, 3) carga a 18px dentro de "Última". La nota técnica nunca se recorta (mín. 22px; fitAll la agranda hasta 44px si sobra alto).
function shrinkEx(){const a=app(),steps=[()=>a.querySelector('.info')?.classList.add('alt1'),()=>a.querySelector('.sr')?.classList.add('c'),()=>{const c=a.querySelector('.carga'),lb=a.querySelector('.lastbox');if(!c)return;if(lb){c.classList.add('inbox');lb.appendChild(c)}else c.classList.add('s18')},()=>a.querySelector('.exg')?.classList.add('tight')];// v11: 4) separadores del bloque central a 4px
 for(const s of steps){if(!over())break;s()}}
let TI=null;function timer(s){view=ex;clearInterval(TI);let t=s.includes('′')?parseInt(s)*60:parseInt(s);const f=()=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
 h(`${topBar('Descanso')}<p class=today>Descanso</p><div class=grow style="display:flex;align-items:center;justify-content:center"><div class=tbig id=tt aria-live=polite>${f()}</div></div><button class="big acc bi" data-act=backEx>${ic('atras')}Volver al ejercicio</button>`);
 TI=setInterval(()=>{t--;const el=$('tt');if(!el)return clearInterval(TI);if(t>0)el.textContent=f();else{clearInterval(TI);navigator.vibrate&&navigator.vibrate([400,200,400]);ex()}},1000)}// v12 (Pablo 19/10): al llegar a 0 vibra y vuelve solo al ejercicio, sin '¡Dale!' y sin toast (pedido del Dev Lead, la demo tenía toast); el kg tipeado viaja en cur.draft (keepDraft al abrir el timer)
function addHist(id,kg,w){D.hist.push({blockId:BLK(),exId:id,e:nombreDe(id),r:cur.r,kg,f:new Date().toISOString(),w})}// append-only (salvo setHistKg)
// v12 (Pablo 19/10): mismo día = misma fecha en hora LOCAL del teléfono. Si el último registro de ese ejercicio (bloque actual, con alias) es de hoy, de la misma semana,
// tiene kg (no es un borrado) y no es migrado/aproximado, se reemplaza su kg y su hora en vez de agregar otro. Cualquier otro caso agrega (append-only).
const dayL=f=>{const d=new Date(f);return isNaN(d)?'':d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function setHistKg(id,kg,w){const lb=lastInBlock(id),now=new Date();if(kg!=null&&lb&&lb.kg!=null&&!lb.mig&&lb.w===w&&dayL(lb.f)===dayL(now)){lb.kg=kg;lb.f=now.toISOString();lb.e=nombreDe(id);lb.r=cur.r;return 'rep'}addHist(id,kg,w);return 'add'}
function saveKg(){const k=$('kg');if(!k)return true;const s=k.value.trim(),id=exs(rut(cur.r))[cur.i].id,w=week(),inB=inBlock(w),Lb=logB(BLK());
 if(s===''){if(inB&&logGet(BLK(),id,w)!=null){for(const x of aliases(id))if(Lb[x])delete Lb[x][w];addHist(id,null,w);if(!save())return false;toast(`✓ Borrado (S${w})`)}return true}
 const v=num(s);if(!okKgEj(v)){k.classList.add('bad');k.focus();toast('Número no válido. Ej: 82,5 (0 = sin peso)',true);return false}
 if(!inB)return true
 const prev=logGet(BLK(),id,w),lb=lastInBlock(id);(Lb[id]=Lb[id]||N())[w]=v;
 if(!lb||lb.kg!==v)setHistKg(id,v,w);if(!save())return false;if(prev!==v){navigator.vibrate&&navigator.vibrate(30);toast(`✓ Guardado: ${fmt(v)} kg (S${w})`)}return true}
function done(d){if(saveKg())nav(d)}
const completa=rid=>{cur.draft=undefined;resumen(rid);setTimeout(()=>toast('✓ Rutina completa 💪'),50)};
// ✓ Hecho (v9): vacío (outline) si está pendiente; al tocarlo se llena (amarillo), guarda kg + marca y, tras HECHO_MS, va al siguiente PENDIENTE (dando la vuelta); si no queda ninguno → Rutina completa.
// Las flechas ← → solo guardan kg y navegan: NUNCA marcan hecho. Al volver a un ejercicio hecho el botón se ve lleno.
const HECHO_MS=typeof window.__HECHO_MS==='number'?window.__HECHO_MS:350;let hechoT=null;
// v11 (BACKLOG, bug): Hecho es un toggle; vale el último estado. Tocar un ejercicio hecho lo desmarca (Métricas/sesión ≥50% se recalculan solas: se leen de D.hechos).
// Tocarlo de nuevo durante la pausa de HECHO_MS cancela el avance y desmarca.
const hechoBtn=on=>{const b=app().querySelector('[data-act=hecho]');if(b){b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}};
function hecho(){const r=rut(cur.r),e=exs(r)[cur.i],w=week();
 if(hechoT){clearTimeout(hechoT);hechoT=null;setDone(e.id,w,false);if(!save())return;hechoBtn(false);return}
 if(!saveKg())return;
 if(!inBlock(w)){if(cur.i>=exs(r).length-1){cur.draft=undefined;return resumen(r.id)}return nav(1)}
 const go=()=>{hechoT=null;const j=nextPending(r,cur.i,w);if(j<0)return completa(r.id);cur.draft=undefined;cur.i=j;ex()};
 if(isDone(e.id,w)){setDone(e.id,w,false);if(!save())return;hechoBtn(false);navigator.vibrate&&navigator.vibrate(30);toast('Marcado como pendiente',false,{dur:1500});return}
 setDone(e.id,w,true);if(!save())return;hechoBtn(true);
 navigator.vibrate&&navigator.vibrate(30);hechoT=setTimeout(()=>{if(view===ex)go();else hechoT=null},HECHO_MS)}
function nav(d){const r=rut(cur.r);cur.draft=undefined;cur.i+=d;if(cur.i<0)cur.i=0;if(cur.i>=exs(r).length){view=home;ROUTINE=false;return h(`${topBar()}<div class=grow><h1 class=wk>Terminaste ${ic('trofeo','em')}</h1><p class="c today">¡Muy bien, Pablo!</p></div><button class="big acc bi" data-act=home>${ic('inicio')}Inicio</button>`)}ex()}
// ---------- peso (continuo, independiente del plan) ----------
const PPG=5,pesoOrd=()=>D.peso.map((x,j)=>({...x,j})).sort((a,b)=>a.f<b.f?-1:a.f>b.f?1:a.j-b.j);
const dm=f=>dmShort(new Date(f)),dmy=f=>{const d=new Date(f);return dm(f)+'/'+String(d.getFullYear()).slice(2)};
const sgn=x=>(x>0?'+':x<0?'−':'±')+fmt(Math.round(Math.abs(x)*100)/100);
function peso(pg=0){view=()=>peso(pg);const O=pesoOrd(),L=O.map((x,j)=>({...x,p:j?O[j-1].kg:null})).reverse(),n=Math.max(1,Math.ceil(L.length/PPG));pg=Math.min(Math.max(0,pg),n-1);const u=O.at(-1);
 // v11: el registro de peso se mudó de Inicio a esta pantalla (mismo input #pk y misma acción addP)
 h(`${topBar('Peso')}<h1 class=ttl>${ic('peso')}Peso</h1>
 <div class="row prow"><label for=pk>Nuevo<small>kg</small></label><input id=pk class=meta inputmode=decimal value="${u?fmt(u.kg):''}" placeholder="kg"><button class="mid bi" data-act=addP>${ic('check')}Guardar</button></div>
 <div class="row prow"><label for=meta>Meta<small>kg</small></label><input id=meta class=meta inputmode=decimal value="${esc(fmt(D.meta))}" placeholder="—"><button class="mid bi" data-act=setMeta>${ic('check')}Guardar</button></div>
 ${u&&O.length>1?`<p class=info>Desde el primero: <b>${sgn(u.kg-O[0].kg)} kg</b>${D.meta?` · Faltan <b>${fmt(Math.round(Math.abs(u.kg-D.meta)*100)/100)} kg</b>`:''}</p>`:''}
 <ul class="cl grow">${L.slice(pg*PPG,pg*PPG+PPG).map(x=>`<li><span class=muted>${dmy(x.f)}${x.w?' · S'+x.w:''}</span> <b>${fmt(x.kg)} kg</b><br><span class=muted>${x.p!=null?`vs anterior ${sgn(x.kg-x.p)}`:'primer registro'}${D.meta?` · vs meta ${sgn(x.kg-D.meta)}`:''}</span></li>`).join('')||'<li>Sin registros. Cargá tu peso arriba.</li>'}</ul>
 ${n>1?`<div class=row><button class=mid data-act=peso data-a="${pg-1}" ${pg?'':'disabled'} aria-label="Más nuevos">${ic('izq')}</button><span class="mid pgl">${pg+1}/${n}</span><button class=mid data-act=peso data-a="${pg+1}" ${pg<n-1?'':'disabled'} aria-label="Más viejos">${ic('der')}</button></div>`:''}`)}
const dayKey=f=>new Date(f).toDateString();
function addP(){const el=$('pk'),v=num(el.value);if(!okKg(v)){el.classList.add('bad');return toast('Número no válido. Ej: 82,5',true)}const f=new Date().toISOString(),u=pesoOrd().at(-1);
 if(u&&u.kg===v&&dayKey(u.f)===dayKey(f))return toast(`✓ Ya estaba guardado: ${fmt(v)} kg`);
 D.peso.push({kg:v,f,w:wTag(f)});if(save()){toast(`✓ Peso guardado: ${fmt(v)} kg`);peso()}}
function setMeta(){const s=$('meta').value.trim(),v=num(s);if(s&&!okKg(v)){$('meta').classList.add('bad');return toast('Número no válido. Ej: 82,5',true)}D.meta=s?v:'';if(save()){toast('✓ Guardado');peso()}}
// ---------- historial por bloque ----------
function bloques(){const s=new Set([BLK()]);for(const k of['log','hechos'])for(const b of Object.keys(D[k]))if(Object.values(D[k][b]).some(ws=>Object.keys(ws).length))s.add(b);for(const x of histKg())s.add(x.blockId);return[...s]}
const rutDe=(b,id)=>{let r=D.rutas[b+'|'+id]||'';for(const x of histKg())if(x.blockId===b&&x.exId===id)r=x.r;return r};
function filas(rid,b){// [{id,nombre,del}] máx. 10
 if(b===BLK()){const r=rut(rid),ids=new Set(r?r.ejercicios.flatMap(e=>aliases(e.id)):[]),all=new Set(RUTS().flatMap(x=>x.ejercicios.flatMap(e=>aliases(e.id)))),out=r?r.ejercicios.map(e=>({id:e.id,nombre:corto(e)})):[];
  for(const id of Object.keys(D.log[b]||{}))if(!all.has(id)&&!ids.has(id)&&Object.keys(D.log[b][id]).length&&rutDe(b,id)===rid&&out.length<10)out.push({id,nombre:short(D.nombres[id]||id),del:true});return out}
 return Object.keys(D.log[b]||{}).filter(id=>Object.keys(D.log[b][id]).length&&rutDe(b,id)===rid).slice(0,10).map(id=>({id,nombre:short(D.nombres[id]||id)}))}
const bName=b=>b===BLK()?`Bloque ${PL.bloque.numero} · ${PL.bloque.nombre} (actual)`:b;
const tabsDe=b=>b===BLK()?RUTS().map(r=>r.id):[...new Set(histKg().filter(x=>x.blockId===b).map(x=>x.r))].sort();
function tabs(rid,b){return`<div class=row>${tabsDe(b).map(x=>`<button class="mid ${x===rid?'acc':''}" data-act=hist data-a="${esc(x)}">${esc(x)}</button>`).join('')}<button class="mid ${rid==='cam'?'acc':''}" data-act=cambios>Cambios</button></div>`}
let HB=null,HWP=null,HCUR='';// HWP: página de semanas del Historial (6 por página)
function hist(rid,b){b=b||HB||BLK();if(!bloques().includes(b))b=BLK();HB=b;const tb=tabsDe(b);if(!rid||!tb.includes(rid))rid=tb[0]||'';HCUR=rid;view=()=>hist(rid,b);const bl=bloques(),cw=b===BLK()?week():0,nw=Math.max(b===BLK()?NW():6,cw,maxW(b)),PS=3,np=Math.ceil(nw/PS);if(HWP==null||HWP>=np)HWP=cw?Math.floor((Math.min(cw,nw)-1)/PS):np-1;const pg=HWP,ws=[...Array(Math.min(PS,nw-pg*PS))].map((_,k)=>pg*PS+k+1);
 h(`${topBar('Historial')}${bl.length>1?`<label class=vh for=bsel>Bloque</label><select id=bsel class=bsel>${bl.map(x=>`<option value="${esc(x)}" ${x===b?'selected':''}>${esc(bName(x))}</option>`).join('')}</select>`:''}${tabs(rid,b)}
 <div class=grow><table class=cn><tr><th>kg</th>${ws.map(w=>`<th>S${w}</th>`).join('')}</tr>${filas(rid,b).map(f=>`<tr><td class="${f.del?'del':''}"><span class=nm>${esc(f.nombre)}${f.del?' (quitado)':''}</span></td>${ws.map(w=>`<td class="${f.del?'del':''}">${fmt(logGet(b,f.id,w))||'·'}</td>`).join('')}</tr>`).join('')}</table></div>${np>1?`<div class=row><button class=mid data-act=histPg data-a="${pg-1}" ${pg?'':'disabled'} aria-label="Semanas anteriores">${ic('izq')}</button><span class="mid pgl">${ws.length>1?`S${ws[0]}–S${ws.at(-1)}`:`S${ws[0]}`}</span><button class=mid data-act=histPg data-a="${pg+1}" ${pg<np-1?'':'disabled'} aria-label="Semanas siguientes">${ic('der')}</button></div>`:''}`)}
const maxW=b=>{let m=0;for(const k of['log','hechos'])for(const ws of Object.values(D[k][b]||{}))for(const w of Object.keys(ws))m=Math.max(m,+w);return m};
document.addEventListener('change',e=>{if(e.target&&e.target.id==='bsel'){HB=e.target.value;HWP=null;hist('',HB)}});
const PG=6;/* v11: 6 por página (con letra 22/26 entran 6 aunque todos ocupen 3 líneas) */function cambios(pg){pg=+pg||0;view=()=>cambios(pg);const H=histKg(),L=H.map((x,j)=>{let p;for(let k=j-1;k>=0;k--)if(H[k].exId===x.exId&&H[k].kg!=null){p=H[k].kg;break}return{...x,p}}).reverse(),n=Math.max(1,Math.ceil(L.length/PG));pg=Math.min(Math.max(0,pg),n-1);
 h(`${topBar('Cambios de kg')}${tabs('cam',HB||BLK())}<ul class="cl grow">${L.slice(pg*PG,pg*PG+PG).map(x=>`<li><span class=muted>${dm(x.f)}${x.mig?'*':''} · S${x.w||'–'} · ${esc(x.r)}</span> ${esc(short(x.e))}<br><b>${x.kg==null?'borrado':fmt(x.kg)+' kg'}</b>${x.kg!=null&&x.p!=null?` <span class=muted>(${sgn(x.kg-x.p)})</span>`:''}</li>`).join('')||'<li>Sin cambios todavía</li>'}</ul>
 <div class=row><button class=mid data-act=cambios data-a="${pg-1}" ${pg?'':'disabled'} aria-label="Más nuevos">${ic('izq')}</button><span class="mid pgl">${pg+1}/${n}</span><button class=mid data-act=cambios data-a="${pg+1}" ${pg<n-1?'':'disabled'} aria-label="Más viejos">${ic('der')}</button></div>${H.some(x=>x.mig)?'<p class="muted sm2 c">* fecha aproximada (dato anterior a v7)</p>':''}`)}
// ---------- Métricas (v10): sesiones completas por rutina ----------
// Sesión completa = al menos el 50 % (>=) de los ejercicios de esa rutina que aplican esa semana (omitirEn; semana 7+ usa la lista de la última) marcados Hecho en esa semana de calendario.
// Umbral = Math.ceil(n/2): 9 ejercicios → 5, 8 → 4. Lista vacía → no cuenta.
// Frecuencia = veces que la rutina aparece en la agenda semanal del plan (mínimo 1). Como "Hecho" se guarda por ejercicio y semana, cuenta como máximo 1 sesión por semana.
const freqDe=rid=>Math.max(1,Object.values(PL&&PL.agenda||{}).filter(a=>a&&a.rutina===rid).length);
const exsW=(r,w)=>r.ejercicios.filter(e=>!(e.omitirEn||[]).includes(Math.min(Math.max(1,w),NW())));
const sesionOk=(r,w)=>{const E=exsW(r,w);return E.length>0&&E.filter(e=>isDone(e.id,w)).length>=Math.ceil(E.length/2)};
// v11 (BACKLOG, decisión Dev Lead): un Hecho en una semana futura (reloj cambiado, datos importados) no cuenta; solo semanas 1..actual
function kpi(r){const f=freqDe(r.id),cw=week(),tot=NW()*f;let done=0,hasta=0;for(let w=1;w<=cw;w++)if(sesionOk(r,w)){done++;hasta++}
 const el=Math.max(1,cw)*f;return{done,tot,pct:Math.min(100,Math.round(done*100/tot)),extra:Math.max(0,done-tot),hasta,el,cpct:Math.min(100,Math.round(hasta*100/el))}}
function metricas(){view=metricas;h(`${topBar('Métricas')}<h2 class=ttl2>${ic('metricas')}Sesiones completas</h2><div class="grow mts">${RUTS().map(r=>{const k=kpi(r);return`<div class=mtc><p class=mtt>${esc(r.titulo)}</p><p class=mtn><b>${Math.min(k.done,k.tot)}/${k.tot}</b> · ${k.pct}%${k.extra?` <span class=mtx>(+${k.extra} extra)</span>`:''}</p><p class=mtd>Al día: ${k.hasta} de ${k.el} ${k.el===1?'semana':'semanas'} · ${k.cpct}%</p></div>`}).join('')}<p class="muted mtf">Cuenta la sesión con al menos la mitad de los ejercicios con Hecho esa semana.</p></div><button class="big bi" data-act=home>${ic('atras')}Volver</button>`);shrinkMt()}
// v11 (QA B-11): con títulos largos y safe-area la nota final se cortaba. Pasos, solo si no entra: 1) número 56→44, 2) número 34 y % 28,
// 3) título 20px y tarjeta más baja, 4) título en máximo 2 líneas (último recurso; con el plan real no se usa ninguno)
function shrinkMt(){const m=app().querySelector('.mts');if(!m)return;for(const k of['k1','k2','k3','k4']){if(!over())break;m.classList.add(k)}}
// ---------- export CSV (bloque y exId al final de las tablas de kg; peso igual). v12.1: rutina también por cq() en las 3 secciones (QA v12 #2);
// la semana sale como número (+w): load3 acepta claves como «+5» (+w entre 1 y 520) y así no llegan crudas al CSV. Con datos válidos la salida es idéntica ----------
function download(txt,name,type){const u=URL.createObjectURL(new Blob([txt],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);navigator.clipboard?.writeText(txt).catch(()=>{})}
const cq=s=>'"'+String(s).replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")+'"';
// v12.1 (QA v12 #3): historico_kg del CSV en orden cronológico (un reemplazo de kg el mismo día cambia f pero deja la fila en su lugar).
// Solo para exportar: copia ordenada por instante (Date.parse) y, a igual instante, por posición original (estable). D.hist no se toca.
const histKgOrd=()=>histKg().map((x,j)=>({x,j,t:Date.parse(x.f)})).sort((a,b)=>a.t-b.t||a.j-b.j).map(o=>o.x);
function rutinaDe(b,id){if(b===BLK())for(const r of RUTS())if(r.ejercicios.some(e=>aliases(e.id).includes(id)))return r.id;return rutDe(b,id)}
function exportar(){let csv='rutina,ejercicio,semana,kg,bloque,exId\n';for(const b of Object.keys(D.log))for(const id of Object.keys(D.log[b]))for(const[w,kg]of Object.entries(D.log[b][id]))csv+=`${cq(rutinaDe(b,id))},${cq(nombreDe(id))},${+w},${kg},${cq(b)},${cq(id)}\n`;
 csv+='\nhistorico_kg\nfecha,semana,rutina,ejercicio,kg,aproximada,bloque,exId\n'+histKgOrd().map(x=>`${x.f},${x.w},${cq(x.r)},${cq(x.e)},${x.kg??''},${x.mig?1:0},${cq(x.blockId)},${cq(x.exId)}`).join('\n');
 csv+='\n\nhistorico_peso\nfecha,semana_bloque,peso\n'+pesoOrd().map(x=>`${x.f},${x.w??''},${x.kg}`).join('\n')+`\n\nmeta_peso\n${D.meta}\n`;
 // v11 (QA T10): estado de Hecho en sección propia, al final para no mover las anteriores (los lectores de CSV viejos siguen andando). Una fila por ejercicio y semana marcados
 const HR=[];for(const b of Object.keys(D.hechos||{}))for(const id of Object.keys(D.hechos[b]||{}))for(const w of Object.keys(D.hechos[b][id]||{}).sort((x,y)=>x-y))if(D.hechos[b][id][w])HR.push(`${cq(rutinaDe(b,id))},${cq(nombreDe(id))},${+w},${cq(b)},${cq(id)}`);
 csv+='\nhechos\nrutina,ejercicio,semana,bloque,exId\n'+HR.join('\n')+(HR.length?'\n':'');
 download(csv,'entrenamiento-respaldo.csv','text/csv');toast('✓ Respaldo descargado (y copiado)')}
// ---------- S-1: acciones por delegación (sin onclick en línea) ----------
const ACT={home:()=>{clearInterval(TI);home()},backEx:()=>{clearInterval(TI);ex()},timerI:a=>{const r=cur&&rut(cur.r),e=r&&exs(r)[+a];if(e){keepDraft();timer(descDe(eff(e)))}},storeOk:()=>{STORERR=false;afterBoot()},
 hist:a=>{if(a==null)HWP=null;hist(a)},histPg:a=>{HWP=Math.max(0,+a);hist(HCUR)},cambios:a=>cambios(a),peso:a=>peso(+a||0),resumen:a=>rut(a)&&resumen(a),start:a=>start(a),goEx:a=>goEx(a),done:a=>done(+a),
 actualizar,addP,ajustes,metricas,exportBad,exportar,hecho,resetData,borrarTodo,borrarSi,setMeta,retryPlan};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(!b||b.disabled||!own(ACT,b.dataset.act))return;e.preventDefault();ACT[b.dataset.act](b.dataset.a)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('li[data-act]')){e.preventDefault();e.target.click()}});
document.addEventListener('input',e=>{e.target.classList&&e.target.classList.remove('bad')});
// ---------- service worker ----------
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{REG=reg;
 const chk=()=>{if(reg.waiting&&navigator.serviceWorker.controller&&!newVer){newVer=true;if(view===home)home()}};chk();
 reg.addEventListener('updatefound',()=>{const n=reg.installing;n&&n.addEventListener('statechange',()=>{if(n.state==='installed')chk()})})}).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload()})}
// ---------- arranque ----------
async function boot(){D=loadAll();if(DIRTY&&!DATAERR&&!saveRaw())STORERR=true;
 const ok=planOk();if(ok)applyPlan(ok);
 try{localStorage.removeItem('gt_cred');sessionStorage.removeItem('gt_fails')}catch(e){}// migración: el bloqueo ya no existe
 const p=loadPlan();if(!PL)await p;else p.then(()=>{if(view===home||view===noPlan)home()});
 afterBoot()}
boot();
