# Enlace y Descarga

Web para pegar un enlace de **TikTok** o **X (Twitter)** y descargar el video con audio.
Funciona desde cualquier dispositivo, no pide cuentas y se puede desplegar gratis en Vercel
o ejecutar en local.

> **Aviso de uso responsable.** Esta herramienta es para uso personal. Eres responsable de
> respetar los términos de servicio y los derechos de autor de cada plataforma: descarga
> únicamente contenido que tengas derecho a usar y no lo redistribuyas sin permiso.

## Estado y alcance

```
+------------+-------------------------------------------------------------+
| Plataforma | Estado                                                      |
+------------+-------------------------------------------------------------+
| TikTok     | Soportada. Devuelve formatos mp4 con audio y video juntos.  |
| X (Twitter)| Soportada si hay MP4 con audio; algunos vídeos solo HLS.    |
| Instagram  | Fuera de alcance: exige cookies de sesión.                  |
| YouTube    | Fuera de alcance: ya no ofrece audio+video en un solo       |
|            | archivo (todo es DASH con pistas separadas).                |
+------------+-------------------------------------------------------------+
```

No se extrae solo el audio (MP3) ni se fusionan pistas separadas: se descargan únicamente
formatos que ya incluyen audio y video juntos, por lo que no hace falta `ffmpeg`. En X esos
archivos son los MP4 progresivos (`http-*`); yt-dlp no reporta sus códecs, pero contienen
ambas pistas. Cuando X solo ofrece HLS con pistas separadas, el vídeo no se puede descargar.

## Cómo funciona

```
navegador --POST /api/info------> yt-dlp --dump-single-json  -> metadatos + formatos
navegador --GET  /api/download--> yt-dlp -o - (stdout)       -> streaming del archivo
```

- `POST /api/info` valida el enlace, resuelve título, miniatura, duración y la lista de
  formatos descargables, y devuelve **referencias opacas firmadas** (nunca la URL del CDN).
- `GET /api/download?ref=...` verifica la referencia y reenvía el archivo **en streaming**
  con `Content-Disposition: attachment`, para que el navegador descargue de verdad.

El streaming es clave: evita el límite de 4.5 MB de respuesta de las funciones serverless de
Vercel (no aplica a respuestas en streaming) y permite que el botón descargue el archivo en
lugar de reproducirlo.

## Requisitos

- Node.js 20.9 o superior (probado con Node 22).
- No necesitas instalar `yt-dlp`: se descarga automáticamente (ver más abajo).

## Ejecución local

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. En el primer arranque, `predev` descarga el binario de
`yt-dlp` correspondiente a tu sistema operativo (Windows, macOS o Linux) en `bin/`. La
carpeta `bin/` está ignorada por git y el binario no se versiona. `npm install` por sí solo
no lo descarga: lo hace el primer `npm run dev` o `npm run build`.

Comandos útiles:

```bash
npm test        # pruebas unitarias (vitest)
npm run lint    # analisis estatico (eslint)
npm run build   # build de produccion
npm start       # sirve el build de produccion
```

Para forzar la descarga del binario de nuevo:

```bash
YTDLP_FORCE_DOWNLOAD=1 npm run dev
```

## Despliegue en Vercel (plan gratuito)

El proyecto está listo para desplegarse sin pasos manuales:

1. Sube el repositorio a GitHub.
2. En Vercel, importa el repositorio. Detecta Next.js automáticamente.
3. Despliega. Durante el build, `prebuild` descarga el binario de Linux de `yt-dlp` y
   `next.config.ts` lo incluye en el paquete de las funciones `/api/info` y `/api/download`.
4. (Opcional) Define `APP_SIGNING_SECRET` con un valor aleatorio en las variables de entorno
   del proyecto, para firmar las referencias de descarga. Si no la defines, se usa un valor
   de desarrollo; funciona, pero cualquiera podría forjar referencias.

No necesitas configurar base de datos ni almacenamiento.

## Límites conocidos del plan gratuito

- **Transferencia**: Vercel Hobby incluye unos **100 GB/mes**. La descarga consume de esa
  cuota.
- **Duración de función**: hasta **300 s** por petición. Un video muy largo puede cortarse;
  la app comunica el corte y sugiere un formato menor.
- **Vercel no está pensado como servidor de medios**: este proyecto asume ese riesgo para
  uso personal y no debe promocionarse como servicio masivo. Si crece, mueve el proxy a un
  host propio; la UI no cambia.

## Estructura

```
app/
  api/info/route.ts        resolver metadatos y formatos
  api/download/route.ts    proxy en streaming
  page.tsx                 interfaz (espanol)
components/Downloader.tsx  formulario, preview, selector y descarga
lib/
  platforms.ts             validacion de enlaces y plataformas soportadas
  extractor.ts             metadatos, filtrado de formatos y referencias firmadas
  ytdlp.ts                 localizacion y ejecucion del binario, clasificacion de errores
  download-process.ts      lanzamiento del proceso de descarga
  format.ts                utilidades de formato para la UI
scripts/fetch-ytdlp.mjs    descarga del binario segun el sistema operativo
tests/                     pruebas unitarias y de la ruta de descarga
```

## Licencia y origen del binario

El binario de `yt-dlp` se descarga desde el repositorio oficial
<https://github.com/yt-dlp/yt-dlp/releases> y no se distribuye con este código. Consulta su
licencia (Unlicense) en el repositorio del proyecto.
