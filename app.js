const V=id=>'https://www.youtube.com/watch?v='+id;
const R='Bajada lenta (3″), rodilla alineada con el pie. Si duele la articulación, usá la alternativa.';
const W='Agarre neutro si se puede. Si duele u hormiguea la muñeca, cortá y consultá a tu médico.';
const P={A:{t:'A · Piernas y core',e:[
['Hack squat o péndulo','4×10','2′','7-8','V-squat',R+' Rango sin dolor.',V('NEyKZhc5u5A')],
['Prensa 45°','3×12','90″','8','Sentadilla en Smith',R,V('KdT2g0iSdG0')],
['Curl femoral acostado','4×10-12','60″','8','Curl sentado','Cadera pegada al banco, subida y bajada controladas.',V('9xbBr5Ytl8c')],
['Extensión de cuádriceps 90°→30°','3×12-15','60″','8','A una pierna','Recorrido de 90° a 30°, sin bloquear la rodilla.',V('U_OUPKqlWrQ')],
['Abductora','3×15','45″','8','Abductora con discos','Espalda apoyada, abrí controlado y pausá afuera.',V('2vCRMi-lgJ4')],
['Aductora','3×15','45″','8','Aductor en polea','Cerrá controlado, sin rebote.',V('O7co9-r7a6M')],
['Gemelos sentado con discos','3×15','45″','8-9','Gemelos en prensa','Estirá abajo, pausa arriba.',V('rfkYC-mbQus')],
['Pallof press en polea','3×10 por lado','45″','7','Pallof arrodillado','Que el tronco no gire. Brazos al frente y volvé lento.',V('bYKor-nicRg')],
['Elevación de rodillas en silla romana','3×12','45″','8','Crunch en polea','Sin balanceo, subí las rodillas al pecho.',V('ioiS2KCeHKU')]]},
B:{t:'B · Espalda, hombros y brazos',e:[
['Jalón con discos','4×8-10','2′','8','Jalón en polea','Pecho arriba, bajá hacia el pecho. '+W,V('ZBxTTC9SSbA')],
['Press inclinado con discos (Hammer)','4×8-10','2′','7-8','Inclinado en Smith','Escápulas juntas, bajada controlada. '+W,V('YM90BrbZIBM')],
['Remo T con pecho apoyado','4×10','90″','8','Remo en máquina','Pecho pegado al apoyo, tirá con los codos.',V('GEgmkhrQgUM')],
['Press de hombros en máquina','3×10','90″','7-8','Smith sentado','Sin arquear la espalda. '+W,V('NjZy28n8Qto')],
['Pec deck invertido','3×15','45″','8','Face pull en polea','Brazos casi rectos, abrí hacia atrás.',V('TtJmmR2RuHU')],
['Laterales en polea','3×12-15','45″','8-9','Laterales en máquina','Subí hasta el hombro, sin impulso.',V('c7-4b6AmMDY')],
['Curl Scott con barra Z','3×10','60″','8','Curl en polea','Agarrá la parte angulada. Bajada lenta.',V('JtWyDc6U1pU')],
['Tríceps en polea','3×12','60″','8','Tríceps con cuerda','Codos pegados al cuerpo.',V('FELcywKlkqE')],
['Muñeca en polea, liviano (flexión y extensión)','2×15','45″','6-7','Con mancuerna liviana','Carga liviana, movimiento lento. '+W,V('VvL6HKZuR6U')]]},
C:{t:'C · Cadena posterior y potencia',e:[
['Prensa explosiva','4×6','90″','Moderada','Hack explosivo','Bajá lento, empujá rápido. Carga moderada.',V('iD2RMHckobU')],
['Hip thrust en máquina','4×10','90″','8','Hip thrust en Smith','Pausa arriba, apretá glúteos, mentón al pecho.',V('gdUC0EFGWfQ')],
['Rumano en Smith','3×10','2′','7-8','Pull-through en polea','Cadera atrás, espalda neutra, barra cerca de las piernas.',V('EZX8CYKTSSk')],
['Remo en polea baja a un brazo','3×10 por lado','60″','8','Remo en máquina','Tirá con el codo, sin girar el tronco.',V('C7rxEp-078I')],
['Hiperextensión 45°','3×12','60″','7-8','Máquina lumbar','Pausa arriba. Con disco al pecho cuando la domines.',V('MpBAD9a3uD4')],
['Patada de glúteo en máquina','3×12 por pierna','60″','8','Patada en polea','Sin arquear la zona lumbar.',V('RT5ZuVCy5Ac')],
['Rotadora de tronco','3×10 por lado','45″','7','Woodchop en polea','Giro lento y controlado.',V('4xMcrAd7VKY')],
['Final: assault bike o elíptico','8×(30″ fuerte / 30″ suave)','—','8','Remo','En S6 (descarga) no se hace.',V('Jtg4Rxag4BU')]]}};
const DIAS=['Descanso','A','Funcional','B','Hyrox','C','Salida'],DN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const OBJ=['','RPE 6-7: encontrá las cargas','RPE 7-8','RPE 8: si completaste las reps, sumá una placa','+1 serie en los accesorios','Semana pico 💥 RPE 8-9 en la última serie','Descarga 🔋 mitad de las series, sin el final'];
const START=new Date(2026,9,19);
// Nombre visible de la app: cambiarlo SOLO acá (y en manifest.json name/short_name; ver README).
const APP_NAME='Entreno';document.title=APP_NAME;
// ---------- state (QA-01: carga robusta con defaults y esquema versionado) ----------
// Esquema 2 (v7): log = kg por semana (tabla); hist = histórico append-only de cambios de kg; hechos = ejercicios hechos por semana; peso = histórico append-only.
const SCHEMA=2,DEF=()=>({v:SCHEMA,log:{},hist:[],hechos:{},peso:[],meta:''});let DATAERR=false,MIGRATED=false,STORERR=false,BADRAW='';
const wkOf=dt=>{const t=new Date(dt);t.setHours(0,0,0,0);const d=Math.floor((t-START)/864e5);return d<0?0:Math.min(7,Math.floor(d/7)+1)};
const wkDate=w=>new Date(START.getTime()+(w-1)*7*864e5+12*36e5).toISOString();// fecha aproximada para registros migrados
const exName=id=>P[id[0]]?.e[+id.slice(1)]?.[0]||id;
const okKg=n=>n>0&&n<=500;
const wTag=f=>{const w=wkOf(f);return w>=1&&w<=6?w:null};// semana del bloque: solo etiqueta (null fuera del bloque)
function esDate(s){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s||'');if(!m)return null;const d=new Date(+m[3],m[2]-1,+m[1],12);return isNaN(d)?null:d.toISOString()}
function load(){const raw=localStorage.getItem('gt_data');if(!raw)return DEF();
 try{const o=JSON.parse(raw),d=DEF();if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('esquema');
  if(o.log&&typeof o.log==='object'&&!Array.isArray(o.log))for(const[k,v]of Object.entries(o.log))if(v&&typeof v==='object'){const e={};for(const[w,kg]of Object.entries(v)){const n=+kg;if(okKg(n)&&+w>=1&&+w<=6)e[w]=n}d.log[k]=e}
  if(Array.isArray(o.hist))d.hist=o.hist.filter(x=>x&&typeof x.ex==='string'&&(x.kg===null||okKg(+x.kg))&&!isNaN(Date.parse(x.f))).map(x=>({ex:x.ex,e:String(x.e||exName(x.ex)),r:String(x.r||x.ex[0]),kg:x.kg===null?null:+x.kg,f:x.f,w:+x.w||0,...(x.mig?{mig:1}:{})}));
  if(o.hechos&&typeof o.hechos==='object')for(const[k,v]of Object.entries(o.hechos))if(v&&typeof v==='object'){d.hechos[k]={};for(const w of Object.keys(v))if(+w>=1&&+w<=6)d.hechos[k][w]=1}
  if(Array.isArray(o.peso))d.peso=o.peso.filter(x=>x&&okKg(+x.kg)).map(x=>{const f=!isNaN(Date.parse(x.f))?x.f:esDate(x.d)||new Date(0).toISOString();return{kg:+x.kg,f,w:+x.w>=1&&+x.w<=6?+x.w:wTag(f)}});// nunca se descarta un peso por la semana
  const m=num(o.meta);d.meta=m>0?m:'';
  if(!(Number.isInteger(o.v)&&o.v>=2)){// migración desde original (sin v) o v6 (v:1); V7-05: v no numérico también re-migra
   try{localStorage.setItem('gt_data_v'+(Number.isInteger(o.v)?o.v:0)+'_backup',raw)}catch(e){STORERR=true}// V7-03
   if(!d.hist.length)for(const[id,ws]of Object.entries(d.log))for(const w of Object.keys(ws).map(Number).sort((a,b)=>a-b))d.hist.push({ex:id,e:exName(id),r:id[0],kg:ws[w],f:wkDate(w),w,mig:1});
   d.hist.sort((a,b)=>a.f<b.f?-1:1);MIGRATED=true}
  return d}
 catch(e){BADRAW=raw;try{localStorage.setItem('gt_data_bad',raw)}catch(e2){}DATAERR=true;return DEF()}}
