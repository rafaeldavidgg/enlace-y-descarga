# Proposal

## Why

Los videos de TikTok se consumen a menudo por su audio (musica, voz, sonidos). Hoy la app solo entrega MP4 con audio+video juntos, asi que quien quiere el audio tiene que descargar el video completo y convertirlo fuera. Ofrecer MP3 directo para TikTok cierra ese hueco sin tocar la via de video.

## What Changes

- Nuevo boton "Descargar audio (MP3)" visible solo cuando el medio resuelto es de TikTok y tiene formatos combinados limpios.
- Nuevo modo de descarga de audio en `GET /api/download`: `?ref=...&audio=mp3` extrae el audio del mismo `format_id` limpio de la referencia mediante una tuberia `yt-dlp | ffmpeg` en streaming y lo entrega como `titulo.mp3` (`audio/mpeg`, `Content-Disposition: attachment`).
- Sin cambios en la via de video: `GET /api/download?ref=...` sigue entregando el MP4 limpio exacto, sin fallback a variantes con marca.
- Empaquetado de `ffmpeg` junto a `yt-dlp` (via `ffmpeg-static` o binario en `bin/` + `outputFileTracingIncludes`) para que la tuberia de audio funcione igual en local y en Vercel.
- `ALLOWED_EXTENSIONS` acepta `mp3`; el nombre de archivo y `Content-Type` se adaptan al modo audio.
- Aviso legal/UX reforzado en el punto de descarga de audio (contenido con musica sujeta a derechos).

## Capabilities

### New Capabilities

- `descarga-de-audio`: extraer y entregar el audio en MP3 de un TikTok a partir de su variante limpia combinada, en streaming y como descarga real.

### Modified Capabilities

- `interfaz-web`: exponer la accion de descarga de audio solo para TikTok, con estados de descarga y objetivo tactil propios.
- `ejecucion-local-y-despliegue`: resolver y empaquetar el binario de conversion de audio (ffmpeg) ademas de yt-dlp, manteniendo paridad local/Vercel.

## Impact

- Afecta a `app/api/download/route.ts` (nuevo parametro `audio`, tipos de contenido, extensiones), `lib/download-process.ts` (nueva tuberia `spawnAudioPipeline`), `lib/ffmpeg.ts` (nuevo resolvedor), `components/Downloader.tsx` (segundo boton + estado), `scripts/fetch-*` + `next.config.ts` (binario ffmpeg), `package.json` (dependencia `ffmpeg-static` o equivalente).
- Sin cambios en `POST /api/info` ni en `selectCombinedFormats()`: la lista de formatos sigue siendo solo MP4 combinados limpios; el MP3 deriva del formato de video ya elegido.
- Riesgo principal: tamano de la funcion en Vercel gratuito y CPU de transcodificacion; se mitiga midiendo el bundle y manteniendo el timeout/streaming actuales.
