import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassThrough } from "node:stream";

const spawnMock = vi.fn();
vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

import { buildFfmpegMp3Args, spawnAudioPipeline } from "../lib/download-process";

/** Proceso falso con streams reales para verificar la tuberia. */
function fakeProc() {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  return {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    stdin: new PassThrough(),
    kill: vi.fn(() => true),
    on(event: string, cb: (...a: unknown[]) => void) {
      (handlers[event] ??= []).push(cb);
      return this;
    },
    emitClose(code: number) {
      for (const cb of handlers.close ?? []) cb(code);
    },
  };
}

const URL = "https://www.tiktok.com/@u/video/1";

beforeEach(() => spawnMock.mockReset());

describe("buildFfmpegMp3Args", () => {
  it("convierte a MP3 desde stdin hacia stdout sin video", () => {
    const args = buildFfmpegMp3Args();
    expect(args).toContain("-i");
    expect(args[args.indexOf("-i") + 1]).toBe("pipe:0");
    expect(args).toContain("-vn");
    expect(args).toContain("libmp3lame");
    expect(args).toContain("-f");
    expect(args[args.indexOf("-f") + 1]).toBe("mp3");
    expect(args[args.indexOf("pipe:1") - 1]).toBe("mp3");
    expect(args.at(-1)).toBe("pipe:1");
  });
});

describe("spawnAudioPipeline", () => {
  it("descarga el formatId exacto sin fallback y convierte con el binario dado", () => {
    const dl = fakeProc();
    const cv = fakeProc();
    spawnMock.mockReturnValueOnce(dl).mockReturnValueOnce(cv);

    spawnAudioPipeline("yt-dlp-falso", "f1", URL, { ffmpegBinary: "ffmpeg-falso" });

    expect(spawnMock).toHaveBeenCalledTimes(2);
    const [dlBinary, dlArgs, dlOpts] = spawnMock.mock.calls[0] as [
      string,
      string[],
      { shell: boolean },
    ];
    expect(dlBinary).toBe("yt-dlp-falso");
    expect(dlArgs).toEqual(["-f", "f1", "--no-playlist", "-o", "-", URL]);
    expect(dlOpts.shell).toBe(false);

    const [cvBinary, cvArgs, cvOpts] = spawnMock.mock.calls[1] as [
      string,
      string[],
      { shell: boolean },
    ];
    // Binario explicito: no depende del PATH del hijo.
    expect(cvBinary).toBe("ffmpeg-falso");
    expect(cvOpts.shell).toBe(false);
    expect(cvArgs).toEqual(buildFfmpegMp3Args());
  });

  it("entuba la descarga en la conversion", async () => {
    const dl = fakeProc();
    const cv = fakeProc();
    spawnMock.mockReturnValueOnce(dl).mockReturnValueOnce(cv);

    spawnAudioPipeline("yt-dlp-falso", "f1", URL, { ffmpegBinary: "ffmpeg-falso" });

    const received: Buffer[] = [];
    cv.stdin.on("data", (c: Buffer) => received.push(c));
    dl.stdout.write(Buffer.from([1, 2, 3]));
    await new Promise((r) => setTimeout(r, 20));
    expect(Buffer.concat(received)).toEqual(Buffer.from([1, 2, 3]));
  });

  it("expone el stdout de la conversion y combina ambos stderr", async () => {
    const dl = fakeProc();
    const cv = fakeProc();
    spawnMock.mockReturnValueOnce(dl).mockReturnValueOnce(cv);

    const pipe = spawnAudioPipeline("yt-dlp-falso", "f1", URL, {
      ffmpegBinary: "ffmpeg-falso",
    });

    expect(pipe.stdout).toBe(cv.stdout);

    const err: Buffer[] = [];
    (pipe.stderr as PassThrough).on("data", (c: Buffer) => err.push(c));
    dl.stderr.write("origen: ");
    cv.stderr.write("conversion: x");
    await new Promise((r) => setTimeout(r, 20));
    expect(Buffer.concat(err).toString()).toBe("origen: conversion: x");
  });

  it("cierra solo cuando terminan ambas etapas y propaga el fallo", () => {
    const dl = fakeProc();
    const cv = fakeProc();
    spawnMock.mockReturnValueOnce(dl).mockReturnValueOnce(cv);

    const pipe = spawnAudioPipeline("yt-dlp-falso", "f1", URL, {
      ffmpegBinary: "ffmpeg-falso",
    });
    const onClose = vi.fn();
    pipe.once("close", onClose);

    dl.emitClose(0);
    expect(onClose).not.toHaveBeenCalled();
    cv.emitClose(1);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onClose.mock.calls[0][0]).toBe(1);
  });

  it("mata ambas etapas y marca killed", () => {
    const dl = fakeProc();
    const cv = fakeProc();
    spawnMock.mockReturnValueOnce(dl).mockReturnValueOnce(cv);

    const pipe = spawnAudioPipeline("yt-dlp-falso", "f1", URL, {
      ffmpegBinary: "ffmpeg-falso",
    });
    pipe.kill();
    expect(dl.kill).toHaveBeenCalledOnce();
    expect(cv.kill).toHaveBeenCalledOnce();
    expect(pipe.killed).toBe(true);
  });
});