const num=v=>{const s=String(v??'').trim();return/^\d{1,3}([.,]\d{1,2})?$/.test(s)?parseFloat(s.replace(',','.')):NaN};
let D=load(),cur=null,view=null;
function save(){try{localStorage.setItem('gt_data',JSON.stringify(D));return true}catch(e){toast('No se pudo guardar (memoria llena o modo privado)',true);return false}}// QA-08
const $=id=>document.getElementById(id),app=()=>$('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));// QA-06
const fmt=v=>v===''||v==null?'':String(v).replace('.',',');// QA-15 / P1-4
// V7-02: ignora toques en botones/links durante NAVMS tras cada cambio de pantalla (doble toque)
const NAVMS=typeof window.__NAVLOCK_MS==='number'?window.__NAVLOCK_MS:600;let navUntil=0;
document.addEventListener('click',e=>{if(Date.now()<navUntil&&e.target.closest&&e.target.closest('#app button,#app a')){e.preventDefault();e.stopImmediatePropagation()}},true);
function h(html){app().innerHTML=html;window.scrollTo(0,0);navUntil=Date.now()+NAVMS}
function week(){const t=new Date();t.setHours(0,0,0,0);const d=Math.floor((t-START)/864e5);if(d<0)return 0;const w=Math.floor(d/7)+1;return w>6?7:w}
let TT=null;function toast(msg,bad){document.querySelector('.toast')?.remove();clearTimeout(TT);const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.setAttribute('role',bad?'alert':'status');t.setAttribute('aria-live',bad?'assertive':'polite');t.textContent=msg;document.body.appendChild(t);TT=setTimeout(()=>t.remove(),bad?2500:1200)}
// ---------- huella/cara (WebAuthn, solo bloqueo de pantalla) ----------
const WA=!!(window.PublicKeyCredential&&navigator.credentials);let unlocked=false,hiddenAt=0,resume=null;
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
async function bioOn(){try{if(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()))return toast('Este equipo no tiene huella/cara disponible',true);
 const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'Entrenamiento'},user:{id:rnd(16),name:'Pablo',displayName:'Pablo'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
 localStorage.setItem('gt_cred',btoa(String.fromCharCode(...new Uint8Array(c.rawId))));unlocked=true;toast('✓ Huella/cara activada');home()}catch(e){toast('No se pudo activar la huella/cara',true)}}// QA-SEC / P2-5
