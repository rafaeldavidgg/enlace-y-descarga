import { spawn } from "node:child_process";
import { access, constants } from "node:fs/promises";
import path from "node:path";

/**
 * Errores del dominio del descargador. Se exponen al cliente con un mensaje
 * en espanol y un codigo estable, nunca con detalles internos de yt-dlp.
 */
export type ExtractionErrorCode =
  | "ENLACE_INVALIDO"
  | "PLATAFORMA_NO_SOPORTADA"
  | "BINARIO_AUSENTE"
  | "CONTENIDO_PRIVADO"
  | "REQUIERE_AUTENTICACION"
  | "FORMATO_NO_DISPONIBLE"
  | "TIEMPO_AGOTADO"
  | "FALLO_EXTRACCION";

const ERROR_MESSAGES: Record<ExtractionErrorCode, string> = {
  ENLACE_INVALIDO:
    "El enlace no es válido. Pega una URL completa del video que quieres descargar.",
  PLATAFORMA_NO_SOPORTADA:
    "Esa plataforma no es compatible. Por ahora funcionan enlaces de TikTok y X (Twitter).",
  BINARIO_AUSENTE:
    "El motor de descarga no está instalado. Ejecuta `npm run dev` (o `npm install`) para descargarlo automáticamente.",
  CONTENIDO_PRIVADO:
    "El contenido no está disponible públicamente: puede ser privado, haber sido eliminado o estar restringido por región.",
  REQUIERE_AUTENTICACION:
    "Ese contenido requiere iniciar sesión y no se puede procesar desde aquí.",
  FORMATO_NO_DISPONIBLE:
    "No hay un formato descargable disponible para este video con audio y video juntos.",
  TIEMPO_AGOTADO:
    "La descarga tardó demasiado. Prueba con un formato de menor calidad o inténtalo de nuevo más tarde.",
  FALLO_EXTRACCION:
    "No se pudo procesar el enlace. Puede deberse a un cambio reciente en la plataforma; inténtalo de nuevo más tarde.",
};

/** Error con mensaje para el usuario y codigo estable. */
export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;

  constructor(code: ExtractionErrorCode, cause?: unknown) {
    super(ERROR_MESSAGES[code]);
    this.name = "ExtractionError";
    this.code = code;
    if (cause !== undefined) {
      // Se guarda como causa para depuracion en servidor; no se serializa al cliente.
      this.cause = cause;
    }
  }
}

/**
 * Mapea la salida de error de yt-dlp a una clase de error del dominio.
 * Se usa el texto de stderr porque yt-dlp no expone codigos de error estables.
 */
export function classifyYtDlpError(stderr: string): ExtractionErrorCode {
  const text = stderr.toLowerCase();

  // El orden importa: los mensajes de formato contienen "available", que tambien
  // aparece en los de disponibilidad del video. Se comprueba primero lo especifico.
  if (
    text.includes("requested format") ||
    text.includes("no video formats") ||
    text.includes("no formats") ||
    text.includes("format is not available")
  ) {
    return "FORMATO_NO_DISPONIBLE";
  }

  if (
    text.includes("sign in") ||
    text.includes("login") ||
    text.includes("cookies") ||
    text.includes("authentication") ||
    text.includes("account")
  ) {
    return "REQUIERE_AUTENTICACION";
  }

  if (
    text.includes("private") ||
    text.includes("video unavailable") ||
    text.includes("this video is unavailable") ||
    text.includes("no video could be found") ||
    text.includes("removed") ||
    text.includes("blocked") ||
    text.includes("geo") ||
    text.includes("404")
  ) {
    return "CONTENIDO_PRIVADO";
  }

  if (text.includes("unsupported url") || text.includes("no suitable")) {
    return "PLATAFORMA_NO_SOPORTADA";
  }

  return "FALLO_EXTRACCION";
}

/** Tamano maximo de la salida capturada para el parseo de metadatos. */
const MAX_CAPTURE_BYTES = 32 * 1024 * 1024;

/**
 * Ruta al binario de yt-dlp. Se resuelve en tiempo de ejecucion a partir de la
 * raiz del proyecto, sin rutas absolutas codificadas, de modo que funcione
 * igual en local y en el paquete de una funcion desplegada.
 */
export function resolveYtDlpPath(): string {
  const override = process.env.YTDLP_PATH;
  if (override && override.trim() !== "") {
    return override;
  }
  const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  return path.join(process.cwd(), "bin", binaryName);
}

/** Comprueba que el binario existe y es ejecutable. */
export async function assertYtDlpAvailable(): Promise<string> {
  const binary = resolveYtDlpPath();
  try {
    await access(binary, constants.F_OK);
  } catch (cause) {
    throw new ExtractionError("BINARIO_AUSENTE", cause);
  }
  return binary;
}

export interface RunYtDlpOptions {
  args: string[];
  /** Limite de tiempo en milisegundos. */
  timeoutMs?: number;
  /** Tope de bytes capturados de stdout antes de abortar. */
  maxStdoutBytes?: number;
  /** Si se indica, se llama con el proceso hijo para poder cancelarlo. */
  onSpawn?: (child: ReturnType<typeof spawn>) => void;
  /** Aborta la ejecucion cuando la senal se activa. */
  signal?: AbortSignal;
}

export interface YtDlpResult {
  stdout: string;
  stderr: string;
}

/**
 * Ejecuta yt-dlp capturando su salida y lanza `ExtractionError` clasificado
 * ante cualquier fallo (binario ausente, timeout, salida de error).
 */
export async function runYtDlp(options: RunYtDlpOptions): Promise<YtDlpResult> {
  const binary = await assertYtDlpAvailable();
  const maxStdoutBytes = options.maxStdoutBytes ?? MAX_CAPTURE_BYTES;

  return new Promise<YtDlpResult>((resolve, reject) => {
    const child = spawn(
      // turbopackIgnore evita trazar todo el proyecto en el paquete de la función.
      /* turbopackIgnore: true */
      binary,
      options.args,
      {
        windowsHide: true,
        // Sin shell: se evita la interpolacion de la URL en una linea de comandos.
        shell: false,
      },
    );

    options.onSpawn?.(child);

    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let settled = false;

    const timer =
      options.timeoutMs !== undefined
        ? setTimeout(() => {
            finish(new ExtractionError("TIEMPO_AGOTADO"));
          }, options.timeoutMs)
        : undefined;

    const onAbort = () => {
      child.kill();
      finish(new ExtractionError("TIEMPO_AGOTADO"));
    };

    if (options.signal) {
      if (options.signal.aborted) {
        onAbort();
      } else {
        options.signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    function cleanup() {
      if (timer) clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }

    function finish(error?: Error) {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    }

    child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxStdoutBytes) {
        child.kill();
        finish(new ExtractionError("FALLO_EXTRACCION"));
        return;
      }
      stdout += chunk.toString("utf8");
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      // stderr se conserva acotado: solo se usa para clasificar el error.
      if (stderr.length < 64 * 1024) {
        stderr += chunk.toString("utf8");
      }
    });

    child.on("error", (cause) => {
      finish(new ExtractionError("BINARIO_AUSENTE", cause));
    });

    child.on("close", (exitCode) => {
      if (settled) return;
      if (exitCode === 0) {
        finish();
      } else {
        finish(new ExtractionError(classifyYtDlpError(stderr)));
      }
    });
  });
}

/** Devuelve la version del binario de yt-dlp (util para diagnostico). */
export async function getYtDlpVersion(): Promise<string> {
  const { stdout } = await runYtDlp({ args: ["--version"], timeoutMs: 30_000 });
  return stdout.trim();
}
