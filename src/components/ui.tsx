"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const SOCIAL_LINKS = { instagram: "#", whatsapp: "#" };

export function BrandMark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-current">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[11px] font-black ${dark ? "border-white/20 bg-white text-teal-950" : "border-teal-100 bg-[#eef5f3] text-teal-950"}`}>
        EB
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-current">Elyon Barber</p>
        <p className={`mt-0.5 text-[11px] font-semibold ${dark ? "text-white/58" : "text-neutral-500"}`}>Studio de reservas</p>
      </div>
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "dark" }) {
  const variants = {
    primary: "border-teal-950 bg-teal-950 text-white hover:bg-[#123f3d] focus-visible:outline-teal-950",
    ghost: "border-[#dce9e5] bg-white text-teal-950 hover:border-teal-950 hover:bg-[#eef5f3]",
    dark: "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800",
  };

  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-bold leading-none transition duration-200 active:scale-[.99] disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel-surface p-4 text-neutral-950 sm:p-6 ${className}`}>{children}</section>;
}

export function DarkPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel-surface p-4 text-neutral-950 sm:p-6 lg:p-7 ${className}`}>{children}</section>;
}

export function AdminLink({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link className="focus-ring rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-[#eef5f3] hover:text-teal-950" href={href} onClick={onClick}>
      {children}
    </Link>
  );
}

export function StatusPill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "red" | "gray" }) {
  const tones = {
    gold: "border-amber-200 bg-amber-50 text-amber-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
    gray: "border-neutral-200 bg-neutral-100 text-neutral-700",
  };
  return <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-black leading-none ${tones[tone]}`}>{children}</span>;
}

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path d="M20.2 11.5a8.2 8.2 0 0 1-12.1 7.2L4 20l1.3-3.8A8.2 8.2 0 1 1 20.2 11.5Z" /><path d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.5c.1.2.1.4-.1.6l-.6.7c-.1.1-.1.3 0 .4.5.9 1.3 1.6 2.2 2.1.2.1.3.1.4-.1l.7-.8c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.3.3.5 0 .7-.3 1.2-.8 1.4-.5.2-1.1.1-1.7-.1-2.8-1-4.8-3-5.8-5.8-.2-.6-.2-1.2.1-1.9Z" /></svg>;
}

export function PublicFooter() {
  const [verse, setVerse] = useState<{ text: string; reference: string; translation?: string } | null>(null);

  useEffect(() => {
    fetch("/api/public/verse", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setVerse(data.verse ?? null))
      .catch(() => setVerse(null));
  }, []);

  return (
    <footer className="border-t border-[#dce9e5] bg-white px-4 py-10 sm:px-6 sm:py-12">
      <div className="page-container grid gap-9 lg:grid-cols-[1.15fr_.8fr_1fr] lg:gap-12">
        <div>
          <BrandMark />
          <p className="mt-5 max-w-md text-sm leading-7 text-neutral-500">
            Una experiencia de barbería ordenada, simple y pensada para reservar sin fricción.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram de ELYON BARBER" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#dce9e5] bg-white px-3.5 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-teal-950 hover:bg-[#eef5f3] hover:text-teal-950">
              <InstagramIcon /> Instagram
            </a>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp de ELYON BARBER" className="focus-ring inline-flex items-center gap-2 rounded-lg border border-[#dce9e5] bg-white px-3.5 py-2.5 text-sm font-bold text-neutral-700 transition hover:border-teal-950 hover:bg-[#eef5f3] hover:text-teal-950">
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
        </div>
        <div>
          <p className="eyebrow text-neutral-500">Información</p>
          <nav className="mt-4 grid gap-3">
            <Link className="w-fit text-sm font-semibold text-neutral-600 transition hover:text-teal-950" href="/politicas-de-uso">Política de privacidad</Link>
            <Link className="w-fit text-sm font-semibold text-neutral-600 transition hover:text-teal-950" href="/terminos-y-condiciones">Condiciones de servicio</Link>
          </nav>
        </div>
        {verse && (
          <div className="border-t border-[#edf3f1] pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="eyebrow text-neutral-400">Una palabra de esperanza</p>
            <blockquote className="mt-3 max-w-sm font-display text-base font-semibold leading-7 text-neutral-700">
              “{verse.text}”
            </blockquote>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              {verse.reference}{verse.translation ? ` · ${verse.translation}` : ""}
            </p>
          </div>
        )}
      </div>
      <div className="page-container mt-9 border-t border-[#edf3f1] pt-5 text-center text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">
        © 2026 ELYON BARBER. Todos los derechos reservados.
      </div>
    </footer>
  );
}
