# DESIGN.md — Enlace y Descarga

Registro visual del producto. Lo lee el agente antes de tocar UI y se actualiza cuando el diseño cambia a propósito.

## Producto

- **Audiencia:** personas que usan el móvil (360–480 px) para descargar un video puntual de TikTok o X. Sin cuentas, con prisa, con una sola mano.
- **Tarea principal (Operate):** pegar enlace → revisar preview → elegir calidad → descargar. Todo lo que no ayude a esa tarea es secundario.
- **Restricción:** no inventar disponibilidad ni plataformas. Textos en español, aviso legal siempre visible, mismos endpoints y formatos sin marca de agua.

## Hallazgos critique / audit (2026-10-10, base 360 px)

1. Jerarquía plana: `h1 text-3xl` compite con un párrafo largo (5 líneas, 2 negritas). La acción principal queda debajo sin agrupación visual.
2. Formulario sin contenedor: `flex-col gap-3 sm:flex-row` ya apila en móvil, pero input y botón flotan sin tarjeta; el foco solo cambia el borde, sin anillo visible.
3. Preview frágil en móvil: miniatura `h-32 w-full object-cover` recorta videos verticales de TikTok y provoca salto de layout; metadatos y selector quedan sueltos.
4. Táctil justo: input y CTA `py-3` (~48 px, bien), pero `select py-2` (~36 px) y botones de descarga `py-2.5` (~40 px) están bajo el mínimo de 44 px.
5. Fuente rota: Geist cargada como variable en `layout.tsx` pero `body` fija `Arial`; se pierde el diseño tipográfico.
6. Ancho excesivo: `max-w-2xl` (672 px) alarga la línea en móvil; `max-w-xl` da mejor ritmo de lectura.
7. Aviso legal con el mismo énfasis que la tarea: tres párrafos a `text-sm` compiten con el formulario.
8. Oscuro por parches `dark:` sueltos, sin tokens compartidos de superficie, borde, acción y foco.

Dirección Impeccable: refinamiento (`typeset` + `layout` + `colorize` → `distill`/`clarify` → `polish`/`audit`), no rediseño. Mantener identidad sobria neutra.

## Tokens (fuente: `app/globals.css` `@theme`)

- `background` / `foreground`: fondo y texto base (`#ffffff` / `#171717`; oscuro `#0a0a0a` / `#ededed`).
- `surface` / `sunken`: tarjetas (`#ffffff` / `#f6f6f5`; oscuro `#131313` / `#1a1a1a`).
- `border`: bordes sutiles (negro 10%; blanco 14% en oscuro).
- `action` / `action-hover` / `action-contrast`: CTA primario (claro `#171717` → hover `#3f3f46` con texto `#fff`; oscuro `#ededed` → hover `#d4d4d4` con texto `#0a0a0a`).
- `ring`: anillo de foco visible (negro 35%; blanco 50% en oscuro).
- `radius-control: 12px`, `radius-card: 16px`; `shadow-card` contenida (1 px + difuminado −12 px, sin sombras dispersas anchas).
- `font-sans: var(--font-geist-sans)`; cuerpo base 16 px, inputs `text-base` (evita auto-zoom iOS).

Reglas:

- Base = móvil 360 px, columna única, ancho completo. `sm:` solo ensancha o pone en fila.
- Controles interactivos `min-h-[44px]`. Foco siempre visible con `ring`.
- Una sola tarjeta por bloque (acción, resultado). Nada de tarjetas anidadas, beige genérico, serif itálica display, side-tabs ni etiquetas numeradas.
- Miniaturas remotas en contenedor `aspect-video` estable con `object-cover`; si no hay miniatura, no se reserva hueco.
- Claro/oscuro por sistema (`prefers-color-scheme`), pares de tokens definidos juntos, contraste AA.

## Componentes

- **Tarjeta de acción:** `surface` + `border` + `radius-card` + `shadow-card`; dentro input + CTA primario a ancho completo en móvil.
- **CTA primario:** `bg-action text-action-contrast hover:bg-action-hover`, `min-h-[44px]`, `radius-control`, peso medio.
- **CTA secundario:** borde `border`, sin relleno, mismo alto mínimo.
- **Preview:** tarjeta `surface`; miniatura arriba `aspect-video`; debajo título `text-lg semibold`, metadatos `text-sm`, selector `min-h-[44px]`, nota TikTok `text-xs`.
- **Aviso legal:** superficie `sunken`, `text-sm leading-relaxed`, énfasis menor que la tarea.

## Mapeo de estados (semántica preservada)

- `resolviendo`: CTA muestra "Resolviendo…" deshabilitado; se mantiene el formulario visible.
- `error`: `p role="alert"` rojo (`red-50/800`; oscuro `red-950/red-200`), a ancho completo.
- `listo` sin formatos: aviso ámbar a ancho completo; TikTok explica que no hay variante limpia (no se ofrece la marcada).
- `listo` con formatos: preview + selector + acciones Descargar / Empezar de nuevo.
- `descargando`: CTA muestra "Descargando…" deshabilitado; retorno a `listo` tras iniciar la navegación a `/api/download?ref=…`.
- Todos los textos y el aviso de uso responsable se conservan en español; no cambia `POST /api/info` ni `GET /api/download`.

## Verificación polish (2026-10-10)

Revisión anti-slop sobre `app/page.tsx`, `components/Downloader.tsx`, `app/globals.css`: sin serif itálica display, sin beige/púrpura degradado, sin side-tabs, sin eyebrow-chip, sin etiquetas numeradas, sin puntos pulsantes ni animación gratuita (solo transición de color en CTA). Sombras contenidas (`shadow-card`), radios 12/16 y una sola tarjeta por bloque. El pozo de miniatura (`bg-sunken` con borde dentro de la tarjeta de resultado) es contenedor multimedia funcional, no tarjeta anidada. `grep` de patrones (italic/serif/gradient/uppercase/anímate/shadow-2xl) solo devuelve el fallback `sans-serif` de la pila de fuentes. Cero hallazgos pendientes.
