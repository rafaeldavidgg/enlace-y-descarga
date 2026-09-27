# Proposal

## Why

Descargar un video de TikTok o X (Twitter) hoy obliga a usar sitios llenos de anuncios o
herramientas de escritorio. Quiero una web propia, publicada en mi GitHub y desplegada
gratis en Vercel, donde yo (o cualquiera) pegue un enlace y obtenga el video con un botón
de descarga real, usable desde cualquier dispositivo. También debe poder clonarse y
ejecutarse localmente sin depender de servicios externos.

## What Changes

- Nueva aplicación web en Next.js (App Router) con una UI en español para pegar un enlace.
- Resolución de metadatos (título, miniatura, duración) de TikTok y X (Twitter) mediante
  yt-dlp, sin base de datos ni autenticación.
- Selector simple de calidad, limitado a formatos que ya incluyen audio y video juntos
  (sin fusionar streams, sin ffmpeg).
- Descarga mediante una función que reenvía el archivo en streaming con
  `Content-Disposition: attachment`, para que el navegador descargue de verdad en lugar de
  reproducir.
- Manejo de errores visible para enlaces no soportados, contenido privado o fallos de
  extracción, con mensajes en español.
- Distribución del binario de yt-dlp resuelto en tiempo de build por sistema operativo, de
  modo que el mismo código corra en Vercel (Linux) y en la máquina local (Windows/macOS/Linux).
- Despliegue en Vercel listo para usar (configuración de duración de función) y soporte de
  ejecución local documentado en el README.
- Disclaimer legal en README y en la interfaz sobre el uso responsable y los términos de
  servicio de las plataformas.
- **BREAKING** (en el sentido de límites asumidos): Instagram y YouTube quedan fuera del
  alcance. Se verificó que YouTube ya no ofrece ningún formato con audio y video en un solo
  archivo (todo es DASH separado) y que Instagram exige cookies de sesión, lo que rompería
  el objetivo de una app gratuita y sin estado. La extracción de solo audio (MP3) tampoco
  está contemplada.

## Capabilities

### New Capabilities

- `resolucion-de-enlaces`: aceptar un enlace de una plataforma soportada, validarlo y
  devolver sus metadatos y los formatos descargables disponibles.
- `descarga-de-medios`: entregar el archivo de video elegido como una descarga real
  (streaming con nombre de archivo), no como reproducción en el navegador.
- `interfaz-web`: la página en español donde el usuario pega el enlace, ve el preview,
  elige calidad, descarga y recibe mensajes de error claros.
- `ejecucion-local-y-despliegue`: el proyecto corre igual en local y en Vercel, con el
  binario de yt-dlp resuelto por plataforma y el despliegue en Vercel documentado.

### Modified Capabilities

<!-- Ninguna: el proyecto no tiene specs existentes. -->

## Impact

- **Stack**: Next.js (App Router, TypeScript), Tailwind CSS, una dependencia para ejecutar
  yt-dlp; sin base de datos, sin autenticación.
- **Rutas nuevas**: `POST /api/info`, `GET /api/download`.
- **Dependencia externa clave**: binario de yt-dlp descargado por plataforma en build.
- **Infraestructura**: despliegue en Vercel (plan Hobby) con streaming de funciones; cuota
  de transferencia y duración de 300s como límites conocidos.
- **No-objetivos**: Instagram y YouTube, extracción de solo audio (MP3), fusionado de
  video+audio en alta calidad, playlists, descargas por lotes, historial, cuentas de
  usuario, almacenamiento persistente.
- **Riesgos asumidos**: X (Twitter) solo funciona para tweets que contienen video, y
  dependencia de los términos de servicio de cada plataforma.