function bioOff(){if(confirm('¿Desactivar el bloqueo con huella/cara?')){localStorage.removeItem('gt_cred');home()}}
const fails=()=>+(sessionStorage.getItem('gt_fails')||0);
function lockScreen(msg=''){unlocked=false;clearInterval(TI);h(`<div class=grow><div class=wk>🔒</div><h1 class=today>Hola Pablo</h1></div><p class="err c">${esc(msg)}</p><button id=ub class="big acc huge" onclick=unlock()>Desbloquear 👆</button>`)}
// QA-02 / P0-5: pantalla de recuperación tras 3 fallos o credencial inválida
function recovery(why){unlocked=false;const n=fails(),msg=why==='cred'?'La llave guardada no es válida.':n>=2?`No se pudo verificar ${n} veces.`:'No se pudo verificar la huella/cara.';h(`<div class=grow><div class=wk>🔒</div><h1 class=today>Hola Pablo</h1>
 <p class="err c" style="font-size:24px;margin-top:10px">${msg}</p><p style="font-size:22px;margin-top:8px">Si cambiaste de iPhone o borraste la llave, podés desactivar el bloqueo. Tus datos quedan.</p></div>
 <button id=ub class="big acc h72" onclick=unlock()>Reintentar 👆</button><button class=big onclick=exportar()>💾 Exportar respaldo</button><button class=big onclick=lockOff()>Desactivar bloqueo</button>`)}
