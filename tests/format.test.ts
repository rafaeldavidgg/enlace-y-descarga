import { describe, expect, it } from "vitest";
import { formatDuration, formatBytes, pickDefaultFormat } from "../lib/format";

describe("formatDuration", () => {
  it("formatea minutos y segundos", () => {
    expect(formatDuration(10)).toBe("0:10");
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formatea horas", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });

  it("devuelve null cuando no hay dato", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(-1)).toBeNull();
  });
});

describe("formatBytes", () => {
  it("formatea tamanos legibles", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });

  it("devuelve null cuando no hay dato", () => {
    expect(formatBytes(null)).toBeNull();
    expect(formatBytes(0)).toBeNull();
  });
});

describe("pickDefaultFormat", () => {
  it("preselecciona el formato de mayor resolucion con audio", () => {
    const formats = [
      { ref: "a", height: 720, approxBytes: 1000 },
      { ref: "b", height: 1080, approxBytes: 900 },
      { ref: "c", height: 1080, approxBytes: 2000 },
    ];
    expect(pickDefaultFormat(formats)?.ref).toBe("c");
  });

  it("devuelve null si no hay formatos", () => {
    expect(pickDefaultFormat([])).toBeNull();
  });
});
