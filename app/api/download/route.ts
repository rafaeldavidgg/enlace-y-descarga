import { Readable } from "node:stream";
import { decodeFormatRef, resolveFormatExt } from "@/lib/extractor";
import { spawnAudioPipeline, spawnDownloadProcess } from "@/lib/download-process";
import { assertFfmpegAvailable } from "@/lib/ffmpeg";
import { validateLink } from "@/lib/platforms";
import { assertYtDlpAvailable, classifyYtDlpError, ExtractionError } from "@/lib/ytdlp";

/**
 * Descarga un formato resuelto previamente, reenviándolo en streaming.
 *
 * Entrada: `?ref=<referencia opaca firmada>` y, opcionalmente, `&audio=mp3`.
 * Salida: el archivo con `Content-Disposition: attachment`.
 *
 * El streaming evita el límite de cuerpo de respuesta de 4.5 MB de la plataforma
 * de despliegue, y `Content-Disposition` fuerza la descarga real en lugar de la
 * reproducción (el atributo `download` de HTML se ignora entre orígenes).
 *
 * Garantia sin marca de agua (TikTok): se descarga EXACTAMENTE el `format_id`
 * limpio de la referencia (`yt-dlp -f <id>`), sin fallback a `best` ni
 * re-resolucion. Si ese formato deja de estar disponible, se devuelve un error
 * claro (nunca se sustituye por la variante con marca).
 *
 * Modo audio (`&audio=mp3`, solo TikTok): extrae el audio del MISMO `format_id`
 * limpio mediante la tuberia `yt-dlp -f <id> -o - | ffmpeg -i pipe:0 ... pipe:1`
 * y lo entrega como `*.mp3` (`audio/mpeg`). La via de video no cambia.
 */
export const maxDuration = 300;

/** Tiempo máximo de espera antes de abortar una descarga atascada. */
const DOWNLOAD_TIMEOUT_MS = 300_000;

/** Extensiones permitidas para el nombre de archivo. */
const ALLOWED_EXTENSIONS = new Set(["mp4", "webm", "mkv", "mov", "m4a", "mp3"]);

/** Nombre de archivo seguro y con extensión coherente. */
export function buildFileName(title: string | null, ext: string): string {
  const safeExt = ALLOWED_EXTENSIONS.has(ext.toLowerCase()) ? ext.toLowerCase() : "mp4";
  const base = (title ?? "").trim();
  const sanitized = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();

  const name = sanitized === "" ? "video" : sanitized;
  return `${name}.${safeExt}`;
}