function lockOff(){if(confirm('¿Desactivar el bloqueo? Se apaga huella/cara. Lo podés volver a activar en Ajustes.')){localStorage.removeItem('gt_cred');sessionStorage.removeItem('gt_fails');unlocked=true;afterUnlock()}}
async function unlock(){const b=$('ub');if(b){b.disabled=true;b.textContent='Verificando…'}let id;
 try{id=Uint8Array.from(atob(localStorage.getItem('gt_cred')||''),c=>c.charCodeAt(0));if(!id.length)throw 0}catch(e){return recovery('cred')}
 try{await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id,transports:['internal']}],userVerification:'required',timeout:60000}});sessionStorage.removeItem('gt_fails');unlocked=true;afterUnlock()}
 catch(e){const n=fails()+1;sessionStorage.setItem('gt_fails',n);if(n>=3||e&&e.name==='InvalidStateError')recovery();else lockScreen(e&&e.name==='NotAllowedError'?'Cancelado o no reconocido. Probá de nuevo.':'No se pudo verificar. Probá de nuevo.')}}
function afterUnlock(){if(DATAERR)return dataError();if(STORERR)return storageError();const r=resume;resume=null;(r||home)()}// QA-09: vuelve a la misma pantalla
function boot(){if(MIGRATED&&!STORERR)try{localStorage.setItem('gt_data',JSON.stringify(D))}catch(e){STORERR=true}if(localStorage.getItem('gt_cred')&&WA)lockScreen();else{unlocked=true;afterUnlock()}}
function keepDraft(){const k=$('kg');if(k&&cur)cur.draft=k.value}// QA-03 / QA-09
document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();keepDraft()}else{REG&&REG.update().catch(()=>{});if(localStorage.getItem('gt_cred')&&WA&&unlocked&&Date.now()-hiddenAt>60000){resume=view;lockScreen()}}});
// P0-6 / QA-01: datos ilegibles
function dataError(){view=dataError;h(`<div class=grow><div class=wk>⚠️</div><h1 class=today>No se pudieron leer los datos guardados.</h1><p style="font-size:22px;margin-top:10px">Guardé una copia. Podés exportarla o empezar de cero.</p></div>
 <button class=big onclick=exportBad()>💾 Exportar copia</button><button class="big acc" onclick=resetData()>Empezar de cero</button>`)}
function exportBad(){download(localStorage.getItem('gt_data_bad')||BADRAW||'','entrenamiento-copia-datos.txt','text/plain');toast('✓ Copia exportada')}
// V7-03: sin espacio al migrar → datos en memoria, pantalla con exportar
function storageError(){view=storageError;h(`<div class=grow><div class=wk>⚠️</div><h1 class=today>No hay espacio para guardar los datos.</h1><p style="font-size:22px;margin-top:10px">Tus datos están cargados, pero no se pudieron guardar en el celular. Exportá un respaldo ahora.</p></div>
 <button class="big acc" onclick=exportar()>💾 Exportar respaldo</button><button class=big onclick="STORERR=false;home()">Seguir igual</button>`)}
function resetData(){if(!confirm('¿Empezar de cero? La copia de los datos viejos queda guardada.'))return;D=DEF();if(save()){DATAERR=false;home()}}
function ajustes(){view=ajustes;const on=!!localStorage.getItem('gt_cred');h(`${topBar()}<h1>⚙️ Ajustes</h1><div class=grow>
 ${!WA?'<p class=err>Este navegador no soporta huella/cara. La app abre sin bloqueo.</p>':on?'<p>Huella/cara: <b>ACTIVADO</b></p><button class="big" onclick=bioOff()>Desactivar huella/cara</button>':'<p>Huella/cara: <b>apagado</b></p><button class="big acc" onclick=bioOn()>Activar huella/cara</button>'}
 <p class=muted style="margin:12px 0">Es solo un bloqueo de pantalla: los datos quedan sin cifrar en este celular.</p><button class="big" onclick=exportar()>💾 Exportar respaldo</button></div>`)}
