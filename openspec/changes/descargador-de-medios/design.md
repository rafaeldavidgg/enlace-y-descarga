# Design

## Context

Ver `proposal.md - Why` para la motivación. Este documento asume un repositorio vacío
(solo existen `openspec/` y `.opencode/`) y que OpenSpec ya está inicializado.

Las restricciones que dan forma al diseño provienen del entorno objetivo:

- **Vercel plan Hobby (gratuito)**: la duración máxima de función es 300 s, hay un límite
  de cuerpo de respuesta de 4.5 MB que **no aplica a respuestas en streaming**, y el plan
  incluye ~100 GB de transferencia al mes.
- **El atributo `download` de HTML se ignora en enlaces de otro origen**, por lo que un
  enlace directo al CDN de la plataforma hace que el navegador reproduzca el archivo en
  lugar de descargarlo.
- **yt-dlp** es la herramienta de extracción de referencia, se actualiza con frecuencia y
  se distribuye como binario por sistema operativo.
- **Alcance de plataformas verificado el 2026-09-27**:
  - **TikTok**: funciona; expone formatos mp4 con audio y video juntos.
  - **X/Twitter**: la extracción funciona, pero solo tiene video si el tweet lo incluye.
  - **YouTube**: descartado. Ya no expone ningún formato con audio y video en un solo
    archivo (todo es DASH con pistas separadas), y su extracción ahora requiere un runtime
    JavaScript (Deno) adicional.
  - **Instagram**: descartado. Exige cookies de sesión; sin login devuelve "empty media
    response". Soportarlo rompería el objetivo de app gratuita y sin estado.

## Goals / Non-Goals

**Goals:**

- Una sola base de código que corra igual en local (Windows/macOS/Linux) y en Vercel.
- Descarga real iniciada por el navegador, con nombre de archivo, sin almacenamiento.
- Extracción de video con audio en un solo archivo, sin fusionar pistas ni usar ffmpeg.
- Despliegue gratuito en Vercel y clonado local sin pasos manuales de código.

**Non-Goals:**

- Instagram y YouTube (ver restricciones de plataformas más arriba).
- Extracción de solo audio (MP3) y conversión de formatos.
- Fusionado de pistas de video y audio separadas.
- Playlists, descargas por lotes, autenticación, base de datos o historial.
- Un backend adicional (Docker u otro host) para proxies de larga duración.

## Decisions

### 1. Next.js App Router + route handlers, desplegado en Vercel

La UI y el servidor viven en el mismo proyecto y se despliegan juntos. Alternativas
consideradas: (a) API externa con UI estática, que añade un servicio y rompe la paridad
local; (b) SPA con Vite, que obliga a gestionar backend aparte para el streaming. Next.js
App Router permite una ruta de servidor en streaming con el mismo código que se ejecuta en
`next dev`, cumpliendo la paridad pedida.

### 2. Descarga por proxy en streaming, no por enlace directo al CDN

El route handler `GET /api/download` lanza yt-dlp escribiendo el archivo a `stdout` y
devuelve ese flujo directamente en la respuesta, con `Content-Disposition: attachment`.

```
   cliente --GET /api/download?...--> route handler
                                        |
                                        +-- spawn(ytdlp, ["-f", fmt, "-o", "-", url])
                                        |
                                        +-- Response(child.stdout, { attachment })
                                        |
   navegador <---- stream de bytes ------+
```

Motivo: es la única forma de que el botón descargue de verdad (el atributo `download` se
ignora entre orígenes), y el streaming esquiva el límite de 4.5 MB. Alternativa
descartada: devolver la URL directa y descargar en el cliente, que reproduce en vez de
descargar y expone la URL del CDN. El mismo enfoque se descartó almacenando el archivo en
disco porque el streaming evita el paso intermedio.

### 3. Selección limitada a formatos con audio y video juntos

`POST /api/info` filtra la lista de formatos a los que ya contienen ambas pistas, lo que
elimina la necesidad de ffmpeg y mantiene el despliegue dentro del plan gratuito. El
cliente envía una referencia opaca, no una URL, para evitar manipulación.

### 4. Binario de yt-dlp resuelto en preparación, fuera del control de versiones

Un script `scripts/fetch-ytdlp.mjs` detecta el sistema operativo, descarga el binario
correspondiente a `bin/` y lo marca como ignorado por git. En Vercel el binario se
descarga durante el build en Linux y se incluye en el paquete de la función mediante la
configuración del proyecto. Alternativas: versionar el binario (pesado y con problemas de
licencia/antimalware) o instalarlo con un gestor de paquetes del sistema (no disponible en
el entorno serverless).

### 5. Manejo de errores por clasificación, con mensajes en español

Los fallos de yt-dlp se clasifican en: enlace no soportado, contenido privado o eliminado,
contenido que requiere autenticación, límite de tiempo/plataforma y fallo genérico. Cada
clase tiene un mensaje propio en español. Esto evita exponer trazas internas y da al
usuario una acción concreta.

### 6. Sin estado, sin persistencia

No hay base de datos ni sesiones. Cada solicitud resuelve y descarga de forma independiente.
Se contempla una limitación de abuso básica para que un solo usuario no agote la cuota.

## Risks / Trade-offs

- **[X/Twitter solo sirve para tweets con video]**
  → Se clasifica y comunica el fallo ("No video could be found in this tweet") con un
  mensaje claro en español; TikTok es la plataforma principal garantizada.
- **[La cuota de transferencia de 100 GB/mes puede agotarse si el proyecto se populariza]**
  → Se documenta el límite y se recomienda no promocionar el despliegue público como
  servicio masivo; se añade limitación básica de abuso.
- **[Vercel no está pensado como servidor de medios y podría cuestionar el uso]**
  → Se acepta el riesgo para uso personal; el README documenta el propósito y el usuario
  puede migrar el proxy a un host propio sin cambiar la UI (decisión 1 y 2 lo permiten).
- **[El límite de 300 s puede truncar archivos grandes]**
  → Se detecta y se comunica el límite en lugar de entregar un archivo incompleto; se
  sugiere un formato menor.
- **[El binario descargado puede activar antivirus en local, sobre todo en Windows]**
  → Se documenta el origen del binario y se resuelve en preparación, no en tiempo de ejecución.
- **[Un cambio de formato en la API de extracción rompe el contrato del cliente]**
  → Las rutas usan referencias opacas y mensajes clasificados, de modo que un cambio
  interno no obliga a cambiar la UI.

## Migration Plan

No hay sistema previo que migrar. El despliegue consiste en: preparar el proyecto
(instalación y resolución del binario), ejecutar en local para validar, y conectar el
repositorio a Vercel para el despliegue automático. La reversión consiste en volver a un
despliegue anterior desde Vercel, ya que no hay estado persistente que conservar.
