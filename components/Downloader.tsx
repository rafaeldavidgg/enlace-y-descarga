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
    <section className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="url" className="sr-only">
          Enlace del video
        </label>
        <input
          id="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Pega aquí el enlace de TikTok o X (Twitter)"
          disabled={resolving || downloading}
          className="w-full rounded-lg border border-black/15 bg-white px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 disabled:opacity-60 dark:border-white/20 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={resolving || downloading || url.trim() === ""}
          className="rounded-lg bg-neutral-900 px-5 py-3 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {resolving ? "Resolviendo…" : "Buscar"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {noFormats && !error && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Este video no tiene un formato descargable con audio y video juntos.
        </p>
      )}

      {info && status !== "idle" && (
        <article className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/15">
          <div className="flex flex-col gap-4 sm:flex-row">
            {info.thumbnail ? (
              // Miniatura remota de la plataforma; se usa <img> porque el dominio
              // de origen es dinámico y no está configurado en next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.thumbnail}
                alt=""
                className="h-32 w-full rounded-lg object-cover sm:w-48"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {info.title ?? "Video sin título"}
              </h2>
              <dl className="mt-2 space-y-1 text-sm opacity-80">
                {formatDuration(info.durationSeconds) && (
                  <div>
                    <dt className="inline font-medium">Duración: </dt>
                    <dd className="inline">{formatDuration(info.durationSeconds)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline font-medium">Plataforma: </dt>
                  <dd className="inline">{info.platform === "tiktok" ? "TikTok" : "X (Twitter)"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {formats.length > 0 && (
            <div className="mt-4">
              <label htmlFor="calidad" className="mb-1 block text-sm font-medium">
                Calidad
              </label>
              <select
                id="calidad"
                value={selectedRef ?? ""}
                onChange={(event) => setSelectedRef(event.target.value)}
                disabled={downloading}
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-neutral-900"
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
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!selectedRef || downloading}
              className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {downloading ? "Descargando…" : "Descargar video"}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={downloading}
              className="rounded-lg border border-black/15 px-5 py-2.5 font-medium transition hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
            >
              Empezar de nuevo
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
