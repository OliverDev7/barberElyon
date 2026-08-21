"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui";

type Review = {
  id: string;
  fullName: string;
  email: string;
  rating: number;
  reviewText: string;
  createdAt: string;
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "correo oculto";
  const visible = name.slice(0, Math.min(3, name.length));
  return `${visible}${"*".repeat(Math.max(4, name.length - visible.length))}@${domain}`;
}

function Stars({ value, interactive = false, onChange }: { value: number; interactive?: boolean; onChange?: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              className={`focus-ring rounded-md px-0.5 text-2xl leading-none transition ${active ? "text-amber-400" : "text-neutral-300 hover:text-amber-300"}`}
              aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
            >
              ★
            </button>
          );
        }
        return <span key={star} className={`text-lg leading-none ${active ? "text-amber-400" : "text-neutral-300"}`}>★</span>;
      })}
    </div>
  );
}

export function ReviewsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", rating: 5, reviewText: "" });

  const roundedAverage = useMemo(() => Math.round(average), [average]);

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/public/reviews", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar las reseñas.");
      setReviews(data.reviews ?? []);
      setAverage(Number(data.average ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las reseñas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadReviews();
  }, [open]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.fullName.trim().length < 3) { setError("Ingresa tu nombre y apellido."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("Ingresa un correo válido."); return; }
    if (form.rating < 1 || form.rating > 5) { setError("Selecciona una calificación entre 1 y 5 estrellas."); return; }
    if (form.reviewText.trim().length < 10) { setError("Escribe una reseña de al menos 10 caracteres."); return; }

    setSubmitting(true);
    try {
      const response = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la reseña.");
      setMessage(data.message ?? "Gracias por compartir tu experiencia.");
      setForm({ fullName: "", email: "", rating: 5, reviewText: "" });
      setShowForm(false);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la reseña.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/50 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Reseñas de clientes"
        className="mx-auto my-2 w-full max-w-5xl overflow-hidden rounded-[20px] bg-[#f7faf8] shadow-2xl sm:my-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#dce9e5] bg-white px-4 py-4 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="eyebrow">Experiencias reales</p>
            <h2 className="section-title mt-1 text-[clamp(1.55rem,1.3rem+1vw,2.4rem)]">Reseñas de clientes</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Stars value={roundedAverage} />
              <span className="text-sm font-bold text-neutral-600">{average ? average.toFixed(1) : "0.0"} / 5 · {reviews.length} reseña{reviews.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-xl font-black text-neutral-600 transition hover:bg-[#eef5f3] hover:text-teal-950" aria-label="Cerrar">×</button>
        </div>

        <div className="grid gap-5 p-4 sm:p-7">
          {error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-[#dce9e5] bg-[#eef5f3] px-4 py-3 text-sm font-bold text-teal-950">{message}</p>}

          {loading ? (
            <div className="grid min-h-40 place-items-center rounded-lg border border-[#dce9e5] bg-white">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-100 border-t-teal-950" />
                <p className="mt-3 text-sm font-bold text-neutral-500">Cargando reseñas...</p>
              </div>
            </div>
          ) : reviews.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-lg border border-[#dce9e5] bg-white p-4 shadow-[0_16px_40px_-34px_rgba(4,47,46,.45)] sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-black text-neutral-950">{review.fullName}</h3>
                      <p className="mt-1 break-all text-xs font-semibold text-neutral-400">{maskEmail(review.email)}</p>
                    </div>
                    <Stars value={review.rating} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-neutral-600">{review.reviewText}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#dce9e5] bg-white p-6 text-center">
              <p className="font-black text-neutral-800">Todavía no hay reseñas.</p>
              <p className="mt-1 text-sm text-neutral-500">Sé la primera persona en compartir tu experiencia.</p>
            </div>
          )}

          {!showForm && <Button className="w-full sm:w-fit" onClick={() => setShowForm(true)}>Dejar mi reseña</Button>}

          {showForm && (
            <form className="grid gap-4 rounded-lg border border-[#dce9e5] bg-white p-4 sm:p-5" onSubmit={submitReview}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-neutral-700">Nombre y apellido<input className="focus-ring min-h-11 rounded-lg border border-[#dce9e5] px-4" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="name" /></label>
                <label className="grid gap-2 text-sm font-bold text-neutral-700">Correo electrónico<input className="focus-ring min-h-11 rounded-lg border border-[#dce9e5] px-4" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" type="email" /></label>
              </div>
              <div className="grid gap-2 text-sm font-bold text-neutral-700">
                Clasificación
                <Stars value={form.rating} interactive onChange={(rating) => setForm({ ...form, rating })} />
              </div>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Reseña<textarea className="focus-ring min-h-28 resize-none rounded-lg border border-[#dce9e5] px-4 py-3" value={form.reviewText} onChange={(e) => setForm({ ...form, reviewText: e.target.value })} /></label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={submitting}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar"}</Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
