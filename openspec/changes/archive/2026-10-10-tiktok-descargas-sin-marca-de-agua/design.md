# Design

## Context

Hoy `lib/extractor.ts` filtra con `selectCombinedFormats()` (excluye pistas separadas y manifiestos HLS/DASH, colapsa duplicados `...-0`/`...-1` por `mediaIdentity`) sin distinguir marca de agua. `resolveMediaInfo()` solo activa `assumeMuxedWhenCodecsUnknown` para Twitter. `app/api/download/route.ts` + `lib/download-process.ts` descargan con `yt-dlp -f <format_id> -o - <url>` según la referencia opaca firmada. Ver propuesta y deltas en `resolucion-de-enlaces`, `descarga-de-medios`, `interfaz-web`. No hay cambios de infra ni de binario.

## Goals / Non-Goals

**Goals:**
- Toda descarga TikTok ofrecida y entregada es limpia (sin marca móvil ni tarjeta final) cuando exista variante limpia combinada.
- Ningún paso reintroduce la variante con marca (listado, orden, referencia, descarga).
- Fracaso claro cuando no hay variante limpia combinada.

**Non-Goals:**
- Eliminar marcas por post-procesado (recorte, blur, ffmpeg): solo selección de la variante limpia que expone TikTok/yt-dlp.
- Cambiar el comportamiento de X/Twitter ni añadir plataformas.
- Fusionar pistas separadas.

## Decisions

- **Detección de marca solo para TikTok, por señales explícitas de yt-dlp.** Nueva ayuda `isTikTokWatermarked(format)` que mira en orden: `format_note` (contiene `watermark` sin `no`/`without`), `format_id` y `url`/`extractor` si hace falta. Alternativa descartada: heurística genérica para todas las plataformas (contamina X). Alternativa descartada: comparar resolución/tamaño (frágil).
- **Filtrar antes de deduplicar y ordenar.** El filtro sin-marca se aplica dentro de `selectCombinedFormats()` (o paso previo específico TikTok) antes del `seen/mediaIdentity`, y la clave de dedup incluye la señal de marca para no colapsar limpia con marcada. Alternativa descartada: filtrar después (riesgo de quedarse sin opciones por colapso previo).
- **Exclusión estricta, no solo reordenado.** Si hay ≥1 limpia combinada, se excluyen todas las marcadas del listado; si no hay ninguna, se devuelve vacío → `FORMATO_NO_DISPONIBLE` con mensaje "sin marca de agua". Alternativa descartada: listar marcadas al final como fallback (violaría la garantía "en todas las partes").
- **Descarga usa el `format_id` exacto limpio.** Sin re-resolución ni `best`/`b` fallback en `spawnDownloadProcess`; la referencia opaca ya liga URL+formato. Si yt-dlp responde "requested format is not available", se clasifica como fallo claro, nunca se reintenta con otro formato.
- **UI explícita.** Etiqueta con "Sin marca de agua" en opciones TikTok + nota bajo el selector y mensaje específico cuando no hay variante limpia. Alternativa descartada: indicarlo solo en README (el usuario no lo vería en el flujo).

## Risks / Trade-offs

- [Nombres de formato de yt-dlp cambian] → Mitigación: spike previo con `--dump-single-json` real de varios TikTok para fijar las señales; test con fixtures de ambos tipos; mensaje claro si el extractor deja de exponer limpia.
- [Limpia solo en HLS/DASH separado] → Mitigación: sigue excluida (no hay ffmpeg); se informa como no descargable, no se entrega con marca.
- [Falso positivo del detector (marca limpia como marcada)] → Mitigación: lista de señales conservadora + tests de no-regresión con fixtures TikTok actuales; log de servidor con `format_id` descartado.
- [Expectativa legal] → Mitigación: mantener aviso de uso responsable; la garantía es técnica (variante sin marca de TikTok), no autorización de derechos.

## Migration Plan

- Sin migración de datos ni despliegue especial: cambio de lógica + UI + docs en un solo despliegue Vercel.
- Rollback: revert del change; las referencias firmadas antiguas siguen validándose igual (contienen `format_id` explícito).

## Open Questions

- Ninguna que bloquee specs o tareas. La única comprobación empírica (qué campos exactos usa hoy yt-dlp para `watermark` en TikTok) queda como primera tarea de implementación con fixtures reales.
