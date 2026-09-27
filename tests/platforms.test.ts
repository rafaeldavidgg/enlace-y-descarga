import { describe, expect, it } from "vitest";
import { validateLink, platformLabel } from "../lib/platforms";

describe("validateLink", () => {
  it("acepta un enlace de TikTok", () => {
    const result = validateLink("https://www.tiktok.com/@user/video/1234567890");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.platform).toBe("tiktok");
  });

  it("acepta el dominio corto de TikTok", () => {
    const result = validateLink("https://vm.tiktok.com/abc123/");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.platform).toBe("tiktok");
  });

  it("acepta un enlace de X", () => {
    const result = validateLink("https://x.com/user/status/1234567890");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.platform).toBe("twitter");
  });

  it("acepta un enlace de Twitter", () => {
    const result = validateLink("https://twitter.com/user/status/1234567890");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.platform).toBe("twitter");
  });

  it("rechaza Instagram como plataforma no soportada", () => {
    const result = validateLink("https://www.instagram.com/reel/abc123/");
    expect(result).toEqual({ ok: false, reason: "no_soportado" });
  });

  it("rechaza YouTube como plataforma no soportada", () => {
    expect(validateLink("https://www.youtube.com/watch?v=abc")).toEqual({
      ok: false,
      reason: "no_soportado",
    });
    expect(validateLink("https://youtu.be/abc")).toEqual({ ok: false, reason: "no_soportado" });
  });

  it("rechaza un dominio desconocido", () => {
    expect(validateLink("https://example.com/video/1")).toEqual({
      ok: false,
      reason: "no_soportado",
    });
  });

  it("rechaza una entrada vacia", () => {
    expect(validateLink("   ")).toEqual({ ok: false, reason: "vacio" });
    expect(validateLink(null)).toEqual({ ok: false, reason: "vacio" });
  });

  it("rechaza una entrada malformada", () => {
    expect(validateLink("esto no es una url")).toEqual({ ok: false, reason: "malformado" });
    expect(validateLink("ftp://tiktok.com/x")).toEqual({ ok: false, reason: "malformado" });
  });

  it("no acepta un dominio que solo contiene el nombre como subcadena", () => {
    // tiktok.com.evil.example no debe pasar
    expect(validateLink("https://tiktok.com.evil.example/x")).toEqual({
      ok: false,
      reason: "no_soportado",
    });
  });
});

describe("platformLabel", () => {
  it("devuelve etiquetas legibles", () => {
    expect(platformLabel("tiktok")).toBe("TikTok");
    expect(platformLabel("twitter")).toBe("X (Twitter)");
  });
});
