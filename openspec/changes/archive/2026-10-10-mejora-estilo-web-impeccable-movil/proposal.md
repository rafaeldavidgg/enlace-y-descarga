# Proposal

## Why

La web actual resuelve bien su tarea (pegar enlace → preview → descargar), pero su estilo es genérico y poco jerarquizado, con una experiencia pensada en escritorio cuando el uso normal será desde móviles. Aplicar el vocabulario de diseño Impeccable permite elevar la calidad visual y la legibilidad sin cambiar la funcionalidad.

## What Changes

- Restyling visual de la página principal con enfoque mobile-first (360–480 px como caso base, mejora progresiva hacia `sm:`/escritorio), siguiendo el flujo Impeccable: `critique` → `typeset` + `layout` + `colorize` → `distill`/`clarify` → `polish`/`audit`.
- Jerarquía tipográfica y ritmo de lectura mejorados: título, descripción, formulario, preview del medio y aviso legal con tamaños, pesos, interlineados y longitudes de línea cómodas en pantallas estrechas.
- Sistema visual coherente con tokens Tailwind v4 (`globals.css` + `@theme`): paleta, radios, sombras, estados de foco y variantes claro/oscuro sin parches ad-hoc en cada componente.
- Controles optimizados para táctil: campo de enlace y botones con altura mínima ≥44 px, formulario apilado en móvil, selector de calidad y acciones de descarga/reintento fáciles de pulsar con el pulgar; se preserva `inputMode="url"` y accesibilidad (labels, `role="alert"`, foco visible, navegación por teclado).
- Preview del medio y estados (carga, error, sin formatos, descargando) rediseñados para móvil: miniatura adaptativa, metadatos compactos y mensajes en español claro, manteniendo los textos legales y de límites actuales.
- Sin cambios funcionales: mismos endpoints (`POST /api/info`, `GET /api/download`), misma validación de plataformas y misma lógica de formatos sin marca de agua.

## Capabilities

### New Capabilities

<!-- Ninguna: todo el comportamiento observable ampliado pertenece a una capacidad existente. -->

### Modified Capabilities

- `interfaz-web`: añade requisitos de estilo mobile-first y calidad visual guiada por Impeccable (jerarquía legible, objetivos táctiles, coherencia claro/oscuro, estados optimizados en pantallas estrechas), sin alterar los requisitos de resolución, formatos ni descarga.

## Impact

- Afecta solo a presentación: `app/page.tsx`, `components/Downloader.tsx`, `app/layout.tsx` (viewport/metadata si hace falta) y `app/globals.css` (tokens Tailwind v4, tipografía Geist).
- No cambia API, `lib/`, `scripts/fetch-ytdlp.mjs` ni contratos de `openspec/specs/{resolucion-de-enlaces,descarga-de-medios,ejecucion-local-y-despliegue}`.
- Sin nuevas dependencias previstas; si el diseño requiere alguna (p. ej. fuente o utilidad), se justificará en `design.md` y se mantendrá compatible con Next 16 + Tailwind 4.
- Riesgo bajo: cambio puramente visual; la validación es manual (revisión en móvil real/emulado 360 px, modo claro/oscuro, teclado) más `npm run lint`, `npm test` y `npm run build`.
