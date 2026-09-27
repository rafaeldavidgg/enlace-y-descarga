import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

/**
 * Arranca el proceso de descarga de yt-dlp escribiendo el archivo a stdout.
 *
 * Se aísla aquí para poder sustituirlo en pruebas sin tocar la ruta HTTP, y
 * para garantizar que siempre se invoca sin shell (evita interpolar la URL en
 * una línea de comandos).
 */
export function spawnDownloadProcess(
  binary: string,
  formatId: string,
  url: string,
): ChildProcessWithoutNullStreams {
  return spawn(
    // turbopackIgnore evita que el analizador estático trace todo el proyecto en
    // el paquete de la función. El binario está en `bin/`, resuelto en runtime.
    /* turbopackIgnore: true */
    binary,
    ["-f", formatId, "--no-playlist", "-o", "-", url],
    {
      windowsHide: true,
      shell: false,
    },
  ) as ChildProcessWithoutNullStreams;
}
