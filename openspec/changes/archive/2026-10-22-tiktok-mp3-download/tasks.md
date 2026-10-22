# Tasks

## 1. Extraccion y entrega de audio en servidor

- [x] 1.1 Anadir tuberia `spawnAudioPipeline` en `lib/download-process.ts` (`yt-dlp -f <id> -o - | ffmpeg -i pipe:0 ... pipe:1`, `shell: false`, fachada compatible con la ruta) y verificar con tests unitarios el formato exacto, los args MP3 y el entubado
- [x] 1.2 Extender `GET /api/download` con `?audio=mp3` (solo TikTok, `audio/mpeg`, `*.mp3`, `mp3` en extensiones permitidas, sin fallback a otra variante) y verificar con tests de ruta que el modo video sigue identico y el modo audio rechaza refs invalidas y de X
- [x] 1.3 Mapear el fallo "ffmpeg/ffprobe not found" a un error claro de componente ausente y verificar con un test de ruta que el cliente recibe mensaje en espanol y no pila interna

## 2. Binario ffmpeg y despliegue

- [x] 2.1 Anadir provision de ffmpeg (`ffmpeg-static` + `FFMPEG_PATH`, binario explicito a la tuberia, `outputFileTracingIncludes` en `/api/download`) y verificar con `npm run build` mas medicion del bundle de la funcion
- [x] 2.2 Actualizar `README.md` (MP3 solo TikTok, limites del plan gratuito, origen del binario de audio) y verificar que el texto documenta el alcance y el aviso legal

## 3. Interfaz de descarga de audio

- [x] 3.1 Anadir en `components/Downloader.tsx` el boton "Descargar audio (MP3)" solo para TikTok con formatos, con estado propio y objetivo tactil de 44 px, y verificar con prueba manual que navega a `/api/download?ref=...&audio=mp3` y no aparece en X
- [x] 3.2 Anadir la nota de derechos junto a la accion de audio y verificar a 360 px que no hay scroll horizontal ni perdida de textos en espanol

## 4. Verificacion integrada

- [x] 4.1 Ejecutar `npm test` y `npm run lint` y verificar que todo pasa sin regresiones en la via de video
- [x] 4.2 Probar manualmente 2-3 TikToks (video MP4 limpio intacto + MP3 que suena con nombre correcto) y verificar que un formato caducado devuelve error claro sin entregar otro archivo
