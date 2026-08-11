import Link from "next/link";
import { ReactNode } from "react";

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return <div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-full border ${dark ? "border-white/20 bg-white" : "border-teal-100 bg-teal-50"} text-[11px] font-black ${dark ? "text-teal-950" : "text-teal-950"}`}>EB</div><div><p className="text-sm font-black tracking-[0.18em] text-current">ELYON BARBER</p><p className="text-xs text-neutral-500">Reservas premium</p></div></div>;
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "dark" }) {
  const variants = { primary: "bg-teal-950 text-white hover:bg-teal-900", ghost: "border border-teal-100 bg-white text-teal-950 hover:border-teal-950 hover:bg-teal-50", dark: "bg-neutral-950 text-white hover:bg-neutral-800" };
  return <button className={`focus-ring min-h-12 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 disabled:shadow-none disabled:hover:translate-y-0 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-sm shadow-teal-950/5 sm:p-6 ${className}`}>{children}</section>; }
export function DarkPanel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl border border-teal-100 bg-white p-4 text-neutral-950 shadow-sm shadow-teal-950/5 sm:p-6 ${className}`}>{children}</section>; }
export function AdminLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) { return <Link className="rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-teal-50 hover:text-teal-950" href={href} onClick={onClick}>{children}</Link>; }
export function StatusPill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "red" | "gray" }) { const tones = { gold: "bg-teal-50 text-teal-950", green: "bg-emerald-100 text-emerald-800", red: "bg-red-100 text-red-800", gray: "bg-neutral-100 text-neutral-700" }; return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>; }

export function PublicFooter() {
  return <footer className="border-t border-teal-100 bg-white px-4 py-10 sm:px-6"><div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-[1.4fr_1fr] sm:items-start"><div><BrandMark /><p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">Una experiencia de barbería pensada para que reserves tu próxima visita de forma simple y cómoda.</p></div><div><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-950">Información</p><nav className="mt-3 grid gap-2"><Link className="w-fit text-sm font-semibold text-neutral-600 transition hover:text-teal-950" href="/politicas-de-uso">Política de privacidad</Link><Link className="w-fit text-sm font-semibold text-neutral-600 transition hover:text-teal-950" href="/terminos-y-condiciones">Condiciones de servicio</Link></nav></div></div><div className="mx-auto mt-8 max-w-6xl border-t border-neutral-100 pt-5 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">© 2026 ELYON BARBER. Todos los derechos reservados.</div></footer>;
}
