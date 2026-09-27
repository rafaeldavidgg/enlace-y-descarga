import { createHmac, timingSafeEqual } from "node:crypto";
import { ExtractionError, runYtDlp } from "./ytdlp";
import { type Platform, validateLink } from "./platforms";

/** Forma relevante del JSON que devuelve `yt-dlp --dump-single-json`. */
interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  acodec?: string | null;
  vcodec?: string | null;
  height?: number | null;
  width?: number | null;
  fps?: number | null;
  abr?: number | null;
  tbr?: number | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  format_note?: string | null;
}

interface YtDlpInfo {
  id?: string;
  title?: string;
  thumbnail?: string;
  thumbnails?: Array<{ url?: string; preference?: number; height?: number }>;
  duration?: number | null;
  formats?: YtDlpFormat[];
  extractor_key?: string;
}

export interface MediaFormat {
  /** Referencia opaca firmada que el cliente envia para descargar. */
  ref: string;
  /** Etiqueta legible (p. ej. "720p (mp4)"). */
  label: string;
  ext: string;
  height: number | null;
  /** Tamano estimado en bytes, si la plataforma lo expone. */
  approxBytes: number | null;
}

export interface MediaInfo {
  platform: Platform;
  id: string;
  title: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  formats: MediaFormat[];
}

/** Tamano minimo de audio para considerar que un formato tiene audio real. */
function hasAudio(codec: string | null | undefined): boolean {
  return typeof codec === "string" && codec !== "none" && codec.trim() !== "";
}

function hasVideo(codec: string | null | undefined): boolean {
  return typeof codec === "string" && codec !== "none" && codec.trim() !== "";
}

/**
 * Filtra los formatos que ya contienen audio y video en un solo archivo.
 * Los formatos con pistas separadas quedan excluidos por diseno (no hay ffmpeg).
 */
export function selectCombinedFormats(formats: YtDlpFormat[]): YtDlpFormat[] {
  return formats.filter((format) => {
    if (!format.format_id) return false;
    if (!hasAudio(format.acodec) || !hasVideo(format.vcodec)) return false;
    // Se descartan los manifiestos HLS/DASH, que no son un archivo unico.
    return true;
  });
}

/** Etiqueta legible para el usuario a partir del formato. */
export function formatLabel(format: YtDlpFormat): string {
  const height = typeof format.height === "number" ? `${format.height}p` : null;
  const ext = format.ext ?? "video";
  const fps = typeof format.fps === "number" && format.fps >= 50 ? `${Math.round(format.fps)}fps` : null;
  const parts = [height, fps].filter(Boolean).join(" ");
  return parts ? `${parts} (${ext})` : `Video (${ext})`;
}

/** Ordena de mejor a peor: mas resolucion, luego mas bitrate. */
function byQualityDesc(a: YtDlpFormat, b: YtDlpFormat): number {
  const heightDiff = (b.height ?? 0) - (a.height ?? 0);
  if (heightDiff !== 0) return heightDiff;
  return (b.tbr ?? 0) - (a.tbr ?? 0);
}

/** Elige la miniatura de mayor resolucion disponible. */
function pickThumbnail(info: YtDlpInfo): string | null {
  if (info.thumbnail) return info.thumbnail;
  const thumbs = [...(info.thumbnails ?? [])].filter((t) => t.url);
  if (thumbs.length === 0) return null;
  thumbs.sort((a, b) => (b.height ?? b.preference ?? 0) - (a.height ?? a.preference ?? 0));
  return thumbs[0].url ?? null;
}

// --- Referencias opacas firmadas -------------------------------------------

/**
 * Secreto para firmar las referencias. En produccion se define por entorno; en
 * local se usa un valor por defecto para no exigir configuracion manual.
 */
function getSigningSecret(): string {
  return process.env.APP_SIGNING_SECRET?.trim() || "enlace-y-descarga-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

interface FormatRefPayload {
  u: string;
  f: string;
  t: string | null;
  e: string;
}

/** Construye una referencia opaca que no expone la URL de origen. */
export function encodeFormatRef(
  url: string,
  formatId: string,
  title: string | null,
  ext: string,
): string {
  const payload: FormatRefPayload = { u: url, f: formatId, t: title, e: ext };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verifica y decodifica una referencia opaca. Devuelve null si es invalida. */
export function decodeFormatRef(ref: string): FormatRefPayload | null {
  if (typeof ref !== "string" || ref.length === 0 || ref.length > 4096) return null;
  const dot = ref.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = ref.slice(0, dot);
  const signature = ref.slice(dot + 1);

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as FormatRefPayload;
    if (typeof parsed?.u !== "string" || typeof parsed?.f !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Extension asociada a una referencia de formato; "mp4" si no es reconocible. */
export function resolveFormatExt(ref: string): string {
  const decoded = decodeFormatRef(ref);
  const ext = decoded?.e;
  if (typeof ext === "string" && /^[a-z0-9]{1,5}$/i.test(ext)) {
    return ext.toLowerCase();
  }
  return "mp4";
}

// --- Extraccion ------------------------------------------------------------

/** Limite de tiempo para resolver metadatos. */
const INFO_TIMEOUT_MS = 45_000;

/**
 * Resuelve los metadatos y los formatos descargables de un enlace.
 * Lanza `ExtractionError` clasificado ante cualquier fallo.
 */
export async function resolveMediaInfo(rawUrl: string): Promise<MediaInfo> {
  const validation = validateLink(rawUrl);
  if (!validation.ok) {
    if (validation.reason === "vacio" || validation.reason === "malformado") {
      throw new ExtractionError("ENLACE_INVALIDO");
    }
    throw new ExtractionError("PLATAFORMA_NO_SOPORTADA");
  }

  const { stdout } = await runYtDlp({
    args: ["--dump-single-json", "--no-playlist", "--skip-download", validation.url],
    timeoutMs: INFO_TIMEOUT_MS,
  });

  let info: YtDlpInfo;
  try {
    info = JSON.parse(stdout) as YtDlpInfo;
  } catch (cause) {
    throw new ExtractionError("FALLO_EXTRACCION", cause);
  }

  const combined = selectCombinedFormats(info.formats ?? []).sort(byQualityDesc);
  if (combined.length === 0) {
    throw new ExtractionError("FORMATO_NO_DISPONIBLE");
  }

  const title = typeof info.title === "string" && info.title.trim() !== "" ? info.title : null;
  const id = typeof info.id === "string" && info.id.trim() !== "" ? info.id : "";

  const formats: MediaFormat[] = combined.map((format) => ({
    ref: encodeFormatRef(validation.url, format.format_id as string, title, format.ext ?? "mp4"),
    label: formatLabel(format),
    ext: format.ext ?? "mp4",
    height: typeof format.height === "number" ? format.height : null,
    approxBytes: format.filesize ?? format.filesize_approx ?? null,
  }));

  return {
    platform: validation.platform,
    id,
    title,
    thumbnail: pickThumbnail(info),
    durationSeconds: typeof info.duration === "number" ? info.duration : null,
    formats,
  };
}
