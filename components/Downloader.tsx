"use client";

import { useState } from "react";
import type { ApiError, MediaInfo } from "@/lib/types";
import { formatBytes, formatDuration, pickDefaultFormat } from "@/lib/format";

type Status = "idle" | "resolviendo" | "listo" | "descargando";

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolving = status === "resolviendo";
  const downloading = status === "descargando";
  const formats = info?.formats ?? [];
  const noFormats = status === "listo" && formats.length === 0;
  const isTiktok = info?.platform === "tiktok";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("resolviendo");
    setError(null);
    setInfo(null);
    setSelectedRef(null);

    try {
      const response = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json()) as MediaInfo | { error: ApiError };

      if (!response.ok || "error" in data) {
        const message = "error" in data ? data.error.message : "No se pudo resolver el enlace.";
        setError(message);
        setStatus("idle");
        return;
      }

      setInfo(data);
      setSelectedRef(pickDefaultFormat(data.formats)?.ref ?? null);
      setStatus("listo");
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
      setStatus("idle");
    }
  }

  function handleDownload() {
    if (!selectedRef) return;
    setError(null);
    setStatus("descargando");

    // La descarga se hace por navegación a la ruta con la referencia opaca: el
    // servidor responde con Content-Disposition: attachment y el navegador
    // guarda el archivo. No se puede detectar el fin con fetch, así que se
    // vuelve al estado "listo" tras un breve margen.
    const link = document.createElement("a");
    link.href = `/api/download?ref=${encodeURIComponent(selectedRef)}`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => setStatus("listo"), 1500);
  }

  function reset() {
    setUrl("");
    setInfo(null);
    setSelectedRef(null);
    setError(null);
    setStatus("idle");
  }

  return (
    <section className="w-full min-w-0">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3 shadow-card sm:p-4"
      >
        <label htmlFor="url" className="sr-only">
          Enlace del video
        </label>
        <input
          id="url"
          name="video-url"
          type="text"
          inputMode="url"
          enterKeyHint="go"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Pega aquí el enlace de TikTok o X (Twitter)"
          disabled={resolving || downloading}
          className="min-h-[44px] w-full min-w-0 rounded-control border border-border bg-background px-4 text-base text-foreground outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={resolving || downloading || url.trim() === ""}
          className="min-h-[44px] w-full rounded-control bg-action px-5 font-medium text-action-contrast transition hover:bg-action-hover disabled:opacity-50 sm:w-auto"
        >
          {resolving ? "Resolviendo…" : "Buscar"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed break-words text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {noFormats && !error && (
        <p className="mt-3 rounded-control border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed break-words text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {isTiktok
            ? "Este video de TikTok no tiene una variante sin marca de agua descargable con audio y video juntos. No se ofrece la versión con marca de agua."
            : "Este video no tiene un formato descargable con audio y video juntos."}
        </p>
      )}

      {info && status !== "idle" && (
        <article className="mt-4 min-w-0 rounded-card border border-border bg-surface p-3 shadow-card sm:p-4">
          <div className="flex min-w-0 flex-col gap-4">
            {info.thumbnail ? (
              <div className="w-full min-w-0 overflow-hidden rounded-control border border-border bg-sunken">
                {/* Miniatura remota de la plataforma; se usa <img> porque el dominio
                de origen es dinámico y no está configurado en next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={info.thumbnail}
                  alt=""
                  className="aspect-video h-auto w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg leading-snug font-semibold break-words text-pretty">
                {info.title ?? "Video sin título"}
              </h2>
              <dl className="mt-2 space-y-1 text-sm text-foreground/70">
                {formatDuration(info.durationSeconds) && (
                  <div>
                    <dt className="inline font-medium text-foreground">Duración: </dt>
                    <dd className="inline">{formatDuration(info.durationSeconds)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium text-foreground">Plataforma: </dt>
                  <dd className="inline">{info.platform === "tiktok" ? "TikTok" : "X (Twitter)"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {formats.length > 0 && (
            <div className="mt-4">
              <label htmlFor="calidad" className="mb-1.5 block text-sm font-medium">
                Calidad
              </label>
              <select
                id="calidad"
                value={selectedRef ?? ""}
                onChange={(event) => setSelectedRef(event.target.value)}
                disabled={downloading}
                className="min-h-[44px] w-full min-w-0 rounded-control border border-border bg-background px-3 text-base disabled:opacity-60"
              >
                {formats.map((format) => {
                  const size = formatBytes(format.approxBytes);
                  return (
                    <option key={format.ref} value={format.ref}>
                      {format.label}
                      {size ? ` · ${size}` : ""}
                    </option>
                  );
                })}
              </select>
              {isTiktok && (
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/60">
                  Descarga sin marca de agua (sin marca móvil ni tarjeta final).
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!selectedRef || downloading}
              className="min-h-[44px] w-full rounded-control bg-action px-5 font-medium text-action-contrast transition hover:bg-action-hover disabled:opacity-50 sm:w-auto"
            >
              {downloading ? "Descargando…" : "Descargar video"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={downloading}
              className="min-h-[44px] w-full rounded-control border border-border px-5 font-medium transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10 sm:w-auto"
            >
              Empezar de nuevo
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
