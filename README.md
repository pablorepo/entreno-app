# Entreno App

App web personal de entrenamiento de Pablo para usar en el gimnasio desde el iPhone, instalada como PWA (app en la pantalla de inicio).

**En vivo:** https://pablorepo.github.io/entreno-app/

## Qué hace

- Muestra la semana actual del bloque de entrenamiento, la fecha de inicio del plan y qué rutina toca hoy.
- Las semanas son de calendario y dependen solo de la fecha: el lunes de inicio (`bloque.inicio` en `plan.json`) empieza la Semana 1, y los días antes del inicio también cuentan como Semana 1. Al pasar la última semana del plan el contador sigue (`Semana 7 de 6`, `Semana 8 de 6`…) con la prescripción de la última semana, y los kilos, ✓ Hecho, historial, peso y CSV se guardan con la semana real.
- Guía cada rutina ejercicio por ejercicio: series y repeticiones, descanso, RPE, nota técnica y un video de referencia (desde v1, sin alternativas: el ejercicio se hace o se saltea).
- Timer de descanso (al terminar vibra y vuelve solo al ejercicio, con el kg tipeado intacto) y registro de kilos por ejercicio y semana. Se aceptan hasta 3 cifras con decimal (`112,5`, `120`) y **0 = sin peso** (distinto de dejar el campo vacío, que no guarda nada, o de borrar un valor ya guardado).
- **Peso por ejercicio** (desde v1): tocando «Última» en el ejercicio o desde Historial. Un historial único y continuo por ejercicio, que atraviesa planes y bloques (gráfico con fecha real, marcas de bloque, huecos de meses, lista paginada). «Última» es el último kg de siempre de ese ejercicio.
- Historial de cargas por semana (3 semanas por pantalla con números grandes, ◀ ▶ para cambiar de página; abre en la semana actual), seguimiento con meta propia y exportación a CSV.
- Métricas (botón Métricas en Inicio): por cada rutina, sesiones completas sobre el total del plan (`hechas/total · %`) y, más chico, cumplimiento al día (semanas transcurridas, incluida la actual). Solo cuentan las semanas hasta la actual: un ✓ Hecho en una semana futura (reloj cambiado o datos importados) no suma. Una sesión cuenta como completa cuando al menos el 50 % de los ejercicios de esa rutina que aplican esa semana (sin los `omitirEn`; desde la Semana 7 la lista de la última semana) tienen ✓ Hecho en esa semana: `Math.ceil(n/2)`, o sea 5 de 9 o 4 de 8; el total es semanas del plan × veces por semana en la agenda. Desde la Semana 7 el total sigue fijo, el número llega como máximo al total (`6/6`), las sesiones extra se muestran aparte como `(+N extra)` y el % queda en 100%.
- Sin bloqueo ni contraseña: la app abre directo. Los datos quedan solo en este celular (localStorage, sin cifrar); conviene exportar un respaldo de vez en cuando. Si venías de una versión con bloqueo con huella/cara, al abrir v10 ese bloqueo se apaga solo y tus datos quedan.

## Cambiar el nombre de la app

El nombre visible es **Entreno**. Para cambiarlo:
1. En `app.js`, editá la constante `APP_NAME` (al principio de la sección "state"). Así cambia el título de la pestaña y el encabezado de Inicio.
2. En `manifest.json`, cambiá `name` y `short_name`: es el nombre del ícono en el iPhone. El manifest no puede leer `app.js`.
3. Opcional: en `index.html`, cambiá `<title>`. Es solo el valor inicial, porque `app.js` lo pisa.
4. Subí la versión de caché en `sw.js` y volvé a agregar la app a inicio si querés ver el nombre nuevo en el ícono.

## Plan y app (desde v8)

- El plan (bloque, rutinas, ejercicios, objetivos, agenda) vive en **`plan.json`** y lo edita Coach. La app lo carga con `fetch` + `JSON.parse` (no ejecuta nada) y lo valida con `validar-plan.js`.
- Si el plan nuevo tiene un error, la app sigue con el último plan válido y muestra un aviso en Inicio. Si nunca hubo uno válido (o `plan.json` no responde en 8 s), muestra «No se pudo cargar el plan» con Reintentar, Ir a Peso y Exportar.
- Guía para Coach (con checklist): `GUIA-COACH.md`. Antes de publicar: `node check-plan.mjs plan.json --prev <plan publicado>`.
- Numeración (desde v1): lo que se ve es **«Versión 1»** (`APP_LABEL` en `app.js`) y **«Plan v1»** (`planVersion − PLAN_BASE`, con `PLAN_BASE = 6`: planVersion 7 = Plan v1, 8 = v2…). Lo interno sigue monotónico: `APP_VERSION` = `'13'` (string) es lo que el validador compara contra `minApp` del plan (string `"13.0"`, formato `"N.N"`): si el plan pide una app más nueva, se avisa “actualizá la app” y se sigue con el anterior.
- Anti-rollback (v1, H5): un `plan.json` con `planVersion` menor al vigente, o igual con otro contenido, se ignora en silencio (solo `console.warn`); igual e idéntico no hace nada. Coach siempre sube `planVersion`.
- Ids de ejercicio (v1): el **código del catálogo** `EJ-NNN` (catálogo de Coach, `catalogo-ejercicios.json`). Nunca se muestra en la app ni en el CSV.

