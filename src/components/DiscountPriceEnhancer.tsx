"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/format";

type Service = { id: string; name: string; price: number; original_price: number; discount_active: boolean };

export function DiscountPriceEnhancer() {
  useEffect(() => {
    if (!window.location.pathname.startsWith("/reservar/")) return;
    let cancelled = false;
    let services: Service[] = [];

    const apply = () => {
      if (cancelled || !services.length) return;
      document.querySelectorAll("article").forEach((article) => {
        const title = article.querySelector("h3")?.textContent?.trim();
        if (!title) return;
        const service = services.find((item) => item.name === title);
        if (!service) return;
        const priceElement = Array.from(article.querySelectorAll("p")).find((element) => element.dataset.discountEnhanced === "true")
          ?? Array.from(article.querySelectorAll("p")).find((element) => element.textContent?.trim() === formatPrice(service.price));
        if (!priceElement) return;
        if (service.discount_active && service.original_price > service.price) {
          priceElement.dataset.discountEnhanced = "true";
          priceElement.className = "shrink-0 flex items-baseline gap-2 text-sm font-black";
          priceElement.innerHTML = `<span class="text-xs font-semibold text-neutral-400 line-through">${formatPrice(service.original_price)}</span><span class="text-sm font-black text-red-600">${formatPrice(service.price)}</span>`;
        } else if (priceElement.dataset.discountEnhanced === "true") {
          delete priceElement.dataset.discountEnhanced;
          priceElement.className = "shrink-0 text-sm font-black text-teal-950";
          priceElement.textContent = formatPrice(service.price);
        }
      });
    };

    const refresh = () => fetch("/api/public/config", { cache: "no-store" }).then((response) => response.json()).then((data) => { if (!cancelled) { services = data.services ?? []; apply(); } }).catch(() => undefined);
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 15000);
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { cancelled = true; window.clearInterval(interval); observer.disconnect(); };
  }, []);

  return null;
}