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

## Datos (esquema 2, desde v7)

- `log`: kg por ejercicio y semana (tabla del Historial).
- `hist`: histórico **append-only** de cambios de kg (`ex`, `e` = ejercicio, `r` = rutina, `kg`, `f` = fecha ISO, `w` = semana). Nunca se edita ni se borra. Si vaciás un kg, se agrega un registro con `kg:null`.
- `hechos`: ejercicios marcados con ✓ Hecho, por semana.
- `peso`: histórico continuo y append-only por fecha (`kg`, `f`; `w` = semana del bloque o `null` fuera de él). Se guarda siempre, también fuera del bloque. Mismo valor el mismo día no se duplica. `meta`: meta de peso.
- Al abrir la app con datos viejos (original o v6), se migran solos: cada kg viejo entra al histórico con la fecha de inicio de su semana, marcado como aproximado. Además queda una copia cruda en `gt_data_v0_backup` o `gt_data_v1_backup`.
- El export CSV incluye la tabla por semana, `historico_kg`, `historico_peso` y la meta.

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
| `app.js` | Lógica, plan de entrenamiento y guardado local |
| `sw.js` | Service worker: modo offline y actualizaciones |
| `manifest.json` | Configuración de la PWA (nombre, íconos, colores) |
| `icon.svg`, `icon-192.png`, `icon-512.png` | Íconos |

App estática: sin dependencias ni paso de build. Se publica con GitHub Pages desde la rama `main`, carpeta raíz.

## Publicar una versión nueva

1. Subí los archivos actualizados a `main`.
2. **Siempre** subí la versión de caché en `sw.js` (constante `C`): `entreno-v7` → `entreno-v8` → … (actual: `entreno-v7`) Un número por publicación, nunca repetir ni bajar.
3. Al abrir la app, `index.html` y `app.js` se piden a la red primero (sin caché HTTP, con 3 s de espera máxima; si no hay señal se usa la copia guardada).
4. Cuando el teléfono detecta la versión nueva, en **Inicio** aparece el aviso **"🔄 Versión nueva → Actualizar"**. Nunca aparece en medio de un ejercicio. Tocá Actualizar (o cerrá y volvé a abrir la app).

## Probar en local

```bash
python3 -m http.server 8000
```

Después abrí http://localhost:8000.
