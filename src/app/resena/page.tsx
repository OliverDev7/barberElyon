"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark, Button, Panel } from "@/components/ui";

function Stars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return <div className="flex items-center gap-1" aria-label={`${value} de 5 estrellas`}>{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} estrella${star === 1 ? "" : "s"}`} className={`focus-ring rounded-md px-1 text-3xl leading-none transition ${star <= value ? "text-amber-400" : "text-neutral-300 hover:text-amber-300"}`}>★</button>)}</div>;
}

export default function ReviewPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", rating: 5, reviewText: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) return setError("Ingresa tu nombre y apellido.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Ingresa un correo válido.");
    if (form.reviewText.trim().length < 10) return setError("Escribe una reseña de al menos 10 caracteres.");

    setSaving(true);
    try {
      const response = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: `${form.firstName.trim()} ${form.lastName.trim()}`, email: form.email.trim(), rating: form.rating, reviewText: form.reviewText.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar la reseña.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la reseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-xl">
        <div className="px-1"><BrandMark /></div>
        <Panel className="mt-8 p-5 sm:p-8">
          {!success ? <>
            <p className="eyebrow">Elyon Barber</p>
            <h1 className="section-title mt-2 text-[clamp(1.9rem,1.5rem+1.4vw,2.7rem)]">Cuéntanos tu experiencia</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-500">Tu opinión nos ayuda a seguir mejorando. Gracias por confiar en Elyon Barber.</p>
            <form className="mt-7 grid gap-5" onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-neutral-700">Nombre<input className="focus-ring min-h-11 rounded-xl border border-[#dce9e5] bg-white px-4" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" required /></label>
                <label className="grid gap-2 text-sm font-bold text-neutral-700">Apellido<input className="focus-ring min-h-11 rounded-xl border border-[#dce9e5] bg-white px-4" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" required /></label>
              </div>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Correo electrónico<input className="focus-ring min-h-11 rounded-xl border border-[#dce9e5] bg-white px-4" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></label>
              <div className="grid gap-2 text-sm font-bold text-neutral-700">¿Cómo calificarías tu experiencia?<Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} /></div>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">Tu reseña<textarea className="focus-ring min-h-36 resize-none rounded-xl border border-[#dce9e5] bg-white px-4 py-3" value={form.reviewText} onChange={(e) => setForm({ ...form, reviewText: e.target.value })} placeholder="Cuéntanos qué te pareció tu experiencia..." required /></label>
              {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
              <Button type="submit" disabled={saving}>{saving ? "Enviando reseña…" : "Publicar reseña"}</Button>
            </form>
          </> : <div className="py-8 text-center sm:py-12"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-50 text-2xl text-teal-950">✓</div><h1 className="section-title mt-5">¡Gracias por tu reseña!</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">Tu experiencia fue recibida correctamente. Gracias por apoyar a Elyon Barber.</p><Link href="/reservar/elyon-barber" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-950 px-5 text-sm font-black text-white">Volver a reservas</Link></div>}
        </Panel>
      </section>
    </main>
  );
}
