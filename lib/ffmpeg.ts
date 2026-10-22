import { access, constants } from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import { ExtractionError } from "./ytdlp";

/**
 * Ruta al binario de ffmpeg para la conversion a MP3.
 *
 * Orden: `FFMPEG_PATH` (archivo o directorio) y, si esta instalado, el
 * paquete `ffmpeg-static`. Devuelve null cuando no hay ninguno disponible;
 * la ruta de descarga informa entonces un error claro en lugar de fallar de
 * forma opaca. Sin rutas absolutas codificadas.
 */
export function resolveFfmpegBinary(): string | null {
  const override = process.env.FFMPEG_PATH?.trim();
  if (override) {
    return override;
  }
  try {
    // `ffmpeg-static` es una dependencia opcional: resuelta en runtime para
    // no romper entornos donde aun no esta instalada. `typeof require` es
    // seguro tanto en CJS como en ESM (donde no existe).
    const req = typeof require === "function" ? (require as (id: string) => unknown) : undefined;
    const ffmpegStatic = req?.("ffmpeg-static") as string | null | undefined;
    if (typeof ffmpegStatic === "string" && ffmpegStatic.trim() !== "") {
      return ffmpegStatic;
    }
  } catch {
    // No instalado: se informa como ausente al pedir audio.
  }
  return null;
}

/** Directorio con el binario de ffmpeg (acepta archivo o directorio). */
export function resolveFfmpegDir(): string | null {
  const binary = resolveFfmpegBinary();
  if (!binary) return null;
  try {
    // turbopackIgnore: la ruta se resuelve en runtime (env o dependencia); no
    // debe arrastrar todo el proyecto al paquete de la funcion.
    if (statSync(/* turbopackIgnore: true */ binary).isDirectory()) return binary;
    return path.dirname(binary);
  } catch {
    // La ruta no existe (aun): si parece un archivo con nombre de binario
    // conocido se usa su directorio; si no, se devuelve tal cual para que el
    // error posterior sea el de componente ausente, no una ruta inventada.
    const base = path.basename(binary).toLowerCase();
    if (base === "ffmpeg" || base === "ffmpeg.exe") return path.dirname(binary);
    return binary;
  }
}

/**
 * Comprueba que el binario de conversion esta disponible y devuelve su ruta.
 * Lanza `BINARIO_AUSENTE` cuando no hay ninguno configurado o la ruta
 * explicita no existe (las rutas simples por PATH se dejan al spawn).
 */
export async function assertFfmpegAvailable(): Promise<string> {
  const binary = resolveFfmpegBinary();
  if (!binary) {
    throw new ExtractionError("BINARIO_AUSENTE");
  }
  if (binary.includes(path.sep) || binary.includes("/")) {
    try {
      await access(binary, constants.F_OK);
    } catch (cause) {
      throw new ExtractionError("BINARIO_AUSENTE", cause);
    }
  }
  return binary;
}