## Datos (esquema 3, desde v8)

- Se guardan en `gt_data3`. `gt_data` (esquema 2) queda congelado como respaldo y esta app nunca lo escribe; si una app vieja agregó datos ahí, se suman sin duplicar.
- `log[bloque][exId][semana]`: kg (tabla del Historial). `hechos[bloque][exId][semana]`: ✓ Hecho.
- `hist`: histórico **append-only** de kg (`blockId`, `exId`, `e`, `r`, `kg`, `f`, `w`; `kg:null` = borrado; `kg:0` = sin peso). Única excepción (v12): si se vuelve a guardar el mismo ejercicio el **mismo día en hora local del teléfono**, se reemplazan el kg y la hora del **último** registro de ese ejercicio, siempre que sea de ese día y esa semana, tenga kg (no sea un borrado) y no sea un dato migrado. Así Cambios muestra un solo valor por día. Los renombres del plan se anotan como `{tipo:'alias'}`.
- `peso`: histórico continuo por fecha (`kg`, `f`, `w` = semana real del plan, también 7, 8…, o `null` antes del inicio). `meta`: meta de peso (vive en la app, no en el plan).
- Migración: los ids viejos (`A0`…`C8`) pasan a slugs con un mapa embebido en `app.js` (no depende de que `plan.json` cargue). Ids desconocidos quedan como `legacy-*`.
- **Migración v1 a códigos EJ-NNN** (mapa del catálogo embebido en `app.js`, `SLUG2EJ`; idViejo vía `MAPB1`): al arrancar, si hay ids viejos, (1) se copia el texto crudo de `gt_data3` byte a byte a **`gt_data3_premig`** y la fecha a `gt_data3_premig_fecha` (se escribe **una sola vez**, en la primera migración: si `gt_data3_premig` ya existe no se toca y nunca se crean `gt_data3_premig_<ms>`; la copia de lo anterior a cada import es `gt_backup_import`); (2) se migra en memoria: cada slug/idViejo se reemplaza por su código en `log`, `hechos`, `hist`, `nombres` y `rutas`, en cualquier bloque; los registros `{tipo:'alias'}` se sacan todos (H15: la app ya no escribe alias, nunca los usó para buscar kg; el mapa vive solo en el código y `renombres` del plan se usa solo en memoria; los originales siguen en `gt_data3_premig`); los ids sin match se conservan tal cual; (3) recién ahí se escribe `gt_data3`. Si (1) o (3) fallan (cuota), `gt_data3` queda intacto y la app muestra «No hay espacio». Idempotente. Única baja permitida: el mismo ejercicio registrado bajo dos ids el mismo día y bloque → queda el más reciente (el otro sigue en el respaldo). Ids sin match quedan tal cual (`D.ej.sinMapear`) y nunca bloquean el plan. Marca: `D.ej` (`at`, `src`, `bak`, `sinMapear`).
- Respaldo JSON (v1, ítem 6; pantallas = `ux/import-v1`, aprobadas por Pablo el 19/10 19:22, referencia `resumen-4.png` sha256 `14aecef6…`): `exportBackupJSON()` → `{"formato":"entreno-respaldo","v":1,"app":"13","at":…,"claves":{"gt_data3":"<texto crudo>","gt_data":"<texto crudo>"}}`; `impValidar(texto)` → `impPreview(v)` → `impAplicar(v,{confirmado:true})` (copia interna en `gt_backup_import` (rotación de 2: la anterior pasa a `gt_backup_import_2` y la más vieja se descarta; si falla, las dos quedan como estaban) + descarga de la copia, y recién ahí reemplaza; atómico). Ajustes: **Exportar respaldo** (baja `entreno-respaldo-dd-mm-aa.json`, importable), link **Exportar CSV**, **Importar respaldo** (vista previa → «Reemplazar mis datos» / «Cancelar»; errores «No se tocó nada»; al reemplazar baja `entreno-copia-antes-de-importar-dd-mm-aa.json`, que se importa para volver atrás), **Borrar todos los datos**; pie «Versión 1 · Plan v1 · Bloque 1» (los avisos del plan van solo a `console.warn`). Importar también acepta un `gt_data3` suelto (objeto `v:3`). La app pide `navigator.storage.persist()` al arrancar.
- Prellenado del kg (v1, L5): borrador > último kg del bloque actual > último de bloques anteriores salteando sus semanas de descarga (`D.desc`, se guarda al aplicar cada plan).
- CSV: tabla por semana y `historico_kg` con `bloque` al final (desde v1 sin la columna `exId`: el código nunca va al CSV); `historico_peso` y meta iguales que antes. Desde v11, al final, la sección `hechos` (`rutina,ejercicio,semana,bloque`, una fila por ejercicio y semana marcados) para que el respaldo incluya ✓ Hecho. Desde v12.1 todos los campos de texto, también `rutina`, van entre comillas y neutralizados contra fórmulas (`=`, `+`, `-`, `@` al inicio, también detrás de espacios, y tab o CR al inicio llevan `'` delante; v1), y `historico_kg` sale en orden cronológico por `fecha` (solo en el archivo; los datos guardados no se reordenan). La app no importa CSV.

