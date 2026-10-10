# Design

## Context

Ver `proposal.md` (Why) para la motivación. Estado actual relevante:

- Página única en `app/page.tsx` (`max-w-2xl`, cabecera + `<Downloader />` + aviso legal) y `components/Downloader.tsx` (formulario `flex-col gap-3 sm:flex-row`, preview `flex-col sm:flex-row`, botones neutros `bg-neutral-900` / `dark:bg-white`).
- Estilos en `app/globals.css` con Tailwind v4 (`@import "tailwindcss"`, `@theme inline` mínimo para background/foreground) y fuentes Geist cargadas en `app/layout.tsx`, aunque `body` aún fija `font-family: Arial, Helvetica, sans-serif`.
- Modo oscuro por `prefers-color-scheme` con parches `dark:` por componente; sin tokens compartidos de radio/sombra/foco ni `DESIGN.md`/`PRODUCT.md`.
- Sin cambios funcionales previstos: `POST /api/info` y `GET /api/download`, validación y formatos sin marca de agua quedan intactos (ver `specs/interfaz-web/spec.md` para el contrato observable).

Restricciones: Next 16 + Tailwind v4 (revisar `node_modules/next/dist/docs/` antes de tocar `layout.tsx`/viewport según `AGENTS.md`), español, sin cuentas ni anuncios, despliegue Vercel Hobby.

## Goals / Non-Goals

**Goals:**

- Restyling mobile-first (base 360–480 px, mejora en `sm:`) que eleve jerarquía, legibilidad y acabado siguiendo el flujo Impeccable de mejora (`critique` → `typeset`/`layout`/`colorize` → `distill`/`clarify` → `polish`/`audit`).
- Unificar el sistema visual en tokens Tailwind v4 y registrarlo en `DESIGN.md` (paleta, tipo, radios, sombras, focos, variantes claro/oscuro) para que futuros cambios lo reutilicen.
- Dejar formulario, preview y estados cumpliendo `specs/interfaz-web/spec.md` (sin scroll horizontal, táctil ≥44 px, coherencia claro/oscuro, preview apilado).

**Non-Goals:**

- Cambiar API, validación de plataformas, lógica de formatos o textos legales/de límites (solo se reordenan/estilizan).
- Crear una nueva identidad de marca rupturista, añadir dependencias pesadas de UI, modo oscuro conmutable por clase, i18n adicional o nuevas rutas.
- Optimizar transferencia/duración de Vercel o el binario `yt-dlp`; eso pertenece a otras capacidades.

## Decisions

### D1 — Refinamiento guiado por Impeccable, no rediseño desde mockup

**Decisión:** partir de `critique` sobre la página real y aplicar comandos enfocados (`typeset`, `layout`, `colorize`, `distill`, `clarify`, `polish`, `audit`) manteniendo la identidad sobria actual.

**Rationale:** la página ya convierte bien (una tarea, un formulario); el problema es acabado y jerarquía, no concepto. El flujo de mejora preserva textos y funcionalidad.

**Alternativas consideradas:** mockup-first con generación de imagen y luego traducción a código (descartado: pierde detalle, exige varias rondas y es excesivo para una utilidad de una sola tarea); rediseño libre con nueva paleta (descartado: sin marca que lo pida, aumenta riesgo de rechazo).

### D2 — Mobile-first en Tailwind (base = móvil, `sm:` = mejora)

**Decisión:** escribir las clases base para 360 px (columna única, ancho completo, espaciado compacto) y usar `sm:` solo para ensanchar, poner formulario/preview en fila y limitar `max-w`.

**Rationale:** el uso normal es móvil; base-móvil evita parches y garantiza el caso peor primero. Coincide con el `flex-col ... sm:flex-row` ya existente, que se generaliza.

**Alternativas:** desktop-first con `max-md:` (descartado: invierte la prioridad y duplica overrides); CSS custom con media queries manuales (descartado: rompe la convención Tailwind del repo).

### D3 — Tokens en `globals.css` (`@theme`) + `DESIGN.md`, cero estilos ad-hoc

**Decisión:** centralizar color de acción, superficies, bordes, radios (p. ej. 12/16 px), sombras contenidas, anillo de foco y escala tipo/espaciado en `@theme`; documentar uso en `DESIGN.md` y consumir solo esos tokens en `page.tsx`/`Downloader.tsx`.

**Rationale:** elimina la deriva (cada `dark:` hoy es un parche) y permite al detector Impeccable verificar coherencia. `document`/`extract` de Impeccable sugieren exactamente este registro.

**Alternativas:** librería de componentes externa (descartada: sobreingeniería para 2 archivos de UI); CSS modules por componente (descartado: fragmenta el sistema).

### D4 — Composición: cabecera compacta + tarjeta de acción + resultado + aviso

