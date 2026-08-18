"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AdminVerseSidebarLink() {
  const pathname = usePathname();

  useEffect(() => {
    const links: HTMLAnchorElement[] = [];
    const sync = () => {
      document.querySelectorAll("aside nav").forEach((nav) => {
        if (!nav.querySelector('a[href="/admin/configuracion"]')) return;
        let link = nav.querySelector<HTMLAnchorElement>('a[data-admin-verses-link="true"]');
        if (!link) {
          link = document.createElement("a");
          link.href = "/admin/versiculos";
          link.dataset.adminVersesLink = "true";
          link.className = "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition text-neutral-600 hover:bg-teal-50 hover:text-teal-950";
          link.innerHTML = '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-[10px] group-hover:bg-white">07</span><span class="min-w-0 text-left">Versículos</span>';
          nav.appendChild(link);
          links.push(link);
        }
        const active = pathname === "/admin/versiculos";
        link.classList.toggle("bg-teal-950", active);
        link.classList.toggle("text-white", active);
        link.classList.toggle("shadow-sm", active);
        link.classList.toggle("text-neutral-600", !active);
      });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); links.forEach((link) => link.remove()); };
  }, [pathname]);

  return null;
}