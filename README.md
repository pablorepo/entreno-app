# Entreno App

App web personal de entrenamiento de Pablo para usar en el gimnasio desde el iPhone, instalada como PWA (app en la pantalla de inicio).

**En vivo:** https://pablorepo.github.io/entreno-app/

## Qué hace

- Muestra la semana actual del bloque de entrenamiento y qué rutina toca hoy.
- Guía cada rutina ejercicio por ejercicio: series y repeticiones, descanso, RPE, alternativa, nota técnica y un video de referencia.
- Timer de descanso y registro de kilos por ejercicio y semana.
- Historial de cargas por semana, seguimiento con meta propia y exportación a CSV.
- Bloqueo opcional con Face ID o huella (WebAuthn) al abrir la app.

## Cambiar el nombre de la app

El nombre visible es **Entreno**. Para cambiarlo:
1. En `app.js`, editá la constante `APP_NAME` (al principio de la sección "state"). Así cambia el título de la pestaña y el encabezado de Inicio.
2. En `manifest.json`, cambiá `name` y `short_name`: es el nombre del ícono en el iPhone. El manifest no puede leer `app.js`.
3. Opcional: en `index.html`, cambiá `<title>`. Es solo el valor inicial, porque `app.js` lo pisa.
4. Subí la versión de caché en `sw.js` y volvé a agregar la app a inicio si querés ver el nombre nuevo en el ícono.

## Plan y app (desde v8)

- El plan (bloque, rutinas, ejercicios, objetivos, agenda) vive en **`plan.json`** y lo edita Coach. La app lo carga con `fetch` + `JSON.parse` (no ejecuta nada) y lo valida con `validar-plan.js`.
- Si el plan nuevo tiene un error, la app sigue con el último plan válido y muestra un aviso en Inicio. Si nunca hubo uno válido, muestra una pantalla con Reintentar, Ir a Peso y Exportar.
- Guía para Coach (con checklist): `GUIA-COACH.md`. Antes de publicar: `node check-plan.mjs plan.json --prev <plan publicado>`.
- `APP_VERSION` (en `app.js`, hoy `8.0`) y `minApp` (en el plan): si el plan pide una app más nueva, se avisa “actualizá la app” y se sigue con el anterior.

## Datos (esquema 3, desde v8)

- Se guardan en `gt_data3`. `gt_data` (esquema 2) queda congelado como respaldo y esta app nunca lo escribe; si una app vieja agregó datos ahí, se suman sin duplicar.
- `log[bloque][exId][semana]`: kg (tabla del Historial). `hechos[bloque][exId][semana]`: ✓ Hecho.
- `hist`: histórico **append-only** de kg (`blockId`, `exId`, `e`, `r`, `kg`, `f`, `w`; `kg:null` = borrado). Los renombres del plan se anotan como `{tipo:'alias'}`.
- `peso`: histórico continuo por fecha (`kg`, `f`, `w` = semana del bloque o `null`). `meta`: meta de peso (vive en la app, no en el plan).
- Migración: los ids viejos (`A0`…`C8`) pasan a slugs con un mapa embebido en `app.js` (no depende de que `plan.json` cargue). Ids desconocidos quedan como `legacy-*`.
- CSV: tabla por semana y `historico_kg` con `bloque,exId` al final; `historico_peso` y meta iguales que antes.

## Diseño

- Pensada para leerse rápido en el gym: números grandes y alto contraste (fondo negro, texto blanco, acento amarillo).
- Cada pantalla entra completa en el iPhone sin scroll vertical.

## Privacidad

- Todos los datos quedan solo en el almacenamiento local del navegador del teléfono (`localStorage`).
- No hay backend, cuentas ni envío de datos a ningún servidor.
- Para respaldar o pasar los datos a otro equipo, usá **Ajustes → Exportar CSV**.

## Instalar en el iPhone

1. Abrí el link en **Safari**.
2. Tocá **Compartir → Agregar a inicio**.
3. Abrila desde el ícono; funciona también sin conexión.

## Estructura

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura y estilos de la app |
| `app.js` | Lógica, guardado local y migración |
| `plan.json` | Plan de entrenamiento (lo edita Coach) |
| `validar-plan.js` | Reglas de validación del plan (app y check-plan) |
| `check-plan.mjs` | Chequeo antes de publicar el plan (`node check-plan.mjs`) |
| `GUIA-COACH.md` | Guía y checklist para Coach |
| `vocab-plan.txt`, `nombres-comunes.txt` | Listas de privacidad de check-plan |
| `sw.js` | Service worker: modo offline y actualizaciones |
| `manifest.json` | Configuración de la PWA (nombre, íconos, colores) |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Íconos |

App estática: sin dependencias ni paso de build. Se publica con GitHub Pages desde la rama `main`, carpeta raíz.

## Qué se publica
- **Se sirve en Pages (la app los usa):** `index.html`, `app.js`, `validar-plan.js`, `plan.json`, `sw.js`, `manifest.json` y los íconos.
- **Herramientas de edición (no se publican en este repo):** `GUIA-COACH.md`, `check-plan.mjs`, `vocab-plan.txt`, `nombres-comunes.txt`. Viven en el entorno de trabajo del equipo y se usan antes de cada publicación.

## Publicar una versión nueva

1. Subí los archivos actualizados a `main`.
2. **Si cambió la app** (`index.html`, `app.js`, `validar-plan.js`, `sw.js`, íconos), subí la versión de caché en `sw.js` (constante `C`): `entreno-v8` → `entreno-v9` → … (actual: `entreno-v8`) Un número por publicación, nunca repetir ni bajar.
3. **Si cambió solo el plan**: corré `node check-plan.mjs plan.json --prev <el publicado>`, subí `planVersion` y publicá solo `plan.json`. No hace falta tocar `sw.js`: el plan se pide a la red primero y llega solo (en Inicio aparece “✓ Plan actualizado”).
4. Al abrir la app, `index.html`, `app.js` y `plan.json` se piden a la red primero (sin caché HTTP, con 3 s de espera máxima; si no hay señal se usa la copia guardada).
5. Cuando el teléfono detecta la versión nueva, en **Inicio** aparece el aviso **"🔄 Versión nueva → Actualizar"**. Nunca aparece en medio de un ejercicio. Tocá Actualizar (o cerrá y volvé a abrir la app).

## Probar en local

```bash
python3 -m http.server 8000
```

Después abrí http://localhost:8000.