function wlabel(){const w=week();return w===0?'Semana 1 de 6':w===7?'Bloque terminado ✅':`Semana ${w} de 6${w===6?' · Descarga':''}`}
const topBar=(t)=>`<div class=top><button class=back onclick="clearInterval(TI);home()">⌂ Inicio</button><span class=wl>${wlabel()}</span></div>${t?`<h1 class=vh>${t}</h1>`:''}`;
// ---------- aviso de versión nueva (QA-04 / P1-2: solo en Inicio) ----------
let REG=null,newVer=false,reloading=false;
const banner=()=>newVer?`<div class=banner role=status><span>🔄 Versión nueva</span><button onclick=actualizar()>Actualizar</button></div>`:'';
function actualizar(){reloading=true;if(REG&&REG.waiting)REG.waiting.postMessage('skipWaiting');else location.reload()}
// ---------- home ----------
function home(){view=home;const w=week(),dw=new Date().getDay(),hoy=DIAS[dw];
 const wt=w===0?'Semana 1 de 6':w===7?'Bloque terminado ✅':`Semana ${w} de 6${w===6?' · Descarga':''}`;
 h(`${banner()}<p class=brand>${APP_NAME}</p><h1 class=wk>${wt}</h1>${w>=1&&w<=6?`<p class=obj>🎯 ${OBJ[w]}</p>`:''}
 <p class=today>Hoy (${DN[dw]}): <b>${P[hoy]?'Rutina '+hoy:hoy}</b></p><div class=grow></div>
 <div class="row pwr"><label for=pk>⚖️ Peso</label><input id=pk class=meta inputmode=decimal value="${D.peso.length?fmt(pesoOrd().at(-1).kg):''}" placeholder="kg" oninput="this.classList.remove('bad')"><span>kg</span><button class=mid onclick=addP()>Guardar</button></div>
 ${['A','B','C'].map(r=>`<button class="big ${r===hoy?'acc':''}" onclick="resumen('${r}')">${P[r].t}</button>`).join('')}
 <div class=row><button class=mid onclick=peso()>⚖️ Peso</button><button class=mid onclick="hist('A')">📊 Historial</button><button class=mid onclick=ajustes() aria-label=Ajustes>⚙️</button></div>
 ${WA&&!localStorage.getItem('gt_cred')?'<button class=small onclick=bioOn()>👆 Activar huella/cara</button>':''}${!WA?'<p class="muted c sm">Este navegador no soporta huella/cara.</p>':''}`)}
// ---------- resumen + guía ----------
function lastKg(id){for(let j=D.hist.length-1;j>=0;j--)if(D.hist[j].ex===id)return D.hist[j].kg;return undefined}
function last(r,i){const l=D.log[r+i]||{};const ks=Object.keys(l).map(Number).sort((a,b)=>b-a);return ks.length?{w:ks[0],kg:l[ks[0]]}:null}
const short=n=>n.replace(/\s*\(.*?\)/g,'').replace(/,.*$/,'').replace('Final: ','');
function resumen(r){view=()=>resumen(r);h(`${topBar()}<h2>${P[r].t}${week()>=1&&week()<=6?` <span class=cnt>${P[r].e.filter((_,i)=>isDone(r+i,week())).length}/${P[r].e.length} ✓</span>`:''}</h2><ol class="sum grow">${P[r].e.map((e,i)=>{const L=last(r,i);return`<li class="${isDone(r+i,week())?'ok':''}"><span>${isDone(r+i,week())?'✓ ':''}${short(e[0])}</span> <b>${e[1].replace(' por lado',' c/lado').replace(' por pierna',' c/pierna').replace(' (30″ fuerte / 30″ suave)',' × 30″')}${L?` · ${fmt(L.kg)} kg`:''}</b></li>`}).join('')}</ol>
 <button class="big acc" onclick="start('${r}')">Empezar ▶</button>`)}