/** Codifica el nombre para el encabezado Content-Disposition (RFC 5987). */
export function contentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref") ?? "";
  const audioParam = searchParams.get("audio");

  // El modo audio solo admite `mp3`; cualquier otro valor es un error claro
  // en lugar de una descarga de video silenciosa.
  if (audioParam !== null && audioParam !== "mp3") {
    return Response.json(
      {
        error: {
          code: "ENLACE_INVALIDO",
          message: "El modo de audio no es válido. Usa el botón de descarga de audio e inténtalo de nuevo.",
        },
      },
      { status: 400 },
    );
  }
  const audioMode = audioParam === "mp3";

  const decoded = decodeFormatRef(ref);
  if (!decoded) {
    return Response.json(
      {
        error: {
          code: "ENLACE_INVALIDO",
          message: "La referencia de descarga no es válida o expiró. Vuelve a pegar el enlace.",
        },
      },
      { status: 400 },
    );
  }

  // El MP3 solo esta disponible para TikTok: la referencia no lleva la
  // plataforma, asi que se deduce del enlace original (sin re-resolucion).
  if (audioMode) {
    const validation = validateLink(decoded.u);
    if (!validation.ok || validation.platform !== "tiktok") {
      return Response.json(
        {
          error: {
            code: "PLATAFORMA_NO_SOPORTADA",
            message: "El audio en MP3 solo está disponible para videos de TikTok.",
          },
        },
        { status: 400 },
      );
    }
  }

  let binary: string;
  try {
    binary = await assertYtDlpAvailable();
  } catch (error) {
    if (error instanceof ExtractionError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: 500 });
    }
    throw error;
  }

  const ext = audioMode ? "mp3" : resolveFormatExt(decoded.f);
  const fileName = buildFileName(decoded.t, ext);

  // En modo audio, el binario de conversion debe existir ANTES de lanzar nada:
  // sin el, la tuberia no puede producir MP3 y se informa como ausente.
  let ffmpegBinary: string | null = null;
  if (audioMode) {
    try {
      ffmpegBinary = await assertFfmpegAvailable();
    } catch (error) {
      if (error instanceof ExtractionError) {
        return Response.json(
          { error: { code: error.code, message: error.message } },
          { status: 500 },
        );
      }
      throw error;
    }
  }

  // yt-dlp escribe el archivo a stdout con `-o -`. El flujo se reenvía tal cual,
  // sin almacenamiento intermedio ni cargar el archivo en memoria. En modo
  // audio se encadena `yt-dlp -o - | ffmpeg -i pipe:0 ... pipe:1` sobre el
  // mismo `formatId` limpio, sin fallback.
  const child = audioMode
    ? spawnAudioPipeline(binary, decoded.f, decoded.u, {
        ffmpegBinary: ffmpegBinary as string,
      })
    : spawnDownloadProcess(binary, decoded.f, decoded.u);

  let stdoutStarted = false;
  let stderr = "";

  child.stdout?.once("data", () => {
    stdoutStarted = true;
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    if (stderr.length < 64 * 1024) stderr += chunk.toString("utf8");
  });

  // Si el origen falla ANTES de emitir datos, se devuelve un error HTTP claro en
  // lugar de un archivo vacío. Si ya empezó, se corta el flujo (ver `pump`).
  const settled = { done: false };
  let resolveEarly: (value: Response | null) => void = () => {};
  const earlyFailure = new Promise<Response | null>((resolve) => {
    resolveEarly = (value) => {
      if (settled.done) return;
      settled.done = true;
      resolve(value);
    };

    const fail = (response: Response) => {
      if (stdoutStarted) return;
      resolveEarly(response);
    };

    child.once("close", (code) => {
      if (code !== 0) {
        // Sin sustitucion: si el formato limpio ya no existe (p. ej.
        // "Requested format is not available"), se informa el error clasificado
        // en lugar de reintentar con otro formato (que podria ser el marcado).
        const errorCode = classifyYtDlpError(stderr);
        const message = new ExtractionError(errorCode).message;
        fail(
          Response.json(
            {
              error: {
                code: errorCode,
                message,
              },
            },
            { status: 502 },
          ),
        );
      }
    });

    child.once("error", () => {
      fail(
        Response.json(
          {
            error: {
              code: "FALLO_EXTRACCION",
              message: "No se pudo iniciar la descarga. Inténtalo de nuevo más tarde.",
            },
          },
          { status: 502 },
        ),
      );
    });

    // Si el proceso arranca a emitir datos, no hay error temprano que reportar.
    child.stdout?.once("data", () => resolveEarly(null));
  });

  const timeout = setTimeout(() => child.kill(), DOWNLOAD_TIMEOUT_MS);

  const stop = () => {
    clearTimeout(timeout);
    if (!child.killed) child.kill();
    // Evita que la petición quede colgada si el cliente aborta antes de que el
    // proceso emita datos o termine.
    resolveEarly(
      Response.json(
        {
          error: {
            code: "TIEMPO_AGOTADO",
            message: "La descarga se canceló. Vuelve a intentarlo.",
          },
        },
        { status: 499 },
      ),
    );
  };
  request.signal.addEventListener("abort", stop, { once: true });

  child.on("close", () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", stop);
  });

  const response = new Response(
    Readable.toWeb(child.stdout) as unknown as ReadableStream<Uint8Array>,
    {
      status: 200,
      headers: {
        "Content-Type": audioMode ? "audio/mpeg" : `video/${ext === "m4a" ? "mp4" : ext}`,
        "Content-Disposition": contentDisposition(fileName),
        "Cache-Control": "no-store",
      },
    },
  );

  const failure = await earlyFailure;
  return failure ?? response;
}
