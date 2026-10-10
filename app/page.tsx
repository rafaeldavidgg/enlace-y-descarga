import Downloader from "@/components/Downloader";

const MAX_TRANSFER_NOTE =
  "el plan gratuito de Vercel incluye unos 100 GB de transferencia al mes.";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl min-w-0 flex-1 flex-col gap-6 px-4 py-8 sm:gap-8 sm:py-12">
      <header className="min-w-0">
        <h1 className="text-balance text-[28px] leading-[1.15] font-bold tracking-tight sm:text-4xl">
          Enlace y Descarga
        </h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-foreground/70">
          Pega un enlace de <strong className="font-semibold text-foreground">TikTok</strong> o{" "}
          <strong className="font-semibold text-foreground">X (Twitter)</strong> y descarga el
          video con audio desde cualquier dispositivo. Sin cuentas, sin anuncios y sin instalar
          nada. Los videos de TikTok se descargan{" "}
          <strong className="font-semibold text-foreground">sin marca de agua</strong> (ni la
          móvil durante el video ni la del final).
        </p>
      </header>

      <Downloader />

      <section
        aria-label="Aviso de uso responsable"
        className="min-w-0 rounded-card border border-border bg-sunken px-4 py-3 text-sm leading-relaxed text-foreground/80"
      >
        <h2 className="text-sm font-semibold text-foreground">Aviso de uso responsable</h2>
        <p className="mt-1">
          Esta herramienta es para uso personal. Eres responsable de respetar los términos de
          servicio y los derechos de autor de cada plataforma: descarga únicamente contenido que
          tengas derecho a usar y no lo redistribuyas sin permiso.
        </p>
        <p className="mt-2 text-foreground/70">
          Plataformas soportadas: TikTok (sin marca de agua) y X (Twitter). Instagram y YouTube
          no están soportados por ahora. Con enlaces de X, solo funciona si el tweet incluye un
          video. Si un TikTok no tiene variante sin marca disponible, la app lo informa en lugar
          de descargar la versión marcada.
        </p>
        <p className="mt-2 text-foreground/70">
          Límite conocido: {MAX_TRANSFER_NOTE} Las descargas muy largas pueden cortarse.
        </p>
      </section>
    </main>
  );
}