function start(r){cur={r,i:0};ex()}
function ex(){view=ex;const{r,i}=cur,e=P[r].e[i],w=Math.max(1,Math.min(6,week())),L=last(r,i),pk=lastKg(r+i),val=cur.draft??fmt(pk!=null?pk:(D.log[r+i]||{})[w]??(L?L.kg:'')),fin=r==='C'&&i===7;
 h(`${topBar('Entrenamiento')}<p class="muted sm2">${P[r].t} · ${i+1}/${P[r].e.length}${isDone(r+i,week())?' · <b class=okc>✓ hecho</b>':''}</p><h2>${e[0]}</h2>
 <div class=sr>${e[1]}</div><p class=info>⏱️ ${e[2]} · RPE ${e[3]}<br>🔄 ${e[4]}</p><div class=grow><p class=note>${e[5]}</p></div>
 ${fin?'':`<div class=kgrow><div class=lastbox>Última<br><b>${L?fmt(L.kg):'—'}</b></div><label for=kg class=vh>Kilos</label><input id=kg class=kg type=text inputmode=decimal value="${esc(val)}" placeholder="kg" oninput="this.classList.remove('bad')"><span class=kgl>kg</span></div>`}
 <div class=row><a class="mid vid" href="${e[6]}" target=_blank rel=noopener>Ver video ▶</a>${e[2]!=='—'?`<button class=mid onclick="keepDraft();timer('${e[2]}')">⏱️ ${e[2]}</button>`:''}</div>
 <div class=row><button class="mid nb2" onclick=done(-1)>← Anterior</button><button class="mid nb2" onclick=done(1)>Siguiente →</button></div>
 <button class="big acc hecho" onclick=hecho()>✓ Hecho</button>`)}
let TI=null;function timer(s){view=ex;clearInterval(TI);let t=s.includes('′')?parseInt(s)*60:parseInt(s);const f=()=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
 h(`${topBar('Descanso')}<p class=today>Descanso</p><div class=grow style="display:flex;align-items:center;justify-content:center"><div class=tbig id=tt aria-live=polite>${f()}</div></div><button class="big acc" onclick="clearInterval(TI);ex()">Volver al ejercicio</button>`);
 TI=setInterval(()=>{t--;const el=$('tt');if(!el)return clearInterval(TI);el.textContent=t>0?f():'¡Dale! ✅';if(t<=0){clearInterval(TI);el.classList.add('tdone');navigator.vibrate&&navigator.vibrate([400,200,400])}},1000)}
// QA-07 / QA-10 / QA-16 / P0-2 / P0-3 / P1-8: guarda al avanzar y al retroceder, con validación y feedback
function addHist(id,kg,w){D.hist.push({ex:id,e:exName(id),r:id[0],kg,f:new Date().toISOString(),w})}// append-only: nunca se edita ni borra
// devuelve false si no hay que avanzar (inválido o error de guardado)
function saveKg(){const k=$('kg');if(!k)return true;const s=k.value.trim(),id=cur.r+cur.i,w=week(),inB=w>=1&&w<=6;
 if(s===''){if(inB&&D.log[id]&&D.log[id][w]!=null){delete D.log[id][w];addHist(id,null,w);if(!save())return false;toast(`✓ Borrado (S${w})`)}return true}
 const v=num(s);if(!okKg(v)){k.classList.add('bad');k.focus();toast('Número no válido. Ej: 82,5',true);return false}
 if(!inB){toast('Fuera del bloque: no se guardó',true);return true}
 (D.log[id]=D.log[id]||{})[w]=v;if(lastKg(id)!==v)addHist(id,v,w);if(!save())return false;navigator.vibrate&&navigator.vibrate(30);toast(`✓ Guardado: ${fmt(v)} kg (S${w})`);return true}
