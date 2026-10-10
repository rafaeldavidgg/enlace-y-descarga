# Proposal

## Why

Los usuarios esperan que los videos de TikTok se descarguen limpios, sin la marca de agua móvil que se desplaza durante el video ni la tarjeta final. Hoy el proyecto no garantiza eso en ningún punto: ofrece el primer formato combinado disponible sin distinguir si lleva marca de agua.

## What Changes

- Priorizar y filtrar formatos de TikTok sin marca de agua en la resolución de enlaces (`POST /api/info`), excluyendo variantes con marca de agua cuando exista alternativa limpia con audio y video juntos.
- Garantizar que la descarga (`GET /api/download`) entrega el formato sin marca de agua elegido, sin reintroducir la variante con marca en ningún paso (referencia opaca, re-resolución, streaming).
- Comunicar en la interfaz que las descargas de TikTok son sin marca de agua y qué ocurre si solo hay variante con marca (mensaje claro, sin descarga engañosa).
- Actualizar documentación (README, aviso en UI) y pruebas para cubrir el comportamiento sin marca de agua.

## Capabilities

### New Capabilities

- Ninguna. El comportamiento se expresa como cambios de requisitos en capacidades existentes.

### Modified Capabilities

- `resolucion-de-enlaces`: la lista de formatos de TikTok SHALL priorizar/excluir variantes con marca de agua y solo ofrecer formatos con audio+video juntos sin marca cuando existan.
- `descarga-de-medios`: la entrega del archivo SHALL corresponder al formato sin marca de agua resuelto, manteniendo la garantía de extremo a extremo.
- `interfaz-web`: la UI SHALL comunicar que la descarga de TikTok es sin marca de agua y SHALL informar cuando no haya alternativa limpia disponible.

## Impact

- Afectado: `lib/extractor.ts` (selección y orden de formatos TikTok), `lib/download-process.ts` y `app/api/download/route.ts` (formato efectivo descargado), `app/api/info/route.ts` (metadatos/formatos), `components/Downloader.tsx` y `app/page.tsx` (mensajes), `tests/extractor.test.ts` y `tests/download*.test.ts` (cobertura), `README.md` (alcance TikTok).
- Dependencias: comportamiento del extractor TikTok de `yt-dlp` (nombres/notas de formato que distinguen con/sin marca); sin cambios de infra ni de binario.
- Riesgo: si TikTok/yt-dlp dejan de exponer variante limpia combinada, la resolución debe fallar de forma clara en lugar de entregar video con marca.
