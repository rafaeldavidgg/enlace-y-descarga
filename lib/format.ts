/** Utilidades de formato compartidas por la interfaz. */

/** Convierte segundos a "m:ss" o "h:mm:ss". Devuelve null si no hay dato. */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Tamaño aproximado legible. Devuelve null si no hay dato. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const rounded = value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

/** Elige el mejor formato con audio y video: más resolución, luego más tamaño. */
export function pickDefaultFormat<T extends { height: number | null; approxBytes: number | null }>(
  formats: T[],
): T | null {
  if (formats.length === 0) return null;
  return [...formats].sort((a, b) => {
    const heightDiff = (b.height ?? 0) - (a.height ?? 0);
    if (heightDiff !== 0) return heightDiff;
    return (b.approxBytes ?? 0) - (a.approxBytes ?? 0);
  })[0];
}