function done(d){if(saveKg())nav(d)}
const isDone=(id,w)=>!!(D.hechos[id]&&D.hechos[id][w]);
// v7: ✓ Hecho = guarda kg + marca hecho (semana actual) + siguiente; en el último vuelve al resumen con la rutina completa
function hecho(){if(!saveKg())return;const{r,i}=cur,w=week();if(w>=1&&w<=6){(D.hechos[r+i]=D.hechos[r+i]||{})[w]=1;if(!save())return}
 if(i>=P[r].e.length-1){cur.draft=undefined;resumen(r);if(w>=1&&w<=6&&P[r].e.every((_,j)=>isDone(r+j,w)))setTimeout(()=>toast('✓ Rutina completa 💪'),50)}else nav(1)}
function nav(d){cur.draft=undefined;cur.i+=d;if(cur.i<0)cur.i=0;if(cur.i>=P[cur.r].e.length){view=home;return h(`${topBar()}<div class=grow><h1 class=wk>Terminaste 💪</h1><p class="c today">¡Muy bien, Pablo!</p></div><button class="big acc" onclick=home()>Inicio</button>`)}ex()}
// ---------- peso ----------
// v7: peso en Inicio (append-only) + estadística simple
// Peso: histórico continuo por fecha, independiente del plan; todo paginado, más nuevo primero
const PPG=6,pesoOrd=()=>D.peso.map((x,j)=>({...x,j})).sort((a,b)=>a.f<b.f?-1:a.f>b.f?1:a.j-b.j);
function peso(pg=0){view=()=>peso(pg);const O=pesoOrd(),L=O.map((x,j)=>({...x,p:j?O[j-1].kg:null})).reverse(),n=Math.max(1,Math.ceil(L.length/PPG));pg=Math.min(Math.max(0,pg),n-1);const u=O.at(-1);
 h(`${topBar('Peso')}<h1>⚖️ Peso</h1>
 <div class=row style="align-items:center"><label for=meta>🎯 Meta</label> <input id=meta class=meta inputmode=decimal value="${esc(fmt(D.meta))}" placeholder="—"> kg <button class=mid onclick=setMeta()>OK</button></div>
 ${u&&O.length>1?`<p class=info>Desde el primero: <b>${sgn(u.kg-O[0].kg)} kg</b>${D.meta?` · Faltan <b>${fmt(Math.round(Math.abs(u.kg-D.meta)*100)/100)} kg</b>`:''}</p>`:''}
 <ul class="cl grow">${L.slice(pg*PPG,pg*PPG+PPG).map(x=>`<li><span class=muted>${dmy(x.f)}${x.w?' · S'+x.w:''}</span> <b>${fmt(x.kg)} kg</b><br><span class=muted>${x.p!=null?`vs anterior ${sgn(x.kg-x.p)}`:'primer registro'}${D.meta?` · vs meta ${sgn(x.kg-D.meta)}`:''}</span></li>`).join('')||'<li>Sin registros. Cargalo en Inicio.</li>'}</ul>
 ${n>1?`<div class=row><button class=mid onclick="peso(${pg-1})" ${pg?'':'disabled'} aria-label="Más nuevos">◀</button><span class="mid pgl">${pg+1}/${n}</span><button class=mid onclick="peso(${pg+1})" ${pg<n-1?'':'disabled'} aria-label="Más viejos">▶</button></div>`:''}`)}
const dmy=f=>{const d=new Date(f);return dm(f)+'/'+String(d.getFullYear()).slice(2)};
const dayKey=f=>new Date(f).toDateString();
function addP(){const el=$('pk'),v=num(el.value);if(!okKg(v)){el.classList.add('bad');return toast('Número no válido. Ej: 82,5',true)}const f=new Date().toISOString(),u=pesoOrd().at(-1);
 if(u&&u.kg===v&&dayKey(u.f)===dayKey(f))return toast(`✓ Ya estaba guardado: ${fmt(v)} kg`);// V7-01
 D.peso.push({kg:v,f,w:wTag(f)});if(save()){toast(`✓ Peso guardado: ${fmt(v)} kg`);home()}}
