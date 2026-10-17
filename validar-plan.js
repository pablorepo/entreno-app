// Validación de plan.json. La usan la app (navegador) y check-plan.mjs (node). Sin dependencias.
// Reglas: plan-vs-app.md §4.a (fatales de seguridad/estructura) y §6 (largos). En la app los largos y la privacidad son aviso; en check-plan.mjs, error.
(function(G){
'use strict';
const SCHEMAS=[1];
const LIM={titulo:32,nombre:40,nota:150,alternativa:40,series:28,rpe:12,nombreCorto:24,objetivo:60,bloqueNombre:40,agendaTexto:15,formato:40,carga:20,tempo:10,semanaNota:60,grupo:12};
const MAXEJ=10,DIAS=['dom','lun','mar','mie','jue','vie','sab'];
const BAD=/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff<>`\\]/;
const TEMPO=/^[0-9X]{1,2}(-[0-9X]{1,2}){2,3}$/,SLUG=/^[a-z0-9-]{3,40}$/,DESC=/^(\d{1,3}″|\d{1,2}′|—)$/,VID=/^[A-Za-z0-9_-]{11}$/,VIEJO=/^[A-Z]\d{1,2}$/;
const IGN=['notas_coach','_ayuda','notasComunes','notaComun'];
const KNOWN={raiz:['schema','planVersion','minApp','bloque','semanas','agenda','rutinas','retirados','renombres','defaults'],bloque:['id','numero','nombre','inicio','semanas','descarga'],
 rutina:['id','titulo','ejercicios'],ej:['id','idViejo','nombre','nombreCorto','series','descanso','rpe','alternativa','nota','video','registraKg','porSemana','omitirEn','grupo','formato','carga','tempo'],semana:['objetivo','nota'],porSemana:['series','rpe','descanso','carga','tempo','formato','nota'],dia:['rutina','texto'],defaults:['descanso']};
// Privacidad (check-plan.mjs la bloquea; la app solo avisa)
const ALLOW=new Set(['Pablo','Hack','Smith','Hammer','Scott','Pallof','Z','T','RPE','YouTube','V-squat','Hip','Remo','Press','Curl','Prensa','Jalón','Hyrox']);
const DIAG=/diabet|hipertens|presi[oó]n alta|asma|c[aá]ncer|tumor|epileps|depresi[oó]n|ansiedad|card[ií]ac|arritmia|infarto|colesterol|tiroid|obesidad|embaraz|diagn[oó]stic|enfermedad|s[ií]ndrome|patolog/i;
const MEDIC=/medicaci[oó]n|medicamento|\bmedicad|pastilla|ibuprofeno|paracetamol|diclofenac|insulina|antiinflamatorio|corticoide|anticoagulante|\btoma \w+ ?mg|\d+ ?mg\b/i;
const LES=/lesi[oó]n|operad[oa]|cirug|hernia|\bLCA\b|ligamento cruzado|menisco|tendinitis|tendinopat|fractura|pr[oó]tesis|esguince|lumbalgia|ci[aá]tica|artrosis|artritis|condromalacia|bursitis|desgarro|luxaci/i;
const ATRIB=/\b(tiene|ten[eé]s|tengo|tuvo|tuve|tuviste|sufre|sufr[ií]s|padece|su|sus|tu|tus|mi|mis|le|operad[oa]|lesionad[oa]|recuper[aá]ndose|de Pablo|Pablo)\b/i;
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)};
// Largos ya publicados y aprobados (el plan actual no se cambia): excepción por hash del texto exacto.
const LARGO_OK=new Set(['e8f641ed']);
const verCmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);return(x[0]-y[0])||((x[1]||0)-(y[1]||0))};
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const len=s=>[...s].length;
const SALUD_OK=new Set(['42d9cb24','d2b37c3d','6c8bbae7','ceaae417','6e15641d','d415f9ac','dd863341']);// textos de salud aprobados (QA-12), por hash del texto exacto
const DOLOR=/duele|dolor|molest|hormigue|lastim|seguridad/i,SALUDREQ=/m[eé]dic|kinesi|traumat|fisiatr/i;
const sinTilde=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// items: [ruta, texto, tipo]  tipo: 'texto' | 'slug' (ids) | 'clave' (nombres de claves)
// opt.vocab (Set, minúsculas): primera palabra de frase permitida. opt.nombres (Set, sin tildes): nombres/apellidos comunes. Los dos los carga check-plan.mjs.
function privacidad(items,opt){opt=opt||{};const out=[],o=(p,m)=>out.push(`${p}: ${m}`);
 const nom=(p,s)=>{if(!opt.nombres)return;for(const t of sinTilde(s).split(/[^a-zñ]+/))if(t&&t!=='pablo'&&opt.nombres.has(t)){o(p,`contiene "${t}", un nombre o apellido común (solo se permite Pablo)`);break}};
 for(const[p,s,tipo]of items){
  if(tipo!=='texto'){nom(p,s);continue}
  if(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(s))o(p,'parece un email');else if(/(^|\s)@\w{2,}/.test(s))o(p,'parece un @usuario');
  if(/https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|ar|io|es|be|me|ly|app|tv|info|co|gl|link|to)\b/i.test(s))o(p,'contiene una URL o dominio (el video va solo como id)');
  if(/\+?\d[\d\s().-]{7,}\d/.test(s))o(p,'parece un teléfono o documento');else if(/\b\d{7,8}\b|\b\d{2}\.\d{3}\.\d{3}\b/.test(s))o(p,'parece un DNI');
  if(/nacimiento|naci[oó] el|cumplea/i.test(s))o(p,'parece una fecha de nacimiento');
  const kg=[...s.matchAll(/\b(\d{2,3})([.,]\d+)?\s?(kg|kgs|kilos?|kilogramos?)\b/gi)].some(m=>+m[1]>=40);if(kg||/\bpes(o|a|ás|aba|ando)\s+(unos\s+)?\d/i.test(s))o(p,'parece un peso corporal');
  // Salud (v8.1): permitidas las notas técnicas genéricas de dolor/seguridad SOLO en notas; bloquea diagnósticos, medicación,
  // lesiones con nombre médico y menciones a profesionales de salud, salvo texto aprobado por hash.
  const ok=SALUD_OK.has(fnv(s)),esNota=/\.nota$|^plan\.notasComunes\./.test(p);
  if(DIAG.test(s)&&!ok)o(p,'menciona una enfermedad o diagnóstico (dato de salud)');
  if(MEDIC.test(s)&&!ok)o(p,'menciona medicación (dato de salud)');
  if((LES.test(s)||SALUDREQ.test(s))&&!ok)o(p,`menciona una lesión o atención médica (texto no aprobado; hash ${fnv(s)})`);
  if(DOLOR.test(s)&&!esNota&&!ok)o(p,'las indicaciones de dolor van en la nota, no en este campo');
  nom(p,s);
  for(const seg of s.split(/[.!?:·(\n;—¿¡"]|\s-\s/)){const toks=seg.trim().split(/[\s,'/)]+/).filter(Boolean);
   toks.forEach((t,k)=>{if(!/^[A-ZÁÉÍÓÚÑ][\p{L}-]*$/u.test(t)||t.length<2||ALLOW.has(t)||/^[A-Z]\d/.test(t))return;
    if(k>0)o(p,`posible nombre propio "${t}" (solo se permite Pablo; si es vocabulario técnico, sumalo a la allowlist)`);
    else if(opt.vocab&&!t.toLowerCase().split('-').every(x=>opt.vocab.has(x)||opt.vocab.has(sinTilde(x))))o(p,`"${t}" al principio de la frase no está en vocab-plan.txt (si es una palabra común, agregala ahí)`)})}
 }return out}
function validar(o,opt){opt=opt||{};const F=[],W=[],L=[],C=[];let upd=false;const f=m=>F.push(m),w=m=>W.push(m);
 const textos=[];
 const str=(p,v,max,{req=true,minLen=1}={})=>{if(v===undefined&&!req)return false;if(typeof v!=='string'){f(`${p}: tiene que ser texto`);return false}
  if(len(v.trim())<minLen){f(`${p}: no puede estar vacío`);return false}if(max&&len(v)>max&&!LARGO_OK.has(fnv(v)))L.push(`${p}: ${len(v)} caracteres (máx. ${max})`);textos.push([p,v]);return true};
 const U=[],unk=(p,obj,list)=>{for(const k of Object.keys(obj))if(!list.includes(k)&&!IGN.includes(k)){U.push(`${p}.${k}`);w(`${p}: clave desconocida "${k}" (se ignora)`)}};
 // 1-4: forma, claves prohibidas y caracteres en cualquier nivel
 if(!isObj(o))return{fatal:['plan.json: la raíz tiene que ser un objeto'],warn:W,largos:L,check:C,unk:[],priv:[],upd};
 const IT=[],SLUGK=/^(id|idViejo|grupo|rutina|inicio|minApp)$/;
 (function walk(v,p,k){if(Array.isArray(v))v.forEach((x,i)=>walk(x,`${p}[${i}]`,k));else if(isObj(v)){for(const kk of Object.keys(v)){if(kk==='__proto__'||kk==='constructor'||kk==='prototype')f(`${p}.${kk}: clave prohibida`);if(!/^\d+$/.test(kk))IT.push([`${p}.${kk} (clave)`,kk,'clave']);walk(v[kk],`${p}.${kk}`,kk)}}
  else if(typeof v==='string'){if(k!=='video')IT.push([p,v,SLUGK.test(k)||/^plan\.(retirados|renombres)/.test(p)?'slug':'texto']);if(BAD.test(v))f(`${p}: caracteres no permitidos (control, invisibles/bidi, < > \` \\)`);else if(v!==v.trim()&&!/\.nota$/.test(p))w(`${p}: espacios al principio o al final`)}})(o,'plan');
 if(!Number.isInteger(o.schema)||!SCHEMAS.includes(o.schema)){if(Number.isInteger(o.schema)&&o.schema>Math.max(...SCHEMAS))upd=true;f(upd?'Plan para una versión nueva: actualizá la app':'schema: falta o no es soportado')}
 if(o.minApp!==undefined){if(typeof o.minApp!=='string'||!/^\d+\.\d+$/.test(o.minApp))f('minApp: formato "8.0"');else if(opt.appVersion&&verCmp(opt.appVersion,o.minApp)<0){upd=true;f('Plan para una versión nueva: actualizá la app')}}
 if(!Number.isInteger(o.planVersion)||o.planVersion<1)f('planVersion: entero ≥ 1');
 unk('plan',o,KNOWN.raiz);
 // 5-9: bloque
 const b=o.bloque;let N=0;
 if(!isObj(b))f('bloque: falta');else{unk('bloque',b,KNOWN.bloque);
  if(typeof b.id!=='string'||!SLUG.test(b.id))f('bloque.id: slug a-z 0-9 - (3-40)');
  if(!Number.isInteger(b.numero)||b.numero<1||b.numero>99)f('bloque.numero: entero 1-99');
  str('bloque.nombre',b.nombre,LIM.bloqueNombre);
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(b.inicio||'');const d=m&&new Date(+m[1],m[2]-1,+m[3]);const hoy=opt.hoy?new Date(opt.hoy):new Date();
  if(!m||!d||d.getMonth()!==m[2]-1||d.getDate()!==+m[3])f('bloque.inicio: fecha AAAA-MM-DD válida');
  else{if(d.getDay()!==1)f('bloque.inicio: tiene que ser lunes');if(d<new Date(2024,0,1)||d-hoy>365*864e5)f('bloque.inicio: fuera de rango (2024 a hoy+365 días)')}
  if(!Number.isInteger(b.semanas)||b.semanas<1||b.semanas>12)f('bloque.semanas: entero 1-12');else N=b.semanas;
  if(!Array.isArray(b.descarga)||b.descarga.some(x=>!Number.isInteger(x)||x<1||x>N)||new Set(b.descarga).size!==b.descarga.length)f('bloque.descarga: lista de semanas únicas dentro del bloque');}
 // 10: semanas
 if(o.semanas!==undefined&&!isObj(o.semanas))f('semanas: tiene que ser un objeto');
 else{const S=o.semanas||{};for(let i=1;i<=N;i++){if(!own(S,String(i)))w(`semanas.${i}: falta el objetivo`);else if(!isObj(S[i]))f(`semanas.${i}: tiene que ser un objeto`);else{unk(`semanas.${i}`,S[i],KNOWN.semana);str(`semanas.${i}.objetivo`,S[i].objetivo,LIM.objetivo);if(S[i].nota!==undefined)str(`semanas.${i}.nota`,S[i].nota,LIM.semanaNota)}}
  for(const k of Object.keys(S))if(!(+k>=1&&+k<=N&&String(+k)===k))w(`semanas.${k}: fuera del bloque (se ignora)`)}
 // 12-14: rutinas y ejercicios
 const GR=new Map(),ids=new Set(),rids=new Set(),viejos=new Set(),nombres=new Map();const NC=isObj(o.notasComunes)?o.notasComunes:{};
 if(o.notasComunes!==undefined&&(!isObj(o.notasComunes)||Object.values(o.notasComunes).some(v=>typeof v!=='string'||len(v)>500)))f('notasComunes: objeto de textos (≤ 500)');
 if(!Array.isArray(o.rutinas)||o.rutinas.length<1||o.rutinas.length>4)f('rutinas: lista de 1 a 4');
 else o.rutinas.forEach((r,ri)=>{const P=`rutinas[${ri}]`;if(!isObj(r))return f(`${P}: tiene que ser un objeto`);unk(P,r,KNOWN.rutina);
  if(typeof r.id!=='string'||!/^[A-Z]$/.test(r.id))f(`${P}.id: una letra mayúscula`);else if(rids.has(r.id))f(`${P}.id: "${r.id}" repetido`);else rids.add(r.id);
  str(`${P}.titulo`,r.titulo,LIM.titulo);
  if(!Array.isArray(r.ejercicios)||r.ejercicios.length<1)return f(`${P}.ejercicios: lista de 1 a ${MAXEJ}`);
  if(r.ejercicios.length>MAXEJ)f(`${P}.ejercicios: ${r.ejercicios.length} ejercicios (máx. ${MAXEJ}: con más, el resumen no entra sin scroll)`);
  let sinKg=0;r.ejercicios.forEach((e,ei)=>{const Q=`${P}.ejercicios[${ei}]`;if(!isObj(e))return f(`${Q}: tiene que ser un objeto`);unk(Q,e,KNOWN.ej);
   if(typeof e.id!=='string'||!SLUG.test(e.id))f(`${Q}.id: slug a-z 0-9 - (3-40)`);else if(ids.has(e.id))f(`${Q}.id: "${e.id}" repetido (los id son únicos en todo el plan)`);else ids.add(e.id);
   if(str(`${Q}.nombre`,e.nombre,LIM.nombre))nombres.set(e.nombre.trim().toLowerCase(),e.id);
   str(`${Q}.series`,e.series,LIM.series);str(`${Q}.rpe`,e.rpe,LIM.rpe);str(`${Q}.alternativa`,e.alternativa,LIM.alternativa);str(`${Q}.nota`,e.nota,LIM.nota,{minLen:0});
   if(e.descanso===undefined){if(!(isObj(o.defaults)&&o.defaults.descanso))f(`${Q}.descanso: falta (o definí defaults.descanso)`)}else if(typeof e.descanso!=='string'||!DESC.test(e.descanso))f(`${Q}.descanso: formato 90″, 2′ o —`);
   if(typeof e.video!=='string'||!VID.test(e.video))f(`${Q}.video: solo el id de 11 caracteres de YouTube (nunca una URL ni una búsqueda)`);
   if(e.registraKg!==undefined&&typeof e.registraKg!=='boolean')f(`${Q}.registraKg: true o false`);if(e.registraKg===false)sinKg++;
   if(e.nombreCorto!==undefined)str(`${Q}.nombreCorto`,e.nombreCorto,LIM.nombreCorto);
   // v8.1: formato, carga, tempo, porSemana, omitirEn, grupo (todos opcionales)
   for(const k of['formato','carga','tempo'])if(e[k]!==undefined)str(`${Q}.${k}`,e[k],LIM[k]);
   if(typeof e.tempo==='string'&&!TEMPO.test(e.tempo))f(`${Q}.tempo: formato 3-1-1 o 3-1-1-0 (números o X)`);
   // Pantalla (UX v8): el formato solo se muestra en ejercicios sin kg (cardio); en uno con kg no se ve → aviso (app y check-plan)
   if(e.registraKg!==false&&(e.formato!==undefined||(isObj(e.porSemana)&&Object.values(e.porSemana).some(v=>isObj(v)&&v.formato!==undefined))))w(`${Q}.formato: no se muestra porque el ejercicio registra kg (solo se ve con registraKg:false); ponelo en series o en la nota`)
   if(e.porSemana!==undefined){if(!isObj(e.porSemana))f(`${Q}.porSemana: objeto {"n": {...}}`);else for(const[wk,ov]of Object.entries(e.porSemana)){const R=`${Q}.porSemana.${wk}`;
    if(!(String(+wk)===wk&&+wk>=1&&+wk<=N))f(`${R}: semana fuera del bloque`);if(!isObj(ov)){f(`${R}: tiene que ser un objeto`);continue}
    for(const k of Object.keys(ov))if(!KNOWN.porSemana.includes(k)&&!IGN.includes(k))f(`${R}.${k}: no se puede cambiar por semana (solo ${KNOWN.porSemana.join(', ')})`);
    for(const k of['series','rpe','carga','tempo','formato','nota'])if(ov[k]!==undefined)str(`${R}.${k}`,ov[k],LIM[k]);if(ov.tempo!==undefined&&typeof ov.tempo==='string'&&!TEMPO.test(ov.tempo))f(`${R}.tempo: formato 3-1-1 o 3-1-1-0 (números o X)`);
    if(ov.descanso!==undefined&&(typeof ov.descanso!=='string'||!DESC.test(ov.descanso)))f(`${R}.descanso: formato 90″, 2′ o —`)}}
   if(e.omitirEn!==undefined){if(!Array.isArray(e.omitirEn)||e.omitirEn.some(x=>!Number.isInteger(x)||x<1||x>N)||new Set(e.omitirEn).size!==e.omitirEn.length)f(`${Q}.omitirEn: lista de semanas únicas dentro del bloque`);else if(N&&e.omitirEn.length>=N)f(`${Q}.omitirEn: el ejercicio no aparecería en ninguna semana (sacalo y declaralo en retirados)`)}
   if(e.grupo!==undefined&&(typeof e.grupo!=='string'||!/^[A-Za-z0-9-]{1,12}$/.test(e.grupo)))f(`${Q}.grupo: texto corto (letras, números o -, hasta ${LIM.grupo})`);
   if(e.idViejo!==undefined){if(typeof e.idViejo!=='string'||!VIEJO.test(e.idViejo))f(`${Q}.idViejo: formato A0`);else if(viejos.has(e.idViejo))f(`${Q}.idViejo: repetido`);else viejos.add(e.idViejo)}
   if(e.notaComun!==undefined){if(typeof e.notaComun!=='string'||!own(NC,e.notaComun))C.push(`${Q}.notaComun: "${e.notaComun}" no está en notasComunes`);else if(typeof e.nota==='string'&&!e.nota.includes(NC[e.notaComun]))C.push(`${Q}.nota: no contiene el texto de notasComunes.${e.notaComun} (¿lo cambiaste en un solo lugar?)`)}});
  if(sinKg>1)w(`${P}: más de un ejercicio con registraKg:false`);
  // superseries: un grupo = ejercicios consecutivos de la misma rutina
  const G=new Map();r.ejercicios.forEach(e=>{if(isObj(e)&&typeof e.grupo==='string'){if(GR.has(e.grupo)&&GR.get(e.grupo)!==ri)f(`${P}: el grupo "${e.grupo}" ya se usa en otra rutina`);GR.set(e.grupo,ri)}});r.ejercicios.forEach((e,ei)=>{if(isObj(e)&&typeof e.grupo==='string'){if(!G.has(e.grupo))G.set(e.grupo,[]);G.get(e.grupo).push(ei)}});
  for(const[g,ix]of G){if(ix.at(-1)-ix[0]!==ix.length-1)f(`${P}: el grupo "${g}" tiene que ser de ejercicios consecutivos`);else if(ix.length<2)f(`${P}: el grupo "${g}" tiene un solo ejercicio (una superserie necesita 2 o más)`);else if(ix.length>3)w(`${P}: el grupo "${g}" tiene más de 3 ejercicios`)}
  // omitirEn: ninguna rutina puede quedar vacía en una semana
  for(let k=1;k<=N;k++)if(r.ejercicios.every(e=>isObj(e)&&Array.isArray(e.omitirEn)&&e.omitirEn.includes(k)))f(`${P}: en la semana ${k} no queda ningún ejercicio`)});
 // 11: agenda
 if(!isObj(o.agenda))f('agenda: falta');else{const usadas=new Set();for(const k of Object.keys(o.agenda))if(!DIAS.includes(k))f(`agenda.${k}: día desconocido (dom..sab)`);
  for(const dd of DIAS){const a=o.agenda[dd];if(!isObj(a)){f(`agenda.${dd}: falta`);continue}unk(`agenda.${dd}`,a,KNOWN.dia);const hasR=a.rutina!==undefined,hasT=a.texto!==undefined;
   if(hasR===hasT)f(`agenda.${dd}: exactamente "rutina" o "texto"`);else if(hasR){if(!rids.has(a.rutina))f(`agenda.${dd}.rutina: "${a.rutina}" no existe`);else usadas.add(a.rutina)}else str(`agenda.${dd}.texto`,a.texto,LIM.agendaTexto)}
  for(const r of rids)if(!usadas.has(r))w(`rutina ${r}: no tiene ningún día en la agenda`)}
 // 15: defaults, retirados, renombres
 if(o.defaults!==undefined){if(!isObj(o.defaults))f('defaults: objeto');else{unk('defaults',o.defaults,KNOWN.defaults);if(o.defaults.descanso!==undefined&&(typeof o.defaults.descanso!=='string'||!DESC.test(o.defaults.descanso)))f('defaults.descanso: formato 90″, 2′ o —')}}
 const ret=o.retirados===undefined?[]:o.retirados;if(!Array.isArray(ret)||ret.some(x=>typeof x!=='string'||!SLUG.test(x)))f('retirados: lista de id');
 const ren=o.renombres===undefined?{}:o.renombres;if(!isObj(ren))f('renombres: objeto {"id-viejo":"id-nuevo"}');
 else for(const[k,v]of Object.entries(ren)){if(!SLUG.test(k)||typeof v!=='string'||!SLUG.test(v))f(`renombres.${k}: id inválido`);else if(!ids.has(v))f(`renombres.${k}: el destino "${v}" no está en el plan`);else if(ids.has(k))f(`renombres.${k}: el id viejo sigue en el plan`);
  let x=v,seen=new Set([k]);while(own(ren,x)){if(seen.has(x)){f(`renombres: ciclo en "${k}"`);break}seen.add(x);x=ren[x]}}
 // 17: id que desaparece con datos en el mismo bloque
 if(opt.datos&&isObj(b)&&opt.datos.blockId===b.id){const decl=new Set([...(Array.isArray(ret)?ret:[]),...(isObj(ren)?Object.keys(ren):[])]);
  for(const id of opt.datos.ids||[])if(!ids.has(id)&&!decl.has(id)&&!/^legacy-/.test(id))f(`ejercicio "${id}" desapareció y tiene datos en ${b.id}: declaralo en "retirados" o en "renombres"`)}
 // 18-19: comparación con el último plan válido
 const pv=opt.prev;if(isObj(pv)&&isObj(pv.bloque)&&isObj(b)&&pv.bloque.id===b.id){
  const pids=new Map();(pv.rutinas||[]).forEach(r=>(r.ejercicios||[]).forEach(e=>pids.set(e.id,e.nombre)));
  for(const[id,nom]of pids)if(!ids.has(id)&&!(isObj(ren)&&own(ren,id))){const nuevo=typeof nom==='string'&&nombres.get(nom.trim().toLowerCase());if(nuevo)w(`"${nom}": cambió el id ${id} → ${nuevo} sin "renombres" (se corta el historial)`)}
  if(pv.bloque.inicio!==b.inicio)w('cambió la fecha de inicio del bloque en curso')}
 return{fatal:F,warn:W,largos:L,check:C,unk:U,priv:privacidad(IT,opt),upd}}
G.validarPlan=validar;G.validarPlanInfo={SCHEMAS,LIM,MAXEJ,fnv};
})(typeof self!=='undefined'?self:globalThis);
