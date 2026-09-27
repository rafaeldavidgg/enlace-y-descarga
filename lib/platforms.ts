/**
 * Reconocimiento de plataformas soportadas y validacion de enlaces.
 *
 * Plataformas soportadas (verificadas el 2026-09-27):
 *  - TikTok: expone formatos mp4 con audio y video juntos.
 *  - X/Twitter: funciona cuando el tweet contiene un video.
 *
 * Fuera de alcance: Instagram (exige cookies de sesion) y YouTube
 * (solo ofrece pistas DASH separadas).
 */

export type Platform = "tiktok" | "twitter";

export const SUPPORTED_PLATFORMS: readonly Platform[] = ["tiktok", "twitter"] as const;

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  twitter: "X (Twitter)",
};

/** Dominios aceptados por plataforma. */
const HOSTS: Record<Platform, readonly string[]> = {
  tiktok: ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
  twitter: ["twitter.com", "x.com"],
};

/** Dominios que reconocemos explicitamente como no soportados. */
const KNOWN_UNSUPPORTED: readonly string[] = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "facebook.com",
  "fb.watch",
];

export type LinkValidation =
  | { ok: true; platform: Platform; url: string }
  | { ok: false; reason: "vacio" | "malformado" | "no_soportado" };

function hostMatches(hostname: string, base: string): boolean {
  return hostname === base || hostname.endsWith(`.${base}`);
}

/**
 * Normaliza y valida un enlace. No lanza errores: devuelve el motivo del fallo
 * para que la capa de API elija el mensaje en espanol.
 */
export function validateLink(raw: string | null | undefined): LinkValidation {
  const input = (raw ?? "").trim();
  if (input === "") {
    return { ok: false, reason: "vacio" };
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, reason: "malformado" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "malformado" };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  for (const platform of SUPPORTED_PLATFORMS) {
    if (HOSTS[platform].some((base) => hostMatches(hostname, base))) {
      return { ok: true, platform, url: parsed.toString() };
    }
  }

  if (KNOWN_UNSUPPORTED.some((base) => hostMatches(hostname, base))) {
    return { ok: false, reason: "no_soportado" };
  }

  // Un dominio desconocido se trata como no soportado.
  return { ok: false, reason: "no_soportado" };
}

/** Etiqueta legible de una plataforma. */
export function platformLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}
