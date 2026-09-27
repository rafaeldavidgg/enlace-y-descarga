/** Tipos compartidos entre la API y la interfaz. */

export interface MediaFormat {
  /** Referencia opaca firmada; el cliente la envía tal cual para descargar. */
  ref: string;
  /** Etiqueta legible, p. ej. "720p (mp4)". */
  label: string;
  ext: string;
  height: number | null;
  approxBytes: number | null;
}

export interface MediaInfo {
  platform: "tiktok" | "twitter";
  id: string;
  title: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  formats: MediaFormat[];
}

export interface ApiError {
  code: string;
  message: string;
}
