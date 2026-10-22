import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

/**
 * Arranca el proceso de descarga de yt-dlp escribiendo el archivo a stdout.
 *
 * Se aísla aquí para poder sustituirlo en pruebas sin tocar la ruta HTTP, y
 * para garantizar que siempre se invoca sin shell (evita interpolar la URL en
 * una línea de comandos).
 *
 * Se usa el `formatId` EXACTO de la referencia (sin fallback a `best`): es lo
 * que garantiza que un TikTok resuelto como limpio se descargue limpio y que,
 * si deja de existir, la ruta falle en lugar de entregar la variante marcada.
 */
export function spawnDownloadProcess(
  binary: string,
  formatId: string,
  url: string,
): ChildProcessWithoutNullStreams {
  return spawn(
    // turbopackIgnore evita que el analizador estático trace todo el proyecto en
    // el paquete de la función. El binario está en `bin/`, resuelto en runtime.
    /* turbopackIgnore: true */
    binary,
    ["-f", formatId, "--no-playlist", "-o", "-", url],
    {
      windowsHide: true,
      shell: false,
    },
  ) as ChildProcessWithoutNullStreams;
}

export interface SpawnAudioOptions {
  /** Ruta al binario de ffmpeg (resuelta por `lib/ffmpeg.ts`). */
  ffmpegBinary: string;
}

/**
 * Argumentos de ffmpeg para convertir a MP3 leyendo de stdin y escribiendo a
 * stdout. Sin video, MP3 con libmp3lame en calidad VBR alta.
 */
export function buildFfmpegMp3Args(): string[] {
  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    "pipe:0",
    "-vn",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    "-f",
    "mp3",
    "pipe:1",
  ];
}

/**
 * Arranca la extraccion del audio en MP3 de un formato ya resuelto como una
 * tuberia `yt-dlp | ffmpeg`, escribiendo el MP3 a stdout en streaming y sin
 * archivos temporales.
 *
 * Motivacion: `yt-dlp -x --audio-format mp3` omite el postprocesado cuando la
 * salida es stdout (`-o -`) y devuelve el MP4 intacto (verificado por smoke
 * test); la tuberia si produce MP3 valido conservando el streaming.
 *
 * Se usa el `formatId` EXACTO de la referencia (sin fallback a `best`): es lo
 * que garantiza que el MP3 deriva de la variante limpia y que, si deja de
 * existir, la ruta falla en lugar de entregar audio de otra variante.
 *
 * Devuelve una fachada con la superficie que usa la ruta HTTP (`stdout`,
 * `stderr`, `kill`, `killed`, `once`/`on` para `close`/`error`), de modo que
 * el streaming, el error temprano y la cancelacion funcionan igual que en la
 * via de video. El `stderr` combina ambas etapas para clasificar el error.
 */
export function spawnAudioPipeline(
  ytdlpBinary: string,
  formatId: string,
  url: string,
  options: SpawnAudioOptions,
): ChildProcessWithoutNullStreams {
  const emitter = new EventEmitter();
  const stderr = new PassThrough();
  const state = { killed: false, dlCode: null as number | null, cvCode: null as number | null };

  const dl = spawn(
    /* turbopackIgnore: true */
    ytdlpBinary,
    ["-f", formatId, "--no-playlist", "-o", "-", url],
    { windowsHide: true, shell: false },
  );
  const cv = spawn(
    /* turbopackIgnore: true */
    options.ffmpegBinary,
    buildFfmpegMp3Args(),
    { windowsHide: true, shell: false },
  );

  // Evita una excepcion no capturada si ffmpeg muere antes (EPIPE al escribir).
  cv.stdin.on("error", () => {});
  dl.stdout.pipe(cv.stdin);

  dl.stderr?.on("data", (chunk: Buffer) => stderr.write(chunk));
  cv.stderr?.on("data", (chunk: Buffer) => stderr.write(chunk));

  const maybeClose = () => {
    if (state.dlCode === null || state.cvCode === null) return;
    // Si alguna etapa fallo, el cierre es fallo; el stderr combinado permite
    // clasificar la causa (p. ej. formato ya no disponible).
    emitter.emit("close", state.cvCode !== 0 ? state.cvCode : state.dlCode);
  };
  dl.on("close", (code) => {
    state.dlCode = code ?? 1;
    maybeClose();
  });
  cv.on("close", (code) => {
    state.cvCode = code ?? 1;
    maybeClose();
  });
  const forwardError = (cause: unknown) => emitter.emit("error", cause);
  dl.on("error", forwardError);
  cv.on("error", forwardError);

  const api = {
    stdout: cv.stdout,
    stderr,
    get killed() {
      return state.killed;
    },
    kill(signal?: NodeJS.Signals) {
      state.killed = true;
      try {
        dl.kill(signal);
      } catch {
        // El proceso ya pudo terminar; prima detener la conversion.
      }
      try {
        return cv.kill(signal);
      } catch {
        return false;
      }
    },
    once(event: string, listener: (...args: unknown[]) => void) {
      emitter.once(event, listener);
      return api;
    },
    on(event: string, listener: (...args: unknown[]) => void) {
      emitter.on(event, listener);
      return api;
    },
    removeListener(event: string, listener: (...args: unknown[]) => void) {
      emitter.removeListener(event, listener);
      return api;
    },
  };
  // Compatibilidad estructural con la ruta de video (solo se usan los miembros
  // definidos arriba).
  return api as unknown as ChildProcessWithoutNullStreams;
}
