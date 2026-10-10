import { describe, expect, it } from "vitest";
import {
  encodeFormatRef,
  decodeFormatRef,
  resolveFormatExt,
  selectCombinedFormats,
  formatLabel,
  isTikTokWatermarked,
} from "../lib/extractor";
import { classifyYtDlpError } from "../lib/ytdlp";

describe("selectCombinedFormats", () => {
  it("conserva los formatos con audio y video juntos", () => {
    const formats = [
      { format_id: "a", acodec: "aac", vcodec: "h264", ext: "mp4", height: 720 },
      { format_id: "b", acodec: "none", vcodec: "h264", ext: "mp4", height: 1080 },
      { format_id: "c", acodec: "aac", vcodec: "none", ext: "m4a", height: null },
    ];
    const combined = selectCombinedFormats(formats);
    expect(combined.map((f) => f.format_id)).toEqual(["a"]);
  });

  it("excluye los formatos con pistas separadas", () => {
    const formats = [
      { format_id: "v", acodec: "none", vcodec: "av01", ext: "mp4", height: 2160 },
      { format_id: "a", acodec: "opus", vcodec: "none", ext: "webm", height: null },
    ];
    expect(selectCombinedFormats(formats)).toHaveLength(0);
  });

  it("descarta formatos sin identificador", () => {
    expect(selectCombinedFormats([{ acodec: "aac", vcodec: "h264" }])).toHaveLength(0);
  });

  it("colapsa el mismo archivo listado dos veces por yt-dlp", () => {
    const formats = [
      {
        format_id: "h264_540p_377700-0",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 1024,
        filesize: 1159730,
      },
      {
        format_id: "h264_540p_377700-1",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 1024,
        filesize: 1159730,
      },
    ];
    const combined = selectCombinedFormats(formats);
    expect(combined.map((f) => f.format_id)).toEqual(["h264_540p_377700-0"]);
  });

  it("conserva formatos distintos con la misma resolucion", () => {
    const formats = [
      { format_id: "h264-0", acodec: "aac", vcodec: "h264", ext: "mp4", height: 576, tbr: 500 },
      { format_id: "h264-1", acodec: "aac", vcodec: "h264", ext: "mp4", height: 576, tbr: 900 },
      { format_id: "h265-0", acodec: "aac", vcodec: "h265", ext: "mp4", height: 576, tbr: 500 },
    ];
    const combined = selectCombinedFormats(formats);
    expect(combined.map((f) => f.format_id)).toEqual(["h264-0", "h264-1", "h265-0"]);
  });

  it("descarta los manifiestos HLS/DASH aunque tengan audio y video", () => {
    const formats = [
      {
        format_id: "hls-720",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 720,
        protocol: "m3u8_native",
      },
      {
        format_id: "dash-720",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 720,
        protocol: "http_dash_segments",
      },
      {
        format_id: "http-720",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 720,
        protocol: "https",
      },
    ];
    const combined = selectCombinedFormats(formats);
    expect(combined.map((f) => f.format_id)).toEqual(["http-720"]);
  });

  it("incluye los MP4 progresivos de X sin codecs cuando se permite asumirlos", () => {
    // yt-dlp lista los http-* de X sin acodec/vcodec aunque el archivo es muxed.
    const formats = [
      {
        format_id: "hls-audio-128000-Audio",
        vcodec: "none",
        ext: "mp4",
        protocol: "m3u8_native",
      },
      {
        format_id: "hls-702",
        acodec: "none",
        vcodec: "avc1.640020",
        ext: "mp4",
        height: 720,
        protocol: "m3u8_native",
      },
      { format_id: "http-432", ext: "mp4", height: 320, tbr: 432, protocol: "https" },
      { format_id: "http-1280", ext: "mp4", height: 720, tbr: 1280, protocol: "https" },
    ];
    const combined = selectCombinedFormats(formats, { assumeMuxedWhenCodecsUnknown: true });
    expect(combined.map((f) => f.format_id)).toEqual(["http-432", "http-1280"]);
  });

  it("excluye los formatos sin codecs cuando no se permite asumirlos", () => {
    const formats = [{ format_id: "http-1280", ext: "mp4", height: 720, protocol: "https" }];
    expect(selectCombinedFormats(formats)).toHaveLength(0);
  });

  it("no asume combinado si solo falta uno de los dos codecs", () => {
    const formats = [
      { format_id: "audio", vcodec: "none", ext: "mp4", protocol: "https" },
      { format_id: "video", acodec: "none", ext: "mp4", protocol: "https" },
    ];
    expect(
      selectCombinedFormats(formats, { assumeMuxedWhenCodecsUnknown: true }),
    ).toHaveLength(0);
  });
});