**Decisión:** mantener una columna `max-w-xl` centrada con ritmo `gap-6/8`: (1) cabecera compacta con título y descripción recortada a lo esencial, (2) formulario como tarjeta elevada con input + CTA primario a ancho completo en móvil, (3) preview como tarjeta con miniatura 16:9 arriba y metadatos/selector/acciones debajo, (4) aviso legal como sección secundaria de menor énfasis (sin tarjetas anidadas).

**Rationale:** `distill` (quitar lo accesorio) + `layout` (agrupar decisión con acción: fecha/detalle junto al botón, patrón Live Mode) aplicados a esta página: el usuario decide con título/duración/plataforma junto al selector y descarga.

**Alternativas:** hero grande persuasivo (descartado: esta página es `Operate` —completar una tarea—, no `Persuade`); aviso colapsable con `<details>` (posible si el aviso alarga el scroll, pero no por defecto para no ocultar lo legal).

### D5 — Tipografía: corregir Geist, escala contenida

**Decisión:** conservar Geist/Geist_Mono (ya cargadas), corregir `body` para usar `var(--font-geist-sans)` en lugar de Arial, y aplicar escala `typeset` (título destacado, cuerpo 16 px mínimo en inputs para evitar zoom iOS, metadatos 14 px, notas 12 px con contraste suficiente).

**Rationale:** evita una nueva dependencia de fuentes y corrige el bug actual (variables cargadas pero no usadas). 16 px en inputs evita el auto-zoom de iOS, crítico en móvil.

**Alternativas:** nueva fuente display serif itálica (descartada: es uno de los anti-patrones Impeccable y rompe la sobriedad); variable custom sin `@theme` (descartada: no reutilizable).

### D6 — Claro/oscuro por sistema, verificado por tokens

**Decisión:** mantener `prefers-color-scheme` (sin toggle), definiendo cada token en ambas variantes y verificando contraste AA en texto principal/secundario y en estados (error ámbar/rojo, foco).

**Rationale:** sin demanda de toggle; el modo sistema es lo esperado en una utilidad móvil y reduce estado.

**Alternativas:** toggle con clase `dark` (descartado: añade estado persistido sin beneficio pedido).

### D7 — Accesibilidad táctil y de teclado como parte del acabado

**Decisión:** altura mínima 44 px en input/botones/select, `inputMode="url"` + `enterKeyHint="go"` + `autoCapitalize="off"`, foco visible con anillo del token, preservar `label`/`role="alert"`/semántica existente.

**Rationale:** `audit`/`harden` de Impeccable exigen responsive + accesibilidad + casos difíciles; el coste es solo clases y atributos.

**Alternativas:** gestos o bottom-sheet custom (descartados: complejidad innecesaria).

### D8 — Verificación: Live Mode + detector + revisión manual

**Decisión:** iterar con `/impeccable live` contra `npm run dev` en 360 px, pasar el detector de slop sobre los archivos tocados y cerrar con `audit` (accesibilidad, responsive, theming, anti-patrones) más `npm run lint`, `npm test` y `npm run build`.

**Rationale:** el detector solo caza patrones conocidos; la revisión manual en móvil real/emulado (claro/oscuro, teclado, miniatura ausente/larga, títulos largos) es la que valida `specs/interfaz-web/spec.md`.

**Alternativas:** solo CI automatizada (descartada: no sustituye probar la tarea real en pantalla estrecha).

## Risks / Trade-offs

- [Riesgo] Pulido excesivo que oculta la acción principal → Mitigación: CTA primario siempre visible tras el input en móvil; `distill` recorta texto, nunca el formulario.
- [Riesgo] Regresión en escritorio al optimizar móvil → Mitigación: `sm:` solo ensancha; revisión en 360 px y 1024 px antes de cerrar.
- [Riesgo] Contraste insuficiente en modo oscuro con nuevos tokens → Mitigación: definir pares claro/oscuro juntos y comprobar AA en textos y estados.
- [Riesgo] Miniaturas remotas con proporción impredecible que rompen la tarjeta → Mitigación: contenedor 16:9 con `object-cover` y altura estable; estado sin miniatura ya contemplado.
- [Riesgo] Divergencia con docs de Next 16 (viewport/fuentes) → Mitigación: leer `node_modules/next/dist/docs/` antes de tocar `layout.tsx`, según `AGENTS.md`.
- [Trade-off] Sin toggle de tema ni nueva fuente se renuncia a novedad visual → Se gana coherencia, rendimiento y cero dependencias, acorde a una utilidad personal.

## Migration Plan

Sin migración: cambio puramente de presentación en la misma ruta `/`, sin cambios de API ni de datos. Despliegue estándar (`npm run build` → Vercel). Rollback por revert del commit. Validación previa: `npm run lint`, `npm test`, `npm run build` + checklist manual (360 px, 768 px, escritorio; claro/oscuro; teclado; estados de error/sin formatos/descargando).
