import Link from "next/link";

type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <main className="min-h-screen bg-[#f7faf8] text-neutral-950">
      <header className="border-b border-teal-100 bg-white/90 px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/" className="focus-ring font-serif text-xl font-black tracking-tight text-teal-950 sm:text-2xl">ELYON BARBER ESTUDIO</Link>
          <Link href="/" className="focus-ring rounded-full border border-teal-100 px-4 py-2 text-sm font-bold text-teal-950 transition hover:bg-teal-50">Volver al inicio</Link>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="rounded-[2rem] border border-teal-100 bg-white p-6 shadow-sm shadow-teal-950/5 sm:p-10 lg:p-14">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-950">ELYON BARBER ESTUDIO</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">{intro}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">Última actualización: 11 de agosto de 2026</p>
          <div className="mt-10 space-y-9 sm:mt-12 sm:space-y-11">
            {sections.map((section, index) => (
              <section key={section.title} className="border-t border-neutral-100 pt-8 sm:pt-10">
                <h2 className="font-serif text-2xl font-bold text-neutral-950 sm:text-3xl">{index + 1}. {section.title}</h2>
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
      <footer className="border-t border-teal-100 bg-white px-4 py-7 text-center text-xs font-semibold tracking-wide text-neutral-400">© ELYON BARBER ESTUDIO — TODOS LOS DERECHOS RESERVADOS</footer>
    </main>
  );
}
