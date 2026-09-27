import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El binario de yt-dlp vive en `bin/` y se descarga en el build (prebuild). Se
  // incluye explícitamente en el paquete de las funciones que lo ejecutan, porque
  // se invoca por ruta resuelta en runtime y el trazador no puede detectarlo.
  //
  // Se prefiere el nombre de la carpeta por patrón para no arrastrar todo el repo.
  outputFileTracingIncludes: {
    "/api/info": ["./bin/**/*"],
    "/api/download": ["./bin/**/*"],
  },
};

export default nextConfig;
