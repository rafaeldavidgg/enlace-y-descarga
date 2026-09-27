#!/usr/bin/env node
/**
 * Descarga el binario de yt-dlp correspondiente al sistema operativo actual
 * y lo deja en el directorio `bin/` del proyecto.
 *
 * Se ejecuta automaticamente con `predev` y `prebuild`, de modo que una
 * instalacion limpia (`npm install` + `npm run dev`) deja el binario listo
 * sin pasos manuales, tanto en local como durante el build en Vercel.
 *
 * El binario se descarga directamente desde el repositorio oficial de yt-dlp
 * en GitHub.
 */

import { createWriteStream } from "node:fs";
import { chmod, mkdir, rm, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = path.join(projectRoot, "bin");

const RELEASE_BASE = "https://github.com/yt-dlp/yt-dlp/releases/latest/download";

/**
 * Devuelve el nombre del asset de yt-dlp para la plataforma dada.
 * @param {NodeJS.Platform} platform
 * @param {NodeJS.Architecture} arch
 * @returns {{ asset: string, binaryName: string }}
 */
function resolveAsset(platform, arch) {
  const isMusl = () => {
    try {
      // En Alpine Linux (usado por algunas imagenes de build) musl es la libc.
      const report = process.report?.getReport?.();
      return Boolean(report && report.header && report.header.glibcVersionRuntime === undefined);
    } catch {
      return false;
    }
  };

  switch (platform) {
    case "win32": {
      if (arch === "arm64") {
        return { asset: "yt-dlp_arm64.exe", binaryName: "yt-dlp.exe" };
      }
      return { asset: "yt-dlp.exe", binaryName: "yt-dlp.exe" };
    }
    case "darwin": {
      return { asset: "yt-dlp_macos", binaryName: "yt-dlp" };
    }
    case "linux": {
      if (arch === "arm64") {
        return {
          asset: isMusl() ? "yt-dlp_musllinux_aarch64" : "yt-dlp_linux_aarch64",
          binaryName: "yt-dlp",
        };
      }
      return {
        asset: isMusl() ? "yt-dlp_musllinux" : "yt-dlp_linux",
        binaryName: "yt-dlp",
      };
    }
    default:
      throw new Error(
        `Plataforma no soportada para yt-dlp: ${platform} (${arch}). ` +
          "Descarga el binario manualmente desde https://github.com/yt-dlp/yt-dlp/releases " +
          "y colocalo en bin/.",
      );
  }
}

async function download(url, destination) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar ${url} (HTTP ${response.status})`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
}

async function main() {
  const { asset, binaryName } = resolveAsset(process.platform, process.arch);
  const binaryPath = path.join(binDir, binaryName);

  await mkdir(binDir, { recursive: true });

  // Permite saltarse la descarga cuando el binario ya existe (util en CI y para
  // no golpear GitHub en cada `npm run dev`).
  const force = process.env.YTDLP_FORCE_DOWNLOAD === "1";
  if (!force) {
    try {
      await stat(binaryPath);
      console.log(`[fetch-ytdlp] El binario ya existe en ${binaryPath}; se omite la descarga.`);
      return;
    } catch {
      // No existe: se descarga.
    }
  }

  const url = `${RELEASE_BASE}/${asset}`;
  const tmpPath = `${binaryPath}.download`;

  console.log(`[fetch-ytdlp] Descargando ${asset} para ${process.platform}/${process.arch}...`);

  try {
    await download(url, tmpPath);
    await rm(binaryPath, { force: true });
    const { rename } = await import("node:fs/promises");
    await rename(tmpPath, binaryPath);
    if (process.platform !== "win32") {
      await chmod(binaryPath, 0o755);
    }
    console.log(`[fetch-ytdlp] Listo: ${binaryPath}`);
  } catch (error) {
    await rm(tmpPath, { force: true });
    console.error(`[fetch-ytdlp] Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await main();
