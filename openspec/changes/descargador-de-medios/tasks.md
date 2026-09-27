# Tasks

## 1. Preparación del proyecto

- [x] 1.1 Inicializar el proyecto Next.js (App Router, TypeScript) con Tailwind CSS y verificar que `npm run dev` levanta la página por defecto en local
- [x] 1.2 Crear `scripts/fetch-ytdlp.mjs` que detecte el sistema operativo y descargue el binario a `bin/`, y añadir `bin/` a `.gitignore`; verificar ejecutando el script y comprobando que el binario aparece y que git no lo lista
- [x] 1.3 Añadir un script de preparación (`predev`/`prebuild`) que llame a `scripts/fetch-ytdlp.mjs` y verificar que una instalación limpia (`npm install` + `npm run dev`) deja el binario listo sin pasos manuales
- [x] 1.4 Crear `lib/ytdlp.ts` con la localización del binario y la ejecución con argumentos controlados; verificar que una llamada de prueba devuelve la versión del binario y que un binario ausente produce un error claro

## 2. Resolución de enlaces

- [x] 2.1 Implementar la validación de enlaces y el reconocimiento de plataformas soportadas (TikTok y X/Twitter); verificar con pruebas unitarias que un enlace válido de cada plataforma pasa y que un dominio no soportado (Instagram, YouTube) y una entrada vacía o malformada se rechazan con el mensaje correcto
- [x] 2.2 Implementar la extracción de metadatos (título, miniatura, duración, identificador) y verificar con una prueba contra un enlace de prueba que se devuelven los campos disponibles y se omiten los ausentes
- [x] 2.3 Implementar el filtrado de formatos que ya contienen audio y video y la construcción de la referencia opaca por formato; verificar con pruebas unitarias que los formatos con pistas separadas quedan excluidos y que la referencia no expone la URL de origen
- [x] 2.4 Clasificar los fallos de extracción (no soportado, privado o eliminado, requiere autenticación, genérico) y verificar que cada clase produce su mensaje en español y que no se filtran trazas internas
- [x] 2.5 Exponer `POST /api/info` que reúne la validación, la extracción y la clasificación de errores; verificar con una petición real que un enlace válido devuelve metadatos y formatos y que un enlace inválido devuelve el error correspondiente

## 3. Descarga en streaming

- [x] 3.1 Implementar `GET /api/download` que lance yt-dlp escribiendo a `stdout` y devuelva el flujo en la respuesta con `Content-Disposition: attachment`; verificar que un archivo mayor que 4.5 MB se descarga completo y no se trunca
- [x] 3.2 Añadir el nombre de archivo sugerido a partir del título, con extensión coherente con el formato, y un nombre genérico válido cuando el título falte; verificar que el archivo descargado llega con el nombre y la extensión esperados
- [x] 3.3 Rechazar referencias de formato ausentes, vencidas o manipuladas y verificar que la respuesta es un error claro sin iniciar ninguna descarga
- [x] 3.4 Detectar y comunicar el límite de 300 s y los fallos del origen durante la transmisión; verificar que una descarga interrumpida no se entrega como archivo válido y que se muestra el mensaje correspondiente
- [x] 3.5 Implementar la cancelación de la descarga cuando el cliente interrumpe y verificar que el proceso hijo de yt-dlp termina y no quedan procesos colgados

## 4. Interfaz web

- [x] 4.1 Construir el formulario para pegar el enlace con estado de carga y verificar manualmente que un enlace válido muestra el estado de carga y luego el preview, y que un fallo vuelve al estado inicial con error en español
- [x] 4.2 Construir el preview (título, miniatura, duración) y verificar manualmente que los campos ausentes se omiten sin mostrar datos falsos
- [x] 4.3 Construir el selector de calidad con el mejor formato con audio preseleccionado y verificar manualmente la preselección, el cambio manual y el caso sin formatos disponibles
- [x] 4.4 Construir la acción de descarga y el estado de "descargando" y verificar que la descarga se inicia y que un error abandona el estado correctamente
- [x] 4.5 Añadir el aviso de uso responsable y derechos de autor y los mensajes de límites en español; verificar que el aviso es visible al cargar y que un rechazo por límites explica el motivo

## 5. Despliegue y documentación

- [x] 5.1 Añadir la configuración de despliegue (duración máxima de la función de descarga y empaquetado del binario en la función) y verificar con un build de producción en local (`npm run build` + `npm start`) que la descarga funciona
- [ ] 5.2 Desplegar en Vercel (plan Hobby) y verificar desde otro dispositivo que un enlace de TikTok y, cuando el tweet tenga video, de X/Twitter se resuelve y descarga correctamente
- [x] 5.3 Escribir el README con instrucciones de ejecución local, pasos de despliegue, límites de transferencia/duración/tamaño, aviso legal y plataformas soportadas frente a no soportadas (Instagram y YouTube fuera de alcance); verificar que otra persona puede seguir las instrucciones sin pasos no documentados
- [ ] 5.4 Verificar la paridad local/Vercel con el mismo enlace de TikTok en ambos entornos y comparar el resultado funcional y los mensajes, documentando las diferencias de límites encontradas
