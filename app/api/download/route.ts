import { Readable } from "node:stream";
import { decodeFormatRef, resolveFormatExt } from "@/lib/extractor";
import { spawnDownloadProcess } from "@/lib/download-process";
import { assertYtDlpAvailable, ExtractionError } from "@/lib/ytdlp";

/**
 * Descarga un formato resuelto previamente, reenviándolo en streaming.
 *
 * Entrada: `?ref=<referencia opaca firmada>`.
 * Salida: el archivo con `Content-Disposition: attachment`.
 *
 * El streaming evita el límite de cuerpo de respuesta de 4.5 MB de la plataforma
 * de despliegue, y `Content-Disposition` fuerza la descarga real en lugar de la
 * reproducción (el atributo `download` de HTML se ignora entre orígenes).
 */
export const maxDuration = 300;

/** Tiempo máximo de espera antes de abortar una descarga atascada. */
const DOWNLOAD_TIMEOUT_MS = 300_000;

/** Extensiones permitidas para el nombre de archivo. */
const ALLOWED_EXTENSIONS = new Set(["mp4", "webm", "mkv", "mov", "m4a"]);

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

  let binary: string;
  try {
    binary = await assertYtDlpAvailable();
  } catch (error) {
    if (error instanceof ExtractionError) {
      return Response.json({ error: { code: error.code, message: error.message } }, { status: 500 });
    }
    throw error;
  }

  const ext = resolveFormatExt(decoded.f);
  const fileName = buildFileName(decoded.t, ext);

  // yt-dlp escribe el archivo a stdout con `-o -`. El flujo se reenvía tal cual,
  // sin almacenamiento intermedio ni cargar el archivo en memoria.
  const child = spawnDownloadProcess(binary, decoded.f, decoded.u);

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
        fail(
          Response.json(
            {
              error: {
                code: "CONTENIDO_PRIVADO",
                message:
                  "No se pudo obtener el archivo. Puede que el contenido ya no esté disponible; vuelve a resolver el enlace.",
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
        "Content-Type": `video/${ext === "m4a" ? "mp4" : ext}`,
        "Content-Disposition": contentDisposition(fileName),
        "Cache-Control": "no-store",
      },
    },
  );

  const failure = await earlyFailure;
  return failure ?? response;
}
