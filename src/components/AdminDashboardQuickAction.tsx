"use client";

import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminDashboardQuickAction() {
  const pathname = usePathname();
  const router = useRouter();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [reviewClicks, setReviewClicks] = useState(0);

  useEffect(() => {
    if (pathname !== "/admin") return;

    let cancelled = false;
    const findTarget = () => {
      const element = Array.from(document.querySelectorAll<HTMLElement>("main div"))
        .find((node) => node.textContent?.trim() === "Resumen del negocio")?.parentElement;
      if (!cancelled && element) {
        element.querySelector("p")?.classList.add("hidden");
        queueMicrotask(() => {
          if (!cancelled) setTarget(element);
        });
      }
    };

    queueMicrotask(findTarget);
    const observer = new MutationObserver(findTarget);
    observer.observe(document.body, { childList: true, subtree: true });

    const loadClicks = async () => {
      try {
        const response = await fetch("/api/admin/review-clicks", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) return;
        if (!cancelled) setReviewClicks(Number(data.totalClicks ?? 0));
      } catch {
        // The dashboard remains usable if the optional counter is unavailable.
      }
    };
    void loadClicks();
    const interval = window.setInterval(loadClicks, 15000);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [pathname]);

  if (pathname !== "/admin" || !target) return null;

  return createPortal(
    <div className="flex min-h-[88px] flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Acción rápida</p>
        <p className="mt-1 font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">Agendar cliente</p>
        <p className="mt-1 text-xs font-semibold text-white/65">Crea una reserva manual sin enviar correos.</p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-center sm:justify-center">
        <button
          type="button"
          onClick={() => router.push("/admin/agendar")}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white px-4 text-sm font-black text-teal-950 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-4 focus:ring-white/20"
        >
          ＋ Agendar cliente
        </button>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/15" aria-label={`${reviewClicks} aperturas de reseñas`}>{reviewClicks}</span>
      </div>
    </div>,
    target,
  );
}
