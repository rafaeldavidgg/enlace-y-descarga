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

  it("ofrece un candidato sin depender de que require exista en el runtime", () => {
    vi.stubEnv("FFMPEG_PATH", "");
    // Sin FFMPEG_PATH queda el paquete o la ubicacion habitual bajo
    // node_modules: en ambos casos una ruta no vacia al binario esperado
    // segun la plataforma, nunca una cadena vacia.
    const binary = resolveFfmpegBinary();
    expect(typeof binary === "string" && binary !== "").toBe(true);
    const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    expect(binary as string).toMatch(new RegExp(`${exe}$`));
    const dir = resolveFfmpegDir();
    expect(typeof dir === "string" && (dir as string) !== "").toBe(true);
  });
});

describe("assertFfmpegAvailable", () => {
  it("lanza BINARIO_AUSENTE cuando la ruta explicita no existe", async () => {
    vi.stubEnv("FFMPEG_PATH", path.join("C:", "no-existe", "ffmpeg.exe"));
    await expect(assertFfmpegAvailable()).rejects.toBeInstanceOf(ExtractionError);
    await expect(assertFfmpegAvailable()).rejects.toMatchObject({ code: "BINARIO_AUSENTE" });
  });

  it("devuelve la ruta cuando el archivo existe", async () => {
    vi.stubEnv("FFMPEG_PATH", process.execPath);
    await expect(assertFfmpegAvailable()).resolves.toBe(process.execPath);
  });

  it("resuelve el binario empaquetado sin FFMPEG_PATH cuando esta instalado", async () => {
    vi.stubEnv("FFMPEG_PATH", "");
    const binary = resolveFfmpegBinary();
    if (typeof binary !== "string" || binary === "") return; // sin candidato: no aplicable
    // El candidato habitual existe tras `npm install` (postinstall de ffmpeg-static).
    await expect(assertFfmpegAvailable()).resolves.toBe(binary);
  });
});
