"use client";

import { useEffect } from "react";

const href = "/admin/versiculos";

function addLinks() {
  document.querySelectorAll<HTMLElement>("aside nav").forEach((nav) => {
    if (nav.querySelector(`a[href="${href}"]`)) return;
    const link = document.createElement("a");
    link.href = href;
    link.setAttribute("data-admin-verse-link", "true");
    link.className = "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-neutral-600 transition hover:bg-teal-50 hover:text-teal-950";
    link.innerHTML = '<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-[10px] group-hover:bg-white">07</span><span>Versículos</span>';
    link.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("elyon-admin-close-mobile"));
    });
    nav.appendChild(link);
  });
}

export function AdminVerseNavItem() {
  useEffect(() => {
    addLinks();
    const observer = new MutationObserver(addLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
