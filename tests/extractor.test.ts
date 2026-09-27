import { describe, expect, it } from "vitest";
import {
  encodeFormatRef,
  decodeFormatRef,
  resolveFormatExt,
  selectCombinedFormats,
  formatLabel,
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
