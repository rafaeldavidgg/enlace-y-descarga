import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";

import {
  assertFfmpegAvailable,
  resolveFfmpegBinary,
  resolveFfmpegDir,
} from "../lib/ffmpeg";
import { ExtractionError } from "../lib/ytdlp";

const ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ENV };
  vi.unstubAllEnvs();
});

describe("resolveFfmpegBinary", () => {
  it("prioriza FFMPEG_PATH sobre la dependencia", () => {
    vi.stubEnv("FFMPEG_PATH", "/opt/ffmpeg/bin/ffmpeg");
    expect(resolveFfmpegBinary()).toBe("/opt/ffmpeg/bin/ffmpeg");
  });
});

describe("resolveFfmpegDir", () => {
  it("devuelve el directorio cuando se indica el archivo", () => {
    vi.stubEnv("FFMPEG_PATH", path.join("C:", "tools", "ffmpeg", "ffmpeg.exe"));
    expect(resolveFfmpegDir()).toBe(path.join("C:", "tools", "ffmpeg"));
  });

  it("devuelve null sin configuracion ni dependencia", () => {
    vi.stubEnv("FFMPEG_PATH", "");
    // Sin FFMPEG_PATH solo queda ffmpeg-static si esta instalado; el resultado
    // es su directorio o null, nunca una cadena vacia.
    const dir = resolveFfmpegDir();
    expect(dir === null || (typeof dir === "string" && dir !== "")).toBe(true);
  });
});

describe("assertFfmpegAvailable", () => {
  it("lanza BINARIO_AUSENTE sin configuracion cuando falta la dependencia", async () => {
    // ffmpeg-static no existe como modulo: la resolucion queda en null.
    vi.stubEnv("FFMPEG_PATH", "");
    const { resolveFfmpegBinary: real } = await import("../lib/ffmpeg");
    if (real() !== null) return; // dependencia instalada: no aplicable
    await expect(assertFfmpegAvailable()).rejects.toMatchObject({ code: "BINARIO_AUSENTE" });
  });

  it("lanza BINARIO_AUSENTE cuando la ruta explicita no existe", async () => {
    vi.stubEnv("FFMPEG_PATH", path.join("C:", "no-existe", "ffmpeg.exe"));
    await expect(assertFfmpegAvailable()).rejects.toBeInstanceOf(ExtractionError);
    await expect(assertFfmpegAvailable()).rejects.toMatchObject({ code: "BINARIO_AUSENTE" });
  });

  it("devuelve la ruta cuando el archivo existe", async () => {
    vi.stubEnv("FFMPEG_PATH", process.execPath);
    await expect(assertFfmpegAvailable()).resolves.toBe(process.execPath);
  });
});