## Diseño

- Pensada para leerse rápido en el gym: números grandes y alto contraste (fondo negro, texto blanco, acento amarillo).
- Cada pantalla entra completa en el iPhone sin scroll vertical.
- En cada ejercicio la nota técnica ocupa el espacio libre y su letra se ajusta sola (hasta el tamaño del título) para leerse mejor sin scroll; el timer y la lista del Resumen también se agrandan para usar el alto disponible.
- Arriba a la izquierda, en todas las pantallas con barra, el botón Inicio es solo la casita (`aria-label="Inicio"`).
- En cada ejercicio: número dentro de la rutina junto al nombre (por ejemplo `1/9`) y semana actual arriba a la derecha. Abajo, una fila grande con **Timer** a la izquierda y **Hecho** a la derecha; en una superserie (si no es el último del grupo) va «Sin descanso» en el lugar del Timer, y si el ejercicio no tiene descanso (cardio) Hecho ocupa toda la fila y no se muestra el reloj. Debajo, más chicos, Video y las flechas ← → para moverte (no marcan nada). El botón **Hecho** que alterna: solo borde amarillo mientras está pendiente y relleno amarillo cuando está hecho. Tocarlo en un ejercicio hecho lo desmarca (no avanza) y Métricas se recalcula. Vale el último estado.

## Privacidad

- Todos los datos quedan solo en el almacenamiento local del navegador del teléfono (`localStorage`).
- No hay backend, cuentas ni envío de datos a ningún servidor.
- Para respaldar o pasar los datos a otro equipo, usá **Ajustes → Exportar respaldo** (archivo JSON, se vuelve a cargar con **Importar respaldo**). La planilla sale con el link **Exportar CSV**.
- Para empezar de cero: **Ajustes → Borrar todos los datos → Sí, borrar todo** (pide confirmar dos veces). Borra kilos, ejercicios hechos, historial, peso corporal y meta, y también los respaldos internos (`gt_data3_premig*`, `gt_backup_import`, `gt_backup_import_2`); el plan se mantiene.
- Seguridad (v1): CSP por meta con `default-src 'self'`, `script-src 'self'`, `style-src 'self'` (sin `'unsafe-inline'`: los estilos están en `app.css`), `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, y `Referrer-Policy: no-referrer` por meta.

## Instalar en el iPhone

1. Abrí el link en **Safari**.
2. Tocá **Compartir → Agregar a inicio**.
3. Abrila desde el ícono; funciona también sin conexión.

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la app (CSP) |
| `app.css` | Estilos (v1: fuera del HTML por la CSP sin `'unsafe-inline'`) |
| `app.js` | Lógica, guardado local y migración |
| `plan.json` | Plan de entrenamiento (lo edita Coach) |
| `validar-plan.js` | Reglas de validación del plan (app y check-plan) |
| `check-plan.mjs` | Chequeo antes de publicar el plan (`node check-plan.mjs`) |
| `GUIA-COACH.md` | Guía y checklist para Coach |
| `vocab-plan.txt`, `nombres-comunes.txt` | Listas de privacidad de check-plan |
| `sw.js` | Service worker: modo offline y actualizaciones |
| `manifest.json` | Configuración de la PWA (nombre, íconos, colores) |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Íconos (v13: mancuerna amarilla sobre negro; apple-touch 180) |

App estática: sin dependencias ni paso de build. Se publica con GitHub Pages desde la rama `main`, carpeta raíz.

## Qué se publica
- **Se sirve en Pages (la app los usa):** `index.html`, `app.css`, `app.js`, `validar-plan.js`, `plan.json`, `sw.js`, `manifest.json` y los íconos.
- **Herramientas de edición (no se publican en este repo):** `GUIA-COACH.md`, `check-plan.mjs`, `vocab-plan.txt`, `nombres-comunes.txt`. Viven en el entorno de trabajo del equipo y se usan antes de cada publicación.

## Publicar una versión nueva

1. Subí los archivos actualizados a `main`.
- **v1 (interno 13):** historial único por código EJ-NNN con migración y respaldo `gt_data3_premig`, Peso por ejercicio, sin alternativas, plan v6 de Coach («Plan v1», planVersion 7, minApp `"13.0"`), CSP sin `'unsafe-inline'` (+`app.css`), anti-rollback del plan, `storage.persist()`, A11Y, timer por hora de fin, casita guarda el kg, prellenado L5. Caché `entreno-r13`. **Esta vez sí se publica `plan.json` junto con la app** (y `app.css`).
- **v13:** solo el ícono de inicio (mancuerna amarilla `#ffd400` sobre negro, propuesta A). Sin cambios de UI ni de plan. `apple-touch-icon.png` a 180px; los `href` de íconos y el manifest llevan `?v=13` para romper la caché de iOS.

