# Design

## Context

Ver `proposal.md` (Why). Estado actual que condiciona el enfoque:

- `POST /api/info` (`app/api/info/route.ts`) devuelve solo MP4 combinados limpios via `selectCombinedFormats()` (`lib/extractor.ts:157`); no hay formatos audio-only en la lista.
- `GET /api/download` (`app/api/download/route.ts` + `lib/download-process.ts:14`) hace `yt-dlp -f <formatId> -o - <url>` y reenvia en streaming con `Content-Disposition: attachment`. Garantia sin-marca: formato exacto, sin fallback.
- Sin `ffmpeg` por diseno (README: "no hace falta `ffmpeg`"); `package.json` sin dependencias de conversion; `next.config.ts` solo empaqueta `bin/**/*` (yt-dlp) en `/api/info` y `/api/download`.
- Specs vigentes: `descarga-de-medios` (video), `interfaz-web` (una accion de descarga), `ejecucion-local-y-despliegue` (solo binario yt-dlp).

## Goals / Non-Goals

**Goals:**

- MP3 real para TikTok derivado del mismo `formatId` limpio ya elegido, entregado en streaming como `attachment`.
- Via de video intacta: mismo comportamiento, mismos tests, mismos mensajes.
- Paridad local/Vercel para el modo audio.

**Non-Goals:**

- No listar pistas audio-only ni cambiar `POST /api/info` / `selectCombinedFormats()`.
- No MP3 para X/Twitter en este change.
- No cola, almacenamiento persistente ni servicios externos.

## Decisions

### D1: Transcodificacion en servidor con tuberia `yt-dlp | ffmpeg` (frente a `yt-dlp -x`, `.m4a` directo o ffmpeg.wasm en cliente)

- Que: `spawnAudioPipeline(ytdlpBinary, ffmpegBinary, formatId, url)` encadena
  `yt-dlp -f <id> --no-playlist -o - <url>` (mismo `formatId` limpio exacto) con
  `ffmpeg -i pipe:0 -vn -c:a libmp3lame -q:a 2 -f mp3 pipe:1`; el stdout del MP3
  se reenvia en streaming igual que el video, sin archivos temporales.
- Por que: `yt-dlp -x --audio-format mp3` NO funciona con `-o -`: verificado por
  smoke test, yt-dlp omite el postprocesado y devuelve el MP4 intacto (exit 0,
  mismos bytes). La tuberia si produce MP3 valido (cabecera ID3) y conserva el
  streaming de extremo a extremo. Reutiliza ref firmada, clasificacion de
  errores y timeout/cancelacion existentes.
- Alternativas descartadas: `.m4a` directo (requeriria audio-only en TikTok, no
  verificado, y no cumple "MP3"); ffmpeg.wasm en cliente (~30 MB WASM,
  bateria/CPU en movil 360 px, peor UX).

### D2: Reutilizar `GET /api/download` con `?audio=mp3` (frente a endpoint nuevo)

- Que: `GET /api/download?ref=...&audio=mp3` activa el modo audio; sin el parametro, comportamiento video identico. `audio` solo acepta `mp3`; otro valor se ignora o rechaza con `ENLACE_INVALIDO`.
- Por que: hereda verificacion de firma, `earlyFailure`, timeout 300 s, cancelacion por abort y `Cache-Control: no-store` sin duplicar la ruta. La ref sigue sin exponer la URL del CDN.
- Detalles: `ALLOWED_EXTENSIONS + mp3`; `buildFileName(t, "mp3")`; `Content-Type: audio/mpeg`; `Content-Disposition` con `*.mp3`. Ref de X con `audio=mp3` responde 400 con mensaje "solo TikTok".

### D3: Provision de ffmpeg via `ffmpeg-static` + `FFMPEG_PATH` (frente a script `bin/` propio)

- Que: dependencia `ffmpeg-static`, resolucion en runtime (`process.env.FFMPEG_PATH ?? require("ffmpeg-static")`), binario pasado EXPLICITAMENTE a la tuberia (sin depender del PATH del hijo); `outputFileTracingIncludes` de `/api/download` incluye el binario.
- Por que: evita mantener matriz OS/arch propia (ya existe para yt-dlp en `scripts/fetch-ytdlp.mjs:32`) y funciona en `prebuild` de Vercel sin pasos manuales.
- Alternativa: extender `fetch-ytdlp.mjs` con builds estaticos de ffmpeg en `bin/`; valida si `ffmpeg-static` excede el limite de funcion (~250 MB). Decidir en implementacion midiendo `du`.

### D4: UI como segunda accion con estado propio

- Que: en `components/Downloader.tsx`, boton "Descargar audio (MP3)" solo si `info.platform === "tiktok"` y hay formatos; usa `selectedRef` actual + `&audio=mp3`; estado `descargando-audio` separado del de video; nota de aviso de derechos junto al boton.
- Por que: no cambia el selector de calidad ni la seleccion por defecto; el MP3 deriva del video elegido (trazabilidad a la variante limpia).
- Alternativa descartada: selector separado de bitrates MP3 (sobrediseno para TikTok cortos; `--audio-quality 0` basta).

### D5: `POST /api/info` sin cambios

- Que: la lista sigue siendo MP4 combinados limpios; el cliente no recibe URLs de audio.
- Por que: minimiza superficie de cambio y mantiene la garantia sin-marca de extremo a extremo (mismo `formatId` en video y audio).

## Risks / Trade-offs

- [Tamano de funcion en Vercel] ffmpeg (~20-80 MB segun plataforma) + yt-dlp puede acercarse al limite del plan gratuito → Mitigacion: medir bundle en build (nft.json del trace); si excede, cambiar a descarga `bin/` solo-Linux o rechazar con mensaje documentado.
- [CPU/timeout en transcodificacion] TikToks largos consumen mas que el proxy actual → Mitigacion: reutilizar timeout 300 s y streaming; error `TIEMPO_AGOTADO` ya contemplado en la spec.
- [ffmpeg ausente] la ruta lo detecta ANTES de lanzar nada (`assertFfmpegAvailable`) y responde `BINARIO_AUSENTE`; como defensa extra se mantiene el mapeo de "ffprobe and ffmpeg not found" en `classifyYtDlpError`.
- [Deriva a variante marcada] si el `formatId` limpio caduca, `-x` podria resolver otro → Mitigacion: `-f <id>` exacto sin fallback; ante "Requested format is not available" devolver `FORMATO_NO_DISPONIBLE`, nunca reintentar.
- [Derechos de musica] el MP3 facilita extraer audio con copyright → Mitigacion: aviso junto al boton + README (spec `ejecucion-local-y-despliegue`).

## Migration Plan

- Despliegue: `npm install` (trae `ffmpeg-static`), `npm run build` verifica inclusion del binario, despliegue normal en Vercel; opcional `FFMPEG_PATH` en env.
- Rollback: ocultar el boton de audio (feature-flag por plataforma) deja la via de video intacta; revert de `app/api/download` al parsing sin `audio`.
- Validacion: `npm test`, `npm run lint`, prueba manual de 2-3 TikToks (audio suena, nombre `*.mp3`, video sigue igual), `du` del bundle de `/api/download`.
