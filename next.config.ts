import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El binario de yt-dlp vive en `bin/` y se descarga en el build (prebuild). Se
  // incluye explícitamente en el paquete de las funciones que lo ejecutan, porque
  // se invoca por ruta resuelta en runtime y el trazador no puede detectarlo.
  //
  // El binario de ffmpeg llega con la dependencia `ffmpeg-static` y se resuelve
  // en runtime (`lib/ffmpeg.ts`); solo lo necesita `/api/download` (modo audio).
  // Se incluye por patrón para no arrastrar todo el repo.
  outputFileTracingIncludes: {
    "/api/info": ["./bin/**/*"],
    "/api/download": ["./bin/**/*", "./node_modules/ffmpeg-static/ffmpeg*"],
  },
};

export default nextConfig;
