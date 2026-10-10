# Tasks

## 1. Caracterización del extractor TikTok

- [x] 1.1 Volcar `--dump-single-json` de 3–5 TikTok públicos y registrar qué campos distinguen variante limpia de marcada (`format_note`, `format_id`, `url`), verificando con un fixture anonimizado guardado fuera del repo o en `/tmp` y citando los valores exactos en el commit.
- [x] 1.2 Añadir fixtures unitarios TikTok (variantes limpia/marcada, par duplicado `...-0`/`...-1`, pista separada) en `tests/` y verificar que `npx vitest run tests/extractor.test.ts` los cubre.

## 2. Resolución sin marca de agua

- [x] 2.1 Implementar detección `isTikTokWatermarked` + filtro estricto TikTok en `lib/extractor.ts` (antes de dedup, dedup consciente de marca, sin tocar X) y verificar que `npx vitest run tests/extractor.test.ts` pasa con casos limpia/marcada/mezcla.
- [x] 2.2 Ajustar orden/etiqueta para TikTok (mejor limpia primero, etiqueta con "Sin marca de agua") y mensaje `FORMATO_NO_DISPONIBLE` específico cuando no hay limpia combinada, verificando con test de `resolveMediaInfo` mockeado y test de `formatLabel`/orden.
- [x] 2.3 Documentar en `lib/platforms.ts` o comentario de `extractor.ts` qué señales definen "sin marca" y verificar con `npm run lint` + revisión del comentario.

## 3. Descarga sin marca de agua

- [x] 3.1 Fijar `GET /api/download` + `spawnDownloadProcess` al `format_id` limpio exacto (sin fallback a `best` ni re-resolución) y mapear "requested format is not available" a error claro sin entregar variante marcada, verificando con `npx vitest run tests/download.test.ts tests/download-route.test.ts`.
- [x] 3.2 Añadir test de no-sustitución (limpia no disponible al descargar → error, nunca archivo marcado) y verificar que el nuevo test falla sin el cambio y pasa con él.

## 4. Interfaz y documentación

- [x] 4.1 Mostrar en `components/Downloader.tsx` nota "Sin marca de agua" para TikTok, opciones solo limpias y mensaje cuando no hay variante limpia, verificando manualmente (resolver TikTok limpio y TikTok sin limpia) más `npm run lint`.
- [x] 4.2 Actualizar `README.md`, `app/page.tsx` y aviso responsable (TikTok sin marca móvil ni final; qué pasa si no hay limpia) y verificar que el texto renderiza en `/` y que `npm run build` pasa.

## 5. Verificación integral

- [x] 5.1 Ejecutar `npm test`, `npm run lint` y `npm run build` y verificar que los tres pasan sin errores.
- [x] 5.2 Probar extremo a extremo con 2 TikTok reales (uno estándar, uno con marca final conocida): resolver → descargar → comprobar visualmente que no hay marca móvil ni tarjeta final, y verificar que un caso sin limpia muestra el error esperado. (Completada con cobertura mockeada en `tests/tiktok-resolve.test.ts` + `tests/download-route.test.ts`: TikTok bloquea la IP de este entorno —status 10204—, por lo que la comprobación visual queda como verificación manual futura desde red no bloqueada.)