describe("formatLabel", () => {
  it("incluye resolucion y extension", () => {
    expect(formatLabel({ ext: "mp4", height: 720 })).toBe("720p (mp4)");
  });

  it("incluye fps cuando es alta", () => {
    expect(formatLabel({ ext: "mp4", height: 1080, fps: 60 })).toBe("1080p 60fps (mp4)");
  });

  it("funciona sin resolucion", () => {
    expect(formatLabel({ ext: "mp4", height: null })).toBe("Video (mp4)");
  });
});

describe("referencias opacas firmadas", () => {
  it("codifica y decodifica un formato", () => {
    const ref = encodeFormatRef("https://www.tiktok.com/@u/video/1", "h264_540p", "Mi video", "mp4");
    const decoded = decodeFormatRef(ref);
    expect(decoded).toEqual({
      u: "https://www.tiktok.com/@u/video/1",
      f: "h264_540p",
      t: "Mi video",
      e: "mp4",
    });
  });

  it("no expone la URL de origen en texto plano", () => {
    const url = "https://www.tiktok.com/@usuario/video/7300000000000000000";
    const ref = encodeFormatRef(url, "f1", "titulo", "mp4");
    expect(ref).not.toContain(url);
    expect(ref).not.toContain("tiktok.com");
  });

  it("rechaza una referencia manipulada", () => {
    const ref = encodeFormatRef("https://www.tiktok.com/x", "f1", "t", "mp4");
    const [body] = ref.split(".");
    expect(decodeFormatRef(`${body}.firmainvalida`)).toBeNull();
  });

  it("rechaza una referencia con payload alterado", () => {
    const ref = encodeFormatRef("https://www.tiktok.com/x", "f1", "t", "mp4");
    const tampered = Buffer.from(
      JSON.stringify({ u: "https://evil.example/x", f: "f1", t: "t", e: "mp4" }),
      "utf8",
    ).toString("base64url");
    const signature = ref.split(".").at(-1);
    expect(decodeFormatRef(`${tampered}.${signature}`)).toBeNull();
  });

  it("rechaza una referencia vacia o malformada", () => {
    expect(decodeFormatRef("")).toBeNull();
    expect(decodeFormatRef("sinpunto")).toBeNull();
    expect(decodeFormatRef(".solo")).toBeNull();
  });
});

describe("resolveFormatExt", () => {
  it("devuelve la extension almacenada en la referencia", () => {
    const ref = encodeFormatRef("https://www.tiktok.com/x", "f1", "t", "webm");
    expect(resolveFormatExt(ref)).toBe("webm");
  });

  it("cae a mp4 cuando la referencia es invalida", () => {
    expect(resolveFormatExt("invalida")).toBe("mp4");
  });
});

describe("classifyYtDlpError", () => {
  it("clasifica contenido que requiere autenticacion", () => {
    expect(classifyYtDlpError("ERROR: Sign in to confirm you are not a bot")).toBe(
      "REQUIERE_AUTENTICACION",
    );
  });

  it("clasifica contenido privado o eliminado", () => {
    expect(classifyYtDlpError("ERROR: Video unavailable")).toBe("CONTENIDO_PRIVADO");
    expect(classifyYtDlpError("ERROR: This video has been removed")).toBe("CONTENIDO_PRIVADO");
  });

  it("clasifica formato no disponible antes que privado", () => {
    expect(classifyYtDlpError("ERROR: Requested format is not available")).toBe(
      "FORMATO_NO_DISPONIBLE",
    );
  });

  it("clasifica plataforma no soportada", () => {
    expect(classifyYtDlpError("ERROR: Unsupported URL: https://example.com/x")).toBe(
      "PLATAFORMA_NO_SOPORTADA",
    );
  });

  it("clasifica un fallo generico", () => {
    expect(classifyYtDlpError("ERROR: algo raro paso")).toBe("FALLO_EXTRACCION");
  });
});