2. **Si cambió la app** (`index.html`, `app.js`, `validar-plan.js`, `sw.js`, íconos), cambiá la versión de caché en `sw.js` (constante `C`) por un nombre **nunca usado** (usados: `entreno-app`, `entreno-v3`…`entreno-v13`, `entreno-v10-1`; actual: `entreno-r13`). Nunca repetir.
3. **Si cambió solo el plan**: corré `node check-plan.mjs plan.json --prev <el publicado>`, subí `planVersion` y publicá solo `plan.json`. No hace falta tocar `sw.js`: el plan se pide a la red primero y llega solo (en Inicio aparece “✓ Plan actualizado”).
4. Al abrir la app, `index.html`, `app.css`, `app.js` y `plan.json` se piden a la red primero (sin caché HTTP, con 3 s de espera máxima; si no hay señal se usa la copia guardada).
5. Cuando el teléfono detecta la versión nueva, en **Inicio** aparece el aviso **"Versión nueva → Actualizar"**. Nunca aparece en medio de un ejercicio. Tocá Actualizar (o cerrá y volvé a abrir la app).

## Probar en local

```bash
python3 -m http.server 8000
```

Después abrí http://localhost:8000.

## Volver atrás (rollback)

- **Volver a la v12 publicada sin perder datos (rollback oficial, H12):** rama **`rollback-v12`** (sale de `6ff17ce`, la v12 publicada, + plan v5.1 publicado, planVersion 6). Es la v12 con ícono A, des-migración `EJ-NNN` → ids de la v12 (atómica, con respaldo `gt_data3_desmig`, idempotente), caché `entreno-r13rb` y `APP_VERSION` `'12.1'`. Todo el detalle, la definición de H5 y los tests están en el `README.md` de esa rama. Se publica copiando sus archivos a `pub/` (incluido su `plan.json`).
- **No usar** `84c6555` ni la v12 sin des-migrar con datos ya migrados: no reconocen `EJ-NNN` y el plan v5.1 no carga («No se pudo cargar el plan», QA RB-02a/b).
- **Solo sacar la UI de Importar respaldo** (deja la v1 sin esa pantalla y Ajustes como antes de `ux/import-v1`; la lógica `exportBackupJSON`/`impValidar`/`impAplicar` queda y no se ve): `git -C work revert -m 1 9fe2ef2 -X ours --no-edit`. Sobre el HEAD final hace falta `-X ours`: H11 y H13 tocan las mismas funciones que el merge y, sin eso, `app.js` y `README.md` dan conflicto; `-X ours` conserva la lógica actual y saca la UI (probado: QA RB-01 verde, H13 10/10). Después hay que corregir a mano en este README las dos menciones a «Importar respaldo» (sección Datos y Privacidad), subir la caché a un nombre nuevo y nunca usado (p. ej. `entreno-r13b`) y publicar. `gt_backup_import` y `gt_backup_import_2`, si existen, no molestan (Borrar todos los datos los limpia).
- **Datos:** la v1 guarda el original de antes de la primera migración en `gt_data3_premig` (una sola vez, nunca se pisa) y `rollback-v12` lo conserva. Restaurarlo a mano (`localStorage.setItem('gt_data3', localStorage.getItem('gt_data3_premig'))`) pierde lo registrado después de migrar: es solo el último recurso; el camino normal es `rollback-v12`.
