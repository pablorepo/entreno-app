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
// ---------- state ----------
let D=JSON.parse(localStorage.getItem('gt_data')||'null')||{log:{},peso:[],meta:''},cur=null;
async function save(){localStorage.setItem('gt_data',JSON.stringify(D))}
const $=id=>document.getElementById(id),app=()=>$('app');
function h(html){app().innerHTML=html;window.scrollTo(0,0)}
function week(){const t=new Date();t.setHours(0,0,0,0);const d=Math.floor((t-START)/864e5);if(d<0)return 0;const w=Math.floor(d/7)+1;return w>6?7:w}
// ---------- huella/cara (WebAuthn, solo bloqueo de pantalla) ----------
const WA=!!(window.PublicKeyCredential&&navigator.credentials);let unlocked=false,hiddenAt=0;
const rnd=n=>crypto.getRandomValues(new Uint8Array(n));
async function bioOn(){try{const c=await navigator.credentials.create({publicKey:{challenge:rnd(32),rp:{name:'Entrenamiento'},user:{id:rnd(16),name:'Pablo',displayName:'Pablo'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});
 localStorage.setItem('gt_cred',btoa(String.fromCharCode(...new Uint8Array(c.rawId))));unlocked=true;alert('Huella/cara activada ✅');home()}catch(e){alert('No se pudo activar: '+e.message)}}
function bioOff(){if(confirm('¿Desactivar el bloqueo con huella/cara?')){localStorage.removeItem('gt_cred');home()}}
function lockScreen(msg=''){unlocked=false;h(`<div class=grow><div class=wk>🔒</div><p class=today>Hola Pablo</p></div><p class=err>${msg}</p><button class="big acc huge" onclick=unlock()>Desbloquear 👆</button>`)}
async function unlock(){try{const id=Uint8Array.from(atob(localStorage.getItem('gt_cred')),c=>c.charCodeAt(0));await navigator.credentials.get({publicKey:{challenge:rnd(32),allowCredentials:[{type:'public-key',id,transports:['internal']}],userVerification:'required',timeout:60000}});unlocked=true;home()}catch(e){lockScreen('No se pudo verificar. Probá de nuevo.')}}
function boot(){if(localStorage.getItem('gt_cred')&&WA)lockScreen();else{unlocked=true;home()}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(localStorage.getItem('gt_cred')&&WA&&unlocked&&Date.now()-hiddenAt>60000)lockScreen()});
function ajustes(){const on=!!localStorage.getItem('gt_cred');h(`<h1>⚙️ Ajustes</h1><div class=grow>
 ${!WA?'<p class=err>Este navegador no soporta huella/cara. La app abre sin bloqueo.</p>':on?'<p>Huella/cara: <b>ACTIVADO</b></p><button class="big" onclick=bioOff()>Desactivar huella/cara</button>':'<p>Huella/cara: <b>apagado</b></p><button class="big acc" onclick=bioOn()>Activar huella/cara</button>'}
 <p class=muted style="margin:12px 0">Es solo un bloqueo de pantalla: los datos quedan sin cifrar en este celular.</p><button class="big" onclick=exportar()>💾 Exportar respaldo</button></div><button class=big onclick=home()>Inicio</button>`)}
// ---------- home ----------
function home(){const w=week(),dw=new Date().getDay(),hoy=DIAS[dw];
 const wt=w===0?'Arrancás el lunes 19/10':w===7?'Bloque terminado ✅':`Semana ${w} de 6${w===6?' · Descarga':''}`;
 h(`<div class=wk>${wt}</div>${w>=1&&w<=6?`<p class=obj>🎯 ${OBJ[w]}</p>`:''}
 <p class=today>Hoy (${DN[dw]}): <b>${P[hoy]?'Rutina '+hoy:hoy}</b></p><div class=grow></div>
 ${['A','B','C'].map(r=>`<button class="big ${r===hoy?'acc':''}" onclick="resumen('${r}')">${P[r].t}</button>`).join('')}
 <div class=row><button class=mid onclick=peso()>⚖️ Peso</button><button class=mid onclick="hist('A')">📊 Historial</button><button class=mid onclick=ajustes()>⚙️</button></div>
 ${WA&&!localStorage.getItem('gt_cred')?'<button class=small onclick=bioOn()>👆 Activar huella/cara</button>':''}${!WA?'<p class="muted c sm">Este navegador no soporta huella/cara.</p>':''}`)}
// ---------- resumen + guía ----------
function last(r,i){const l=D.log[r+i]||{};const ks=Object.keys(l).map(Number).sort((a,b)=>b-a);return ks.length?{w:ks[0],kg:l[ks[0]]}:null}
const short=n=>n.replace(/\s*\(.*?\)/g,'').replace(/,.*$/,'').replace('Final: ','');
function resumen(r){h(`<h2>${P[r].t}</h2><ol class="sum grow">${P[r].e.map((e,i)=>{const L=last(r,i);return`<li><span>${short(e[0])}</span> <b>${e[1].replace(' por lado',' c/lado').replace(' por pierna',' c/pierna').replace(' (30″ fuerte / 30″ suave)',' × 30″')}${L?` · ${L.kg} kg`:''}</b></li>`}).join('')}</ol>
 <button class="big acc" onclick="start('${r}')">Empezar ▶</button><button class=small onclick=home()>← Inicio</button>`)}
function start(r){cur={r,i:0};ex()}
function ex(){const{r,i}=cur,e=P[r].e[i],w=Math.max(1,Math.min(6,week())),L=last(r,i),val=(D.log[r+i]||{})[w]??(L?L.kg:''),fin=r==='C'&&i===7;
 h(`<p class="muted sm">${P[r].t} · ${i+1}/${P[r].e.length}</p><h2>${e[0]}</h2>
 <div class=sr>${e[1]}</div><p class=info>⏱️ ${e[2]} · RPE ${e[3]}<br>🔄 ${e[4]}</p><div class=grow><p class=note>${e[5]}</p></div>
 ${fin?'':`<div class=kgrow><div class=lastbox>Última<br><b>${L?L.kg:'—'}</b></div><input id=kg class=kg type=text inputmode=decimal value="${val}" placeholder="kg"><span class=kgl>kg</span></div>`}
 <div class=row><a class="mid vid" href="${e[6]}" target=_blank rel=noopener>Ver video ▶</a>${e[2]!=='—'?`<button class=mid onclick="timer('${e[2]}')">⏱️ ${e[2]}</button>`:''}</div>
 <button class="big acc" onclick=done()>Listo → siguiente</button>
 <div class=row><button class=mid onclick=nav(-1)>← Anterior</button><button class=mid onclick=nav(1)>Siguiente →</button></div>`)}
let TI=null;function timer(s){clearInterval(TI);let t=s.includes('′')?parseInt(s)*60:parseInt(s);const f=()=>`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;
 h(`<p class=today>Descanso</p><div class="grow tbig" id=tt>${f()}</div><button class="big acc" onclick="clearInterval(TI);ex()">Volver al ejercicio</button>`);
 TI=setInterval(()=>{t--;const el=$('tt');if(!el)return clearInterval(TI);el.textContent=t>0?f():'¡Dale! ✅';if(t<=0){clearInterval(TI);navigator.vibrate&&navigator.vibrate([400,200,400])}},1000)}
const num=v=>parseFloat(String(v).replace(',','.'));
async function done(){const k=$('kg');if(k){const v=num(k.value);if(v>0){const id=cur.r+cur.i;(D.log[id]=D.log[id]||{})[Math.max(1,Math.min(6,week()))]=v;await save()}}nav(1)}
function nav(d){cur.i+=d;if(cur.i<0)cur.i=0;if(cur.i>=P[cur.r].e.length)return h(`<div class=grow><div class=wk>Terminaste 💪</div><p class="c today">¡Muy bien, Pablo!</p></div><button class="big acc" onclick=home()>Inicio</button>`);ex()}
// ---------- peso ----------
function peso(){const L=D.peso.slice(-4).reverse(),u=D.peso.at(-1);
 h(`<h1>⚖️ Peso</h1><div class=kgrow><input id=pk class=kg type=text inputmode=decimal value="${u?u.kg:''}" placeholder="kg"><span class=kgl>kg</span></div>
 <button class="big acc" onclick=addP()>Guardar peso de hoy</button>
 <div class=row style="align-items:center">🎯 Meta <input id=meta class=meta inputmode=decimal value="${D.meta||''}" placeholder="—"> kg <button class=mid onclick=setMeta()>OK</button></div>
 <ul class="list grow">${L.map(x=>`<li>${x.d} · <b>${x.kg} kg</b></li>`).join('')||'<li>Sin registros</li>'}</ul><button class=big onclick=home()>Inicio</button>`)}
async function addP(){const v=num($('pk').value);if(!(v>0))return;D.peso.push({d:new Date().toLocaleDateString('es-AR'),kg:v});await save();peso()}
async function setMeta(){D.meta=$('meta').value.trim();await save();peso()}
// ---------- hist / export ----------
function hist(r){h(`<div class=row>${['A','B','C'].map(x=>`<button class="mid ${x===r?'acc':''}" onclick="hist('${x}')">${x}</button>`).join('')}</div>
 <div class=grow><table><tr><th>kg</th>${[1,2,3,4,5,6].map(w=>`<th>S${w}</th>`).join('')}</tr>${P[r].e.map((e,i)=>`<tr><td>${short(e[0])}</td>${[1,2,3,4,5,6].map(w=>`<td>${(D.log[r+i]||{})[w]??'·'}</td>`).join('')}</tr>`).join('')}</table></div><button class=big onclick=home()>Inicio</button>`)}
function exportar(){let csv='rutina,ejercicio,semana,kg\n';for(const r of['A','B','C'])P[r].e.forEach((e,i)=>{for(const[w,kg]of Object.entries(D.log[r+i]||{}))csv+=`${r},"${e[0]}",${w},${kg}\n`});csv+='\nfecha,peso\n'+D.peso.map(x=>`${x.d},${x.kg}`).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='entrenamiento-respaldo.csv';a.click();navigator.clipboard?.writeText(csv).catch(()=>{});alert('Respaldo descargado (y copiado).')}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
boot();