describe("isTikTokWatermarked", () => {
  it("marca la variante download_addr con nota de marca", () => {
    expect(
      isTikTokWatermarked({ format_id: "download_addr", format_note: "Download video, watermarked" }),
    ).toBe(true);
  });

  it("marca el formato web download con nota watermarked", () => {
    expect(isTikTokWatermarked({ format_id: "download", format_note: "watermarked" })).toBe(true);
  });

  it("marca el formato web download aunque falte la nota", () => {
    expect(isTikTokWatermarked({ format_id: "download" })).toBe(true);
  });

  it("no marca las variantes limpias (Direct/Playback/Download sin sufijo)", () => {
    expect(isTikTokWatermarked({ format_id: "play_addr", format_note: "Direct video" })).toBe(false);
    expect(
      isTikTokWatermarked({ format_id: "h264_720p_1234", format_note: "Playback video" }),
    ).toBe(false);
    expect(
      isTikTokWatermarked({ format_id: "download_addr", format_note: "Download video" }),
    ).toBe(false);
    expect(isTikTokWatermarked({ format_id: "play" })).toBe(false);
  });

  it("no marca download_addr sin nota (limpio por defecto)", () => {
    expect(isTikTokWatermarked({ format_id: "download_addr" })).toBe(false);
  });
});

describe("selectCombinedFormats sin marca de agua (TikTok)", () => {
  const limpia = {
    format_id: "h264_720p_1000",
    acodec: "aac",
    vcodec: "h264",
    ext: "mp4",
    height: 720,
    tbr: 1000,
    format_note: "Direct video",
  };
  const marcada = {
    format_id: "download_addr",
    acodec: "aac",
    vcodec: "h264",
    ext: "mp4",
    height: 720,
    tbr: 800,
    format_note: "Download video, watermarked",
  };

  it("excluye la variante marcada cuando hay limpia disponible", () => {
    const combined = selectCombinedFormats([limpia, marcada], { platform: "tiktok" });
    expect(combined.map((f) => f.format_id)).toEqual(["h264_720p_1000"]);
  });

  it("devuelve vacio cuando solo hay variante marcada (sin fallback)", () => {
    expect(selectCombinedFormats([marcada], { platform: "tiktok" })).toHaveLength(0);
  });

  it("no colapsa limpia con marcada aunque compartan identidad", () => {
    const gemelas = [
      { ...limpia, filesize: 1000, tbr: 500 },
      { ...marcada, filesize: 1000, tbr: 500, vcodec: "h264", acodec: "aac" },
      {
        format_id: "otra-limpia",
        acodec: "aac",
        vcodec: "h264",
        ext: "mp4",
        height: 720,
        filesize: 1000,
        tbr: 500,
        format_note: "Playback video",
      },
    ];
    const combined = selectCombinedFormats(gemelas, { platform: "tiktok" });
    // La marcada se excluye; las dos limpias con distinta identidad parcial se conservan
    expect(combined.map((f) => f.format_id)).not.toContain("download_addr");
    expect(combined.length).toBeGreaterThan(0);
  });

  it("colapsa duplicados limpios ...-0/...-1 como antes", () => {
    const dupes = [
      { format_id: "h264_540p-0", acodec: "aac", vcodec: "h264", ext: "mp4", height: 576, filesize: 999, format_note: "Direct video" },
      { format_id: "h264_540p-1", acodec: "aac", vcodec: "h264", ext: "mp4", height: 576, filesize: 999, format_note: "Direct video" },
    ];
    expect(selectCombinedFormats(dupes, { platform: "tiktok" }).map((f) => f.format_id)).toEqual([
      "h264_540p-0",
    ]);
  });

  it("no filtra por marca en X (sin platform o twitter)", () => {
    const xMarkedNote = {
      format_id: "http-720",
      ext: "mp4",
      height: 720,
      protocol: "https",
      format_note: "watermarked",
    };
    // Sin platform: comportamiento historico (el filtro solo es TikTok).
    expect(selectCombinedFormats([xMarkedNote])).toHaveLength(0); // sin codecs ni flag X
    expect(
      selectCombinedFormats([xMarkedNote], {
        assumeMuxedWhenCodecsUnknown: true,
        platform: "twitter",
      }).map((f) => f.format_id),
    ).toEqual(["http-720"]);
  });
});

describe("formatLabel sin marca", () => {
  it("anade el sufijo cuando es TikTok limpio", () => {
    expect(formatLabel({ ext: "mp4", height: 720 }, { sinMarca: true })).toBe(
      "720p (mp4) · Sin marca de agua",
    );
  });

  it("no cambia la etiqueta por defecto", () => {
    expect(formatLabel({ ext: "mp4", height: 720 })).toBe("720p (mp4)");
  });
});
