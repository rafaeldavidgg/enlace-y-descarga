import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PassThrough } from "node:stream";

// Se sustituye el lanzamiento real de yt-dlp por un proceso falso controlado.
const spawnMock = vi.fn();
vi.mock("../lib/download-process", () => ({
  spawnDownloadProcess: (...args: unknown[]) => spawnMock(...args),
}));

// Se evita depender del binario real.
vi.mock("../lib/ytdlp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/ytdlp")>();
  return { ...actual, assertYtDlpAvailable: async () => "yt-dlp-falso" };
});

import { GET } from "../app/api/download/route";
import { encodeFormatRef } from "../lib/extractor";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

/** Crea un proceso falso que emite `size` bytes y termina con `exitCode`. */
function fakeProcess(opts: {
  size?: number;
  exitCode?: number;
  emitNothing?: boolean;
  neverClose?: boolean;
}) {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const listeners: Record<string, Array<(...a: unknown[]) => void>> = {};
  const state = { killed: false };
  const child: Record<string, unknown> = {
    stdout,
    stderr,
    killed: false,
    kill() {
      state.killed = true;
      child.killed = true;
    },
    once(event: string, cb: (...a: unknown[]) => void) {
      (listeners[event] ??= []).push(cb);
      return child;
    },
    on(event: string, cb: (...a: unknown[]) => void) {
      (listeners[event] ??= []).push(cb);
      return child;
    },
    removeListener() {
      return child;
    },
  };

  const asChild = () => child as unknown as ChildProcessWithoutNullStreams;

  if (opts.neverClose) {
    // El proceso permanece vivo: se simula una descarga larga en curso.
  } else if (!opts.emitNothing) {
    // Se emite en el siguiente tick, cuando la ruta ya conectó sus oyentes.
    setTimeout(() => {
      const size = opts.size ?? 0;
      const chunk = Buffer.alloc(1024 * 1024, 7);
      let written = 0;
      while (written < size) {
        const n = Math.min(chunk.length, size - written);
        stdout.write(chunk.subarray(0, n));
        written += n;
      }
      stdout.end();
      for (const cb of listeners.close ?? []) cb(opts.exitCode ?? 0);
    }, 10);
  } else {
    setTimeout(() => {
      for (const cb of listeners.close ?? []) cb(opts.exitCode ?? 1);
    }, 10);
  }

  return asChild();
}

const ref = () => encodeFormatRef("https://www.tiktok.com/@u/video/1", "f1", "Pelicula larga", "mp4");

beforeEach(() => spawnMock.mockReset());
afterEach(() => vi.clearAllMocks());

describe("GET /api/download (streaming)", () => {
  it("entrega un archivo mayor que 4.5 MB completo, sin truncarlo", async () => {
    const size = 6 * 1024 * 1024; // 6 MB > límite de 4.5 MB
    spawnMock.mockReturnValue(fakeProcess({ size }));

    const response = await GET(new Request(`http://localhost/api/download?ref=${encodeURIComponent(ref())}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("content-disposition")).toContain("Pelicula larga.mp4");

    const body = Buffer.from(await response.arrayBuffer());
    expect(body.length).toBe(size);
  }, 60_000);

  it("rechaza una referencia ausente o manipulada sin iniciar la descarga", async () => {
    const response = await GET(new Request("http://localhost/api/download?ref=referencia.invalida"));
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe("ENLACE_INVALIDO");
    expect(spawnMock).not.toHaveBeenCalled();
  });

  it("devuelve un error claro cuando el origen falla antes de emitir datos", async () => {
    spawnMock.mockReturnValue(fakeProcess({ emitNothing: true, exitCode: 1 }));

    const response = await GET(new Request(`http://localhost/api/download?ref=${encodeURIComponent(ref())}`));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.error.message).toMatch(/no se pudo obtener|no está disponible/i);
  }, 30_000);

  it("cancela el proceso de descarga cuando el cliente interrumpe", async () => {
    const child = fakeProcess({ neverClose: true }); // el proceso sigue vivo
    spawnMock.mockReturnValue(child);

    const controller = new AbortController();
    const request = new Request(`http://localhost/api/download?ref=${encodeURIComponent(ref())}`, {
      signal: controller.signal,
    });

    // No se espera a que termine: se dispara el aborto como haría un cliente real.
    const pending = GET(request);
    await new Promise((r) => setTimeout(r, 20));
    controller.abort();
    const response = await pending;

    expect((child as unknown as { killed: boolean }).killed).toBe(true);
    expect(response.status).toBe(499);
  }, 30_000);
});
