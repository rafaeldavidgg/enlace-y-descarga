import Downloader from "@/components/Downloader";

const MAX_TRANSFER_NOTE =
  "el plan gratuito de Vercel incluye unos 100 GB de transferencia al mes.";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Enlace y Descarga</h1>
        <p className="mt-2 opacity-80">
          Pega un enlace de <strong>TikTok</strong> o <strong>X (Twitter)</strong> y descarga el
          video con audio desde cualquier dispositivo. Sin cuentas, sin anuncios y sin instalar
          nada.
        </p>
      </header>

      <Downloader />

      <section
        aria-label="Aviso de uso responsable"
        className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed opacity-90 dark:border-white/15 dark:bg-white/[0.03]"
      >
        <h2 className="font-semibold">Aviso de uso responsable</h2>
        <p className="mt-1">
          Esta herramienta es para uso personal. Eres responsable de respetar los términos de
          servicio y los derechos de autor de cada plataforma: descarga únicamente contenido que
          tengas derecho a usar y no lo redistribuyas sin permiso.
        </p>
        <p className="mt-2 opacity-80">
          Plataformas soportadas: TikTok y X (Twitter). Instagram y YouTube no están soportados
          por ahora. Con enlaces de X, solo funciona si el tweet incluye un video.
        </p>
        <p className="mt-2 opacity-80">
          Límite conocido: {MAX_TRANSFER_NOTE} Las descargas muy largas pueden cortarse.
        </p>
      </section>
    </main>
  );
}
