import { beforeEach, describe, expect, it, vi } from "vitest";

const runYtDlpMock = vi.fn();

vi.mock("../lib/ytdlp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/ytdlp")>();
  return { ...actual, runYtDlp: (...args: unknown[]) => runYtDlpMock(...args) };
});

import { resolveMediaInfo } from "../lib/extractor";
import { ExtractionError } from "../lib/ytdlp";

function dump(formats: unknown[]) {
  return JSON.stringify({
    id: "123",
    title: "Video TikTok",
    thumbnail: null,
    duration: 10,
    formats,
  });
}

beforeEach(() => runYtDlpMock.mockReset());

describe("resolveMediaInfo sin marca (TikTok)", () => {
  it("lista solo la variante limpia y la etiqueta como sin marca", async () => {
    runYtDlpMock.mockResolvedValue({
      stdout: dump([
        {
          format_id: "download_addr",
          acodec: "aac",
          vcodec: "h264",
          ext: "mp4",
          height: 720,
          tbr: 800,
          format_note: "Download video, watermarked",
        },
        {
          format_id: "h264_720p_1000",
          acodec: "aac",
          vcodec: "h264",
          ext: "mp4",
          height: 720,
          tbr: 1000,
          format_note: "Direct video",
        },
      ]),
      stderr: "",
    });

    const info = await resolveMediaInfo("https://www.tiktok.com/@u/video/123");
    expect(info.platform).toBe("tiktok");
    expect(info.formats).toHaveLength(1);
    expect(info.formats[0].label).toContain("Sin marca de agua");
  });

  it("lanza SIN_MARCA_NO_DISPONIBLE cuando solo hay variante marcada", async () => {
    runYtDlpMock.mockResolvedValue({
      stdout: dump([
        {
          format_id: "download_addr",
          acodec: "aac",
          vcodec: "h264",
          ext: "mp4",
          height: 720,
          format_note: "Download video, watermarked",
        },
      ]),
      stderr: "",
    });

    const error = await resolveMediaInfo("https://www.tiktok.com/@u/video/123").catch((e) => e);
    expect(error).toBeInstanceOf(ExtractionError);
    expect((error as ExtractionError).code).toBe("SIN_MARCA_NO_DISPONIBLE");
  });
});
