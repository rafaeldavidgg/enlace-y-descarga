import { describe, expect, it } from "vitest";
import { buildFileName, contentDisposition } from "../app/api/download/route";

describe("buildFileName", () => {
  it("usa el titulo y una extension coherente", () => {
    expect(buildFileName("Mi video", "mp4")).toBe("Mi video.mp4");
    expect(buildFileName("Mi video", "webm")).toBe("Mi video.webm");
  });

  it("propone un nombre generico valido cuando falta el titulo", () => {
    expect(buildFileName(null, "mp4")).toBe("video.mp4");
    expect(buildFileName("   ", "mp4")).toBe("video.mp4");
  });

  it("sanea caracteres invalidos para el sistema de archivos", () => {
    expect(buildFileName('a/b\\c:d*e?f"g<h>i|j', "mp4")).toBe("abcdefghij.mp4");
  });

  it("normaliza espacios y acota la longitud", () => {
    expect(buildFileName("  muchos    espacios  ", "mp4")).toBe("muchos espacios.mp4");
    expect(buildFileName("x".repeat(300), "mp4").length).toBeLessThanOrEqual("video.mp4".length + 120);
  });

  it("cae a mp4 ante una extension desconocida", () => {
    expect(buildFileName("t", "exe")).toBe("t.mp4");
    expect(buildFileName("t", "../../etc/passwd")).toBe("t.mp4");
  });
});

describe("contentDisposition", () => {
  it("incluye un nombre ASCII y uno codificado en UTF-8", () => {
    const header = contentDisposition("vídeo.mp4");
    expect(header.startsWith("attachment;")).toBe(true);
    expect(header).toContain('filename="v_deo.mp4"');
    expect(header).toContain("filename*=UTF-8''v%C3%ADdeo.mp4");
  });

  it("fuerza la descarga en lugar de la reproduccion", () => {
    expect(contentDisposition("x.mp4")).toMatch(/^attachment;/);
  });
});
