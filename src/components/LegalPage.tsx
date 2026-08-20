import Link from "next/link";
import { BrandMark } from "./ui";

type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <main className="app-shell">
      <header className="border-b border-[#dce9e5] bg-white/88 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="page-container flex items-center justify-between gap-4">
          <Link href="/" className="focus-ring"><BrandMark /></Link>
          <Link href="/" className="focus-ring rounded-lg border border-[#dce9e5] px-4 py-2 text-sm font-bold text-teal-950 transition hover:bg-[#eef5f3]">Volver</Link>
        </div>
      </header>
      <article className="page-container max-w-4xl py-10 sm:py-14 lg:py-18">
        <div className="panel-surface p-6 sm:p-10 lg:p-12">
          <p className="eyebrow">ELYON BARBER ESTUDIO</p>
          <h1 className="display-title mt-4 max-w-3xl">{title}</h1>
          <p className="body-copy mt-6 max-w-3xl">{intro}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Última actualización: 11 de agosto de 2026</p>
          <div className="mt-10 space-y-9 sm:mt-12">
            {sections.map((section, index) => (
              <section key={section.title} className="border-t border-neutral-100 pt-8 sm:pt-10">
                <h2 className="section-title text-[clamp(1.35rem,1.12rem+.7vw,2rem)]">{index + 1}. {section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">{paragraph}</p>)}
                {section.bullets && <ul className="mt-4 space-y-3 pl-5 text-sm leading-7 text-neutral-600 sm:text-base">{section.bullets.map((bullet) => <li key={bullet} className="list-disc">{bullet}</li>)}</ul>}
              </section>
            ))}
          </div>
          <div className="mt-12 border-t border-neutral-100 pt-8 text-sm leading-7 text-neutral-500">
            Estas páginas tienen carácter informativo y describen las reglas de uso del sitio y del sistema de reservas. No constituyen asesoría jurídica.
          </div>
        </div>
      </article>
      <footer className="border-t border-[#dce9e5] bg-white px-4 py-7 text-center text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">© ELYON BARBER ESTUDIO. TODOS LOS DERECHOS RESERVADOS</footer>
    </main>
  );
}
