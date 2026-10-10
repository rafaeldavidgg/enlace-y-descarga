# Tasks

## 1. Diagnóstico Impeccable y sistema visual base

- [x] 1.1 Pasar `critique`/`audit` a la página actual en `npm run dev` a 360 px y registrar hallazgos y dirección en `DESIGN.md` inicial, y verificar que `DESIGN.md` existe con audiencia (móvil), tarea (Operate) y reglas a respetar.
- [x] 1.2 Centralizar tokens Tailwind v4 en `app/globals.css` (`@theme`: acción, superficies, bordes, radios 12/16, sombras contenidas, anillo de foco, escala tipo/espaciado en ambos modos) y corregir `body` para usar `var(--font-geist-sans)`, y verificar que `npm run build` pasa y claro/oscuro mantienen contraste legible.
- [x] 1.3 Revisar `node_modules/next/dist/docs/` para viewport/fuentes/metadata en Next 16 y ajustar `app/layout.tsx` solo si hace falta, y verificar que no hay aviso de deprecación en `npm run build` ni regresión de fuentes.

## 2. Cabecera y formulario mobile-first

- [x] 2.1 Recomponer `app/page.tsx` en columna única `max-w-xl` con ritmo compacto (cabecera breve + formulario + resultado + aviso secundario, sin tarjetas anidadas) aplicando `typeset`/`distill`, y verificar a 360 px que no hay scroll horizontal y el orden es título → descripción → campo/acción → resultado/aviso.
- [x] 2.2 Rehacer el formulario de `components/Downloader.tsx` como tarjeta de acción (input a ancho completo + CTA primario debajo en móvil, `min-h-[44px]`, `text-base`, `inputMode="url"`, `enterKeyHint="go"`, foco visible con token) manteniendo labels y `role="alert"`, y verificar pulsación con pulgar, navegación por teclado y que el input no provoca auto-zoom en iOS.

## 3. Preview y estados en pantallas estrechas

- [x] 3.1 Adaptar el preview a móvil (miniatura 16:9 a ancho completo con `object-cover` y altura estable, metadatos compactos, selector de calidad `min-h-[44px]` y acciones Descargar/Reintentar apiladas o a ancho completo), y verificar con miniatura presente/ausente y título largo que nada desborda a 360 px.
- [x] 3.2 Estilizar estados de carga, error, sin formatos y descargando a ancho completo con los tokens (sin cambiar textos en español ni semántica) y documentar el mapeo de estados en `DESIGN.md`, y verificar cada estado en claro/oscuro conserva `role="alert"` donde corresponde y la acción principal sigue alcanzable.

## 4. Pulido y verificación integral

- [x] 4.1 Pasar `polish` + detector Impeccable (slop: beige genérico, bordes finos con sombra dispersa, tarjetas anidadas, etiquetas numeradas) sobre `app/page.tsx`, `components/Downloader.tsx` y `app/globals.css`, y verificar cero hallazgos o justificación registrada en `DESIGN.md`.
- [x] 4.2 Hacer checklist manual (360 px, 768 px y escritorio; claro/oscuro; teclado solo; títulos largos; sin miniatura) más `npm run lint`, `npm test` y `npm run build`, y verificar todo en verde y que `POST /api/info` y `GET /api/download` siguen intactos sin cambios funcionales.
