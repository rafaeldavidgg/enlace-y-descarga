import { resolveMediaInfo } from "@/lib/extractor";
import { ExtractionError } from "@/lib/ytdlp";

/**
 * Resuelve un enlace en metadatos y formatos descargables.
 *
 * Entrada: JSON `{ url: string }`.
 * Salida: `MediaInfo` o `{ error: { code, message } }`.
 *
 * Las referencias de formato que se devuelven son opacas y firmadas; el cliente
 * no recibe nunca la URL de origen del CDN.
 */
export const maxDuration = 60;

interface InfoRequestBody {
  url?: unknown;
}

export async function POST(request: Request) {
  let body: InfoRequestBody;
  try {
    body = (await request.json()) as InfoRequestBody;
  } catch {
    return Response.json(
      { error: { code: "ENLACE_INVALIDO", message: "Envía un enlace válido." } },
      { status: 400 },
    );
  }

  const url = typeof body.url === "string" ? body.url : "";

  try {
    const info = await resolveMediaInfo(url);
    return Response.json(info, { status: 200 });
  } catch (error) {
    if (error instanceof ExtractionError) {
      // El mensaje ya está en español y no expone detalles internos.
      const status = error.code === "FALLO_EXTRACCION" || error.code === "TIEMPO_AGOTADO" ? 502 : 400;
      return Response.json({ error: { code: error.code, message: error.message } }, { status });
    }
    // Fallo no previsto: mensaje genérico, sin trazas.
    console.error("[api/info] error inesperado", error);
    return Response.json(
      {
        error: {
          code: "FALLO_EXTRACCION",
          message: "No se pudo procesar el enlace. Inténtalo de nuevo más tarde.",
        },
      },
      { status: 502 },
    );
  }
}
