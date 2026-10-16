# Entreno App

App web personal de entrenamiento de Pablo para usar en el gimnasio desde el iPhone, instalada como PWA (app en la pantalla de inicio).

**En vivo:** https://pablorepo.github.io/entreno-app/

## Qué hace

- Muestra la semana actual del bloque de entrenamiento y qué rutina toca hoy.
- Guía cada rutina ejercicio por ejercicio: series y repeticiones, descanso, RPE, alternativa, nota técnica y un video de referencia.
- Timer de descanso y registro de kilos por ejercicio y semana.
- Historial de cargas por semana, seguimiento con meta propia y exportación a CSV.
- Bloqueo opcional con Face ID o huella (WebAuthn) al abrir la app.

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
2. **Siempre** subí la versión de caché en `sw.js` (constante `C`): `entreno-v6` → `entreno-v7` → … Un número por publicación, nunca repetir ni bajar.
3. Al abrir la app, `index.html` y `app.js` se piden a la red primero (sin caché HTTP, con 3 s de espera máxima; si no hay señal se usa la copia guardada).
4. Cuando el teléfono detecta la versión nueva, en **Inicio** aparece el aviso **"🔄 Versión nueva → Actualizar"**. Nunca aparece en medio de un ejercicio. Tocá Actualizar (o cerrá y volvé a abrir la app).

## Probar en local

```bash
python3 -m http.server 8000
```

Después abrí http://localhost:8000.
