"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandMark, Button, DarkPanel } from "./ui";
import { durationLabel, formatPrice, formatTime } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string };
type Settings = { business_name: string; barber_name: string; address: string; google_maps_embed_url: string; whatsapp_phone: string };
type Slot = { id: string; time_24: string; period: "morning" | "afternoon" | "night" };

const initialDates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  return date;
});

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-neutral-950/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" onClick={onClose}>
      <section className="max-h-[92vh] w-full overflow-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl font-bold text-neutral-950">{title}</h2>
          <button className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-black text-neutral-600" onClick={onClose}>x</button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  );
}

export function BookingFlow() {
  const [step, setStep] = useState<"services" | "datetime" | "contact">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date>(initialDates[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState("");
  const [modal, setModal] = useState<"location" | "hours" | "success" | null>(null);
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", comment: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/config").then((res) => res.json()).then((data) => {
      setServices(data.services ?? []);
      setSettings(data.settings ?? null);
    }).catch(() => setError("No se pudo cargar la configuracion."));
  }, []);

  useEffect(() => {
    fetch(`/api/public/availability?date=${dateKey(date)}`).then((res) => res.json()).then((data) => {
      const nextSlots = data.slots ?? [];
      setSlots(nextSlots);
      setTime(nextSlots[0]?.time_24 ?? "");
    }).catch(() => setSlots([]));
  }, [date]);

  const dateLabel = useMemo(() => date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }), [date]);
  const canBook = Boolean(form.name && form.lastName && form.email && form.phone && service && date && time && Object.keys(fieldErrors).length === 0);
  const grouped = {
    morning: slots.filter((slot) => slot.period === "morning"),
    afternoon: slots.filter((slot) => slot.period === "afternoon"),
    night: slots.filter((slot) => slot.period === "night"),
  };

  function validateForm() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ingresa tu nombre.";
    if (!form.lastName.trim()) next.lastName = "Ingresa tu apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Ingresa un correo valido.";
    if (!/^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/.test(form.phone.trim())) next.phone = "Ingresa un telefono chileno valido. Ej: +56 9 7530 5607.";
    if (!service) next.service = "Selecciona un servicio.";
    if (!time) next.time = "Selecciona un horario disponible.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function book() {
    if (!validateForm() || !service) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: service.id,
        date: dateKey(date),
        time,
        firstName: form.name,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        observations: form.comment,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "No se pudo crear la reserva.");
      return;
    }
    setModal("success");
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-neutral-950">
      <header className="sticky top-0 z-30 border-b border-teal-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <BrandMark />
          <nav className="flex items-center gap-1 text-sm font-bold text-neutral-700 sm:gap-2">
            <button className="focus-ring rounded-md px-3 py-2 transition hover:bg-teal-50 hover:text-teal-950" onClick={() => setModal("location")}>Ubicacion</button>
            <button className="focus-ring rounded-md px-3 py-2 transition hover:bg-teal-50 hover:text-teal-950" onClick={() => setModal("hours")}>Horario</button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-950">Reserva online</p>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-tight text-neutral-950 sm:text-6xl">Agenda tu estilo</h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-neutral-600">Reserva tu proxima visita en {settings?.business_name ?? "ELYON BARBER"} con una experiencia simple, clara y pensada para mobile.</p>
          </aside>

          <DarkPanel className="min-h-[560px]">
            <div className="mb-7 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {(["services", "datetime", "contact"] as const).map((key, index) => (
                <div key={key} className={`min-w-fit rounded-full border px-4 py-2 text-xs font-black ${step === key ? "border-teal-950 bg-teal-950 text-white" : "border-teal-100 bg-white text-neutral-500"}`}>{index + 1}. {key === "services" ? "Servicios" : key === "datetime" ? "Fecha y hora" : "Datos"}</div>
              ))}
            </div>

            {step === "services" && (
              <section>
                <h2 className="font-serif text-3xl font-bold">Servicios</h2>
                <p className="mt-2 text-neutral-500">Elige el servicio que quieres agendar con ELYON BARBER.</p>
                {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {services.map((item) => (
                    <article key={item.id} className="flex min-h-[310px] flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm shadow-teal-950/5">
                      <div className="flex flex-1 flex-col">
                        <h3 className="text-xl font-black leading-tight">{item.name}</h3>
                        <p className="mt-3 text-sm font-bold text-neutral-500">{durationLabel(item.duration_minutes)}</p>
                        <p className="mt-4 text-3xl font-black text-teal-950">{formatPrice(item.price)}</p>
                        <p className="mt-4 text-sm leading-6 text-neutral-500">({item.description})</p>
                      </div>
                      <Button className="mt-6 w-full" onClick={() => { setService(item); setStep("datetime"); }}>Agendar servicio</Button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {step === "datetime" && service && (
              <section>
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-950 text-lg font-black text-white">B.A.</div>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-teal-950">{settings?.barber_name ?? "Barbero Alonso Salinas"}</p>
                  <h2 className="mt-3 font-serif text-3xl font-bold">Selecciona fecha y hora</h2>
                </div>
                <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
                  <h3 className="mb-7 text-4xl font-black text-neutral-800">{date.toLocaleDateString("es-CL", { month: "long" })}</h3>
                  <div className="grid grid-cols-[36px_1fr_36px] items-center gap-1 sm:grid-cols-[44px_1fr_44px] sm:gap-3">
                    <button className="focus-ring text-4xl">‹</button>
                    <div className="grid grid-cols-7 items-center gap-1 sm:gap-3">
                      {initialDates.map((item) => {
                        const selected = dateKey(item) === dateKey(date);
                        return (
                          <button key={dateKey(item)} onClick={() => setDate(item)} className={`focus-ring mx-auto flex h-28 w-full max-w-[74px] flex-col items-center justify-center rounded-full text-center sm:h-32 sm:max-w-[86px] ${selected ? "bg-[#26343b] text-white" : "bg-white text-neutral-900 hover:bg-teal-50"}`}>
                            <span className="text-sm font-medium sm:text-2xl">{item.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}</span>
                            <span className="mt-3 text-2xl font-black sm:text-3xl">{item.getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button className="focus-ring text-4xl">›</button>
                  </div>
                </div>
                <div className="mt-8 grid gap-6">
                  {[
                    ["morning", "Mañana"],
                    ["afternoon", "Tarde"],
                    ["night", "Noche"],
                  ].map(([key, label]) => (
                    <div key={key}>
                      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-neutral-500">{label}</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {(grouped[key as keyof typeof grouped]).map((slot) => (
                          <button key={slot.id} onClick={() => setTime(slot.time_24)} className={`focus-ring min-h-12 rounded-lg border px-3 text-sm font-black ${time === slot.time_24 ? "border-teal-950 bg-teal-950 text-white" : "border-neutral-200 bg-white hover:bg-teal-50"}`}>{formatTime(slot.time_24)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {slots.length === 0 && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">No hay horas disponibles para este dia.</p>}
                <p className="mt-5 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950">Las horas disponibles podrian agotarse, agenda lo antes posible!</p>
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep("services")}>Volver</Button>
                  <Button disabled={!time} onClick={() => setStep("contact")}>Continuar</Button>
                </div>
              </section>
            )}

            {step === "contact" && service && (
              <section>
                <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-5">
                  <h2 className="font-serif text-3xl font-bold">Resumen</h2>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p><b>Servicio:</b> {service.name}</p><p><b>Fecha:</b> {dateLabel}</p><p><b>Hora:</b> {formatTime(time)}</p><p><b>Barbero:</b> {settings?.barber_name}</p><p className="text-xl font-black text-teal-950 sm:col-span-2">Precio: {formatPrice(service.price)}</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {[["name", "Nombre *"], ["lastName", "Apellido *"], ["email", "Correo *"], ["phone", "Telefono *"]].map(([key, label]) => (
                    <label key={key} className="grid gap-2 text-sm font-bold text-neutral-700">
                      {label}
                      <input
                        className={`focus-ring min-h-12 rounded-lg border px-4 ${fieldErrors[key] ? "border-red-300 bg-red-50" : form[key as keyof typeof form] ? "border-teal-200 bg-white" : "border-neutral-200 bg-white"}`}
                        value={form[key as keyof typeof form]}
                        onBlur={validateForm}
                        onChange={(event) => {
                          setForm({ ...form, [key]: event.target.value });
                          setFieldErrors((current) => {
                            const next = { ...current };
                            delete next[key];
                            return next;
                          });
                        }}
                      />
                      {fieldErrors[key] && <span className="text-xs font-bold text-red-700">{fieldErrors[key]}</span>}
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">Observaciones <span className="font-normal text-neutral-500">(opcional)</span><textarea className="focus-ring min-h-32 resize-none rounded-lg border border-neutral-200 px-4 py-3" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} /></label>
                </div>
                {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep("datetime")}>Volver</Button>
                  <Button disabled={loading || !service || !time} onClick={book}>{loading ? "Agendando..." : "Agendar"}</Button>
                </div>
              </section>
            )}
          </DarkPanel>
        </div>
      </section>

      {modal === "location" && settings && <Modal title="Ubicacion" onClose={() => setModal(null)}><iframe className="h-72 w-full rounded-xl border border-teal-100" src={settings.google_maps_embed_url} loading="lazy" /><p className="mt-4 font-bold">{settings.business_name}</p><p className="text-neutral-600">{settings.address}</p><p className="mt-3 font-bold text-teal-950">WhatsApp: {settings.whatsapp_phone}</p></Modal>}
      {modal === "hours" && <Modal title="Horario" onClose={() => setModal(null)}><p className="text-neutral-600">Los horarios visibles en la reserva dependen de la disponibilidad configurada por el administrador.</p></Modal>}
      {modal === "success" && service && <Modal title="Reserva realizada" onClose={() => setModal(null)}><div className="rounded-xl border border-teal-100 bg-teal-50 p-5"><p className="text-4xl font-black text-teal-950">Listo</p><p className="mt-4"><b>Servicio:</b> {service.name}</p><p><b>Fecha:</b> {dateLabel}</p><p><b>Hora:</b> {formatTime(time)}</p><p><b>Barbero:</b> {settings?.barber_name}</p><p className="text-xl font-black text-teal-950">{formatPrice(service.price)}</p></div></Modal>}
    </main>
  );
}