function setMeta(){const s=$('meta').value.trim(),v=num(s);if(s&&!okKg(v)){$('meta').classList.add('bad');return toast('Número no válido. Ej: 82,5',true)}D.meta=s?v:'';if(save()){toast('✓ Guardado');peso()}}
// ---------- hist / export ----------
const dm=f=>{const d=new Date(f);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')};
const sgn=x=>(x>0?'+':x<0?'−':'±')+fmt(Math.round(Math.abs(x)*100)/100);
const tabs=r=>`<div class=row>${['A','B','C'].map(x=>`<button class="mid ${x===r?'acc':''}" onclick="hist('${x}')">${x}</button>`).join('')}<button class="mid ${r==='cam'?'acc':''}" onclick="cambios(0)">Cambios</button></div>`;
function hist(r){view=()=>hist(r);h(`${topBar('Historial')}${tabs(r)}
 <div class=grow><table><tr><th>kg</th>${[1,2,3,4,5,6].map(w=>`<th>S${w}</th>`).join('')}</tr>${P[r].e.map((e,i)=>`<tr><td>${short(e[0])}</td>${[1,2,3,4,5,6].map(w=>`<td>${fmt((D.log[r+i]||{})[w])||'·'}</td>`).join('')}</tr>`).join('')}</table></div>`)}
// v7: histórico de cambios de kg (más nuevo primero), con día, semana y diferencia vs el registro anterior del mismo ejercicio
const PG=9;function cambios(pg){view=()=>cambios(pg);const L=D.hist.map((x,j)=>{let p;for(let k=j-1;k>=0;k--)if(D.hist[k].ex===x.ex&&D.hist[k].kg!=null){p=D.hist[k].kg;break}return{...x,p}}).reverse(),n=Math.max(1,Math.ceil(L.length/PG));pg=Math.min(Math.max(0,pg),n-1);
 h(`${topBar('Cambios de kg')}${tabs('cam')}<ul class="cl grow">${L.slice(pg*PG,pg*PG+PG).map(x=>`<li><span class=muted>${dm(x.f)}${x.mig?'*':''} · S${x.w||'–'} · ${x.r}</span> ${esc(short(x.e))}<br><b>${x.kg==null?'borrado':fmt(x.kg)+' kg'}</b>${x.kg!=null&&x.p!=null?` <span class=muted>(${sgn(x.kg-x.p)})</span>`:''}</li>`).join('')||'<li>Sin cambios todavía</li>'}</ul>
 <div class=row><button class=mid onclick="cambios(${pg-1})" ${pg?'':'disabled'} aria-label="Más nuevos">◀</button><span class="mid pgl">${pg+1}/${n}</span><button class=mid onclick="cambios(${pg+1})" ${pg<n-1?'':'disabled'} aria-label="Más viejos">▶</button></div>${D.hist.some(x=>x.mig)?'<p class="muted sm2 c">* fecha aproximada (dato anterior a v7)</p>':''}`)}
function download(txt,name,type){const u=URL.createObjectURL(new Blob([txt],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);navigator.clipboard?.writeText(txt).catch(()=>{})}
const cq=s=>'"'+String(s).replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")+'"';// QA-19
function exportar(){let csv='rutina,ejercicio,semana,kg\n';for(const r of['A','B','C'])P[r].e.forEach((e,i)=>{for(const[w,kg]of Object.entries(D.log[r+i]||{}))csv+=`${r},${cq(e[0])},${w},${kg}\n`});
 csv+='\nhistorico_kg\nfecha,semana,rutina,ejercicio,kg,aproximada\n'+D.hist.map(x=>`${x.f},${x.w},${x.r},${cq(x.e)},${x.kg??''},${x.mig?1:0}`).join('\n');
 csv+='\n\nhistorico_peso\nfecha,semana_bloque,peso\n'+pesoOrd().map(x=>`${x.f},${x.w??''},${x.kg}`).join('\n')+`\n\nmeta_peso\n${D.meta}\n`;
 download(csv,'entrenamiento-respaldo.csv','text/csv');toast('✓ Respaldo descargado (y copiado)')}
// ---------- service worker ----------
if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js').then(reg=>{REG=reg;
 const chk=()=>{if(reg.waiting&&navigator.serviceWorker.controller&&!newVer){newVer=true;if(view===home&&unlocked)home()}};chk();
 reg.addEventListener('updatefound',()=>{const n=reg.installing;n&&n.addEventListener('statechange',()=>{if(n.state==='installed')chk()})})}).catch(()=>{});
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)location.reload()})}
boot();
