"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark, Button, DarkPanel, PublicFooter } from "./ui";
import { durationLabel, formatPrice, formatTime } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string };
type Settings = { business_name: string; barber_name: string; address: string; google_maps_embed_url: string; whatsapp_phone: string };
type Slot = { id: string; time_24: string; period: "morning" | "afternoon" | "night" };

function startOfToday() {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  return value;
}

function addDays(value: Date, amount: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + amount);
  return result;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDate(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

function monthLabel(dates: Date[]) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (!first || !last) return "";
  const firstLabel = first.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const lastLabel = last.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return firstLabel === lastLabel ? firstLabel : `${firstLabel} — ${lastLabel}`;
}

function Modal({ title, children, onClose, compact = false }: { title: string; children: ReactNode; onClose: () => void; compact?: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 grid place-items-end bg-neutral-950/45 p-0 backdrop-blur-sm ${compact ? "sm:place-items-end sm:p-0" : "sm:place-items-center sm:p-6"}`} onClick={onClose}>
      <section className={`max-h-[92vh] w-full overflow-auto bg-white p-5 shadow-2xl animate-[sheet-in_220ms_ease-out] ${compact ? "rounded-t-3xl sm:rounded-t-3xl sm:rounded-b-none sm:p-7" : "rounded-t-3xl sm:max-w-lg sm:rounded-3xl sm:p-7"}`} onClick={(event) => event.stopPropagation()}>
        {!compact && <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-neutral-950 sm:text-3xl">{title}</h2>
          <button aria-label="Cerrar" className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-xl font-black text-neutral-600 transition hover:bg-teal-50 hover:text-teal-950" onClick={onClose}>×</button>
        </div>}
        {compact && <div className="flex justify-end">
          <button aria-label="Cerrar" className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-neutral-100 text-xl font-black text-neutral-600 transition hover:bg-teal-50 hover:text-teal-950" onClick={onClose}>×</button>
        </div>}
        <div className={compact ? "mt-1" : "mt-5"}>{children}</div>
      </section>
    </div>
  );
}

export function BookingFlow() {
  const today = useMemo(() => startOfToday(), []);
  const [step, setStep] = useState<"services" | "datetime" | "contact">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [pendingService, setPendingService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date>(today);
  const [viewStart, setViewStart] = useState<Date>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState("");
  const [modal, setModal] = useState<"location" | "hours" | "success" | null>(null);
  const [form, setForm] = useState({ name: "", lastName: "", email: "", phone: "", comment: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");

  useEffect(() => {
    fetch("/api/public/config")
      .then((res) => res.json())
      .then((data) => { setServices(data.services ?? []); setSettings(data.settings ?? null); })
      .catch(() => setError("No se pudo cargar la configuración."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTime("");
    setAvailabilityLoading(true);
    fetch(`/api/public/availability?date=${dateKey(date)}`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setSlots(data.slots ?? []); })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const visibleDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(viewStart, index)), [viewStart]);
  const dateLabel = useMemo(() => date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), [date]);
  const canBook = Boolean(form.name.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim() && service && time && Object.keys(fieldErrors).length === 0);
  const grouped = { morning: slots.filter((slot) => slot.period === "morning"), afternoon: slots.filter((slot) => slot.period === "afternoon"), night: slots.filter((slot) => slot.period === "night") };

  function moveCalendar(days: number) {
    const nextStart = addDays(viewStart, days);
    if (nextStart < today) return;
    setViewStart(nextStart);
  }

  function chooseDate(nextDate: Date) {
    if (nextDate < today) return;
    setDate(nextDate);
    setTime("");
    setFieldErrors((current) => { const next = { ...current }; delete next.time; return next; });
  }

  function goToToday() {
    setViewStart(today);
    chooseDate(today);
  }

  function confirmService() {
    if (!pendingService) return;
    setService(pendingService);
    setPendingService(null);
    setStep("datetime");
  }

  function validateForm() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ingresa tu nombre.";
    if (!form.lastName.trim()) next.lastName = "Ingresa tu apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Ingresa un correo válido.";
    if (!/^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/.test(form.phone.trim())) next.phone = "Ingresa un teléfono chileno válido. Ej: +56 9 7530 5607.";
    if (!service) next.service = "Selecciona un servicio.";
    if (!time) next.time = "Selecciona un horario disponible.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function book() {
    if (!validateForm() || !service) return;
    setLoading(true); setError(""); setEmailWarning("");
    try {
      const response = await fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId: service.id, date: dateKey(date), time, firstName: form.name.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim(), observations: form.comment.trim() }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "No se pudo crear la reserva."); return; }
      if (data.emailSent === false) setEmailWarning(data.warning ?? "La reserva fue creada, pero el correo de confirmación no pudo enviarse.");
      setModal("success");
    } catch { setError("No se pudo conectar con el servidor."); }
    finally { setLoading(false); }
  }

  function closeSuccess() {
    setModal(null); setStep("services"); setService(null); setTime(""); setFieldErrors({}); setForm({ name: "", lastName: "", email: "", phone: "", comment: "" }); setEmailWarning(""); setError(""); goToToday();
  }

  return <main className="min-h-screen bg-[#f7faf8] text-neutral-950">
    <header className="sticky top-0 z-30 border-b border-teal-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><BrandMark /><nav className="flex items-center gap-1 text-sm font-bold text-neutral-700 sm:gap-2"><button className="focus-ring rounded-xl px-3 py-2 transition hover:bg-teal-50 hover:text-teal-950" onClick={() => setModal("location")}>Ubicación</button><button className="focus-ring rounded-xl px-3 py-2 transition hover:bg-teal-50 hover:text-teal-950" onClick={() => setModal("hours")}>Horario</button></nav></div></header>
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-14"><div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><aside className="lg:sticky lg:top-24"><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-950 sm:text-sm">Reserva online</p><h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-[1.05] text-neutral-950 sm:mt-4 sm:text-6xl">Agenda tu estilo</h1><p className="mt-4 max-w-md text-base leading-7 text-neutral-600 sm:mt-5 sm:text-lg sm:leading-8">Reserva tu próxima visita en {settings?.business_name ?? "ELYON BARBER"} con una experiencia simple, clara y pensada para mobile.</p></aside>
      <DarkPanel className="min-h-[560px] overflow-hidden"><div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">{(["services", "datetime", "contact"] as const).map((key, index) => <div key={key} className={`min-w-fit rounded-full border px-3.5 py-2 text-[11px] font-black transition-all duration-200 sm:px-4 sm:text-xs ${step === key ? "border-teal-950 bg-teal-950 text-white shadow-sm" : "border-teal-100 bg-white text-neutral-500"}`}>{index + 1}. {key === "services" ? "Servicios" : key === "datetime" ? "Fecha y hora" : "Datos"}</div>)}</div>
        {step === "services" && <section key="services" className="animate-[step-in_220ms_ease-out]"><h2 className="font-display text-3xl font-bold sm:text-4xl">Servicios</h2><p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">Elige el servicio que quieres agendar con ELYON BARBER.</p>{error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">{services.map((item) => <article key={item.id} className="group flex min-h-[300px] flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm shadow-teal-950/5 transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-6"><div className="flex flex-1 flex-col"><div className="flex items-start justify-between gap-4"><h3 className="max-w-[15rem] text-xl font-black leading-[1.15] tracking-[-0.02em] text-neutral-950">{item.name}</h3><span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-teal-950">{durationLabel(item.duration_minutes)}</span></div><p className="mt-6 text-3xl font-black tracking-[-0.03em] text-teal-950 sm:text-[2rem]">{formatPrice(item.price)}</p><p className="mt-3 min-h-[3rem] text-sm leading-6 text-neutral-500">{item.description}</p></div><Button className="mt-6 w-full" onClick={() => setPendingService(item)}>Agendar servicio</Button></article>)}</div></section>}
        {step === "datetime" && service && <section key="datetime" className="animate-[step-in_220ms_ease-out]"><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-950 text-lg font-black text-white shadow-lg shadow-teal-950/10">B.A.</div><p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-teal-950 sm:text-sm">{settings?.barber_name ?? "Barbero Alonso Salinas"}</p><h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Selecciona fecha y hora</h2></div>
          <div className="mt-7 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm sm:mt-8 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><h3 className="min-w-0 text-lg font-black capitalize leading-tight text-neutral-800 sm:text-3xl">{monthLabel(visibleDates)}</h3><button type="button" onClick={goToToday} className="focus-ring shrink-0 rounded-full border border-teal-100 px-3 py-2 text-xs font-black text-teal-950 transition hover:bg-teal-50 sm:px-4">Hoy</button></div>
            <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1 sm:grid-cols-[48px_minmax(0,1fr)_48px] sm:gap-3">
              <button aria-label="Fechas anteriores" className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-neutral-50 text-3xl font-light text-neutral-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-30 sm:h-12 sm:w-12" type="button" onClick={() => moveCalendar(-1)} disabled={isSameDate(viewStart, today)}>‹</button>
              <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
                {visibleDates.map((item) => { const selected = isSameDate(item, date); return <button type="button" key={dateKey(item)} onClick={() => chooseDate(item)} aria-pressed={selected} className={`focus-ring mx-auto flex h-[82px] w-full min-w-0 flex-col items-center justify-center rounded-2xl text-center transition duration-200 sm:h-28 sm:max-w-[92px] ${selected ? "bg-[#26343b] text-white shadow-lg shadow-slate-900/10 scale-[1.02]" : "bg-white text-neutral-900 hover:bg-teal-50"}`}><span className={`max-w-full px-0.5 text-[10px] font-bold uppercase sm:text-sm ${selected ? "text-white/80" : "text-neutral-500"}`}>{item.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}</span><span className="mt-1 text-[1.65rem] font-black leading-none sm:text-3xl">{item.getDate()}</span><span className={`mt-1 text-[10px] sm:text-xs ${selected ? "text-white/70" : "text-neutral-400"}`}>{item.toLocaleDateString("es-CL", { month: "short" }).replace(".", "")}</span></button>; })}
              </div>
              <button aria-label="Fechas posteriores" className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-neutral-50 text-3xl font-light text-neutral-700 transition hover:bg-teal-50 sm:h-12 sm:w-12" type="button" onClick={() => moveCalendar(1)}>›</button>
            </div>
            <p className="mt-4 text-center text-[11px] leading-5 text-neutral-400 sm:text-xs">Desplázate por las fechas para continuar hacia los próximos días y meses.</p>
          </div>
          <div className="mt-7 grid gap-6 sm:mt-8">{[["morning", "Mañana"],["afternoon", "Tarde"],["night", "Noche"]].map(([key, label]) => <div key={key}><h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-neutral-500 sm:text-sm">{label}</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{grouped[key as keyof typeof grouped].map((slot) => <button type="button" key={slot.id} onClick={() => { setTime(slot.time_24); setFieldErrors((current) => { const next = { ...current }; delete next.time; return next; }); }} className={`focus-ring min-h-12 rounded-xl border px-3 text-sm font-black transition ${time === slot.time_24 ? "border-teal-950 bg-teal-950 text-white shadow-sm" : "border-neutral-200 bg-white hover:bg-teal-50"}`}>{formatTime(slot.time_24)}</button>)}</div></div>)}</div>
          {availabilityLoading && <p className="mt-5 rounded-xl border border-teal-100 bg-white px-4 py-3 text-sm font-bold text-neutral-500">Consultando disponibilidad…</p>}
          {!availabilityLoading && slots.length === 0 && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">No hay horas disponibles para este día.</p>}
          <p className="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950">Las horas disponibles podrían agotarse, ¡agenda lo antes posible!</p><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep("services")}>Volver</Button><Button disabled={!time || availabilityLoading} onClick={() => setStep("contact")}>Continuar</Button></div>
        </section>}
        {step === "contact" && service && <section key="contact" className="animate-[step-in_220ms_ease-out]"><div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 sm:p-6"><h2 className="font-display text-2xl font-bold sm:text-3xl">Resumen</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><b>Servicio:</b> {service.name}</p><p><b>Fecha:</b> {dateLabel}</p><p><b>Hora:</b> {formatTime(time)}</p><p><b>Barbero:</b> {settings?.barber_name}</p><p className="text-xl font-black text-teal-950 sm:col-span-2">Precio: {formatPrice(service.price)}</p></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2">{[["name", "Nombre *"],["lastName", "Apellido *"],["email", "Correo *"],["phone", "Teléfono *"]].map(([key, label]) => <label key={key} className="grid gap-2 text-sm font-bold text-neutral-700">{label}<input className={`focus-ring min-h-12 rounded-xl border px-4 transition ${fieldErrors[key] ? "border-red-300 bg-red-50" : form[key as keyof typeof form] ? "border-teal-200 bg-white" : "border-neutral-200 bg-white"}`} value={form[key as keyof typeof form]} onBlur={validateForm} onChange={(event) => { setForm({ ...form, [key]: event.target.value }); setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next; }); }} autoComplete={key === "email" ? "email" : key === "phone" ? "tel" : "off"} />{fieldErrors[key] && <span className="text-xs font-bold text-red-700">{fieldErrors[key]}</span>}</label>)}<label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">Observaciones <span className="font-normal text-neutral-500">(opcional)</span><textarea className="focus-ring min-h-32 resize-none rounded-xl border border-neutral-200 px-4 py-3" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} /></label></div>{error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep("datetime")}>Volver</Button><Button disabled={loading || !canBook} onClick={book}>{loading ? "Agendando..." : "Agendar"}</Button></div></section>}
      </DarkPanel></div></section>
    <PublicFooter />
    {pendingService && <Modal title="" compact onClose={() => setPendingService(null)}><div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5 sm:p-6"><h3 className="text-[1.55rem] font-black leading-tight tracking-[-0.025em] text-neutral-950 sm:text-2xl">¿Estás a punto de agendar {pendingService.name}?</h3><p className="mt-5 text-sm font-semibold text-neutral-600"><strong>Duración:</strong> {durationLabel(pendingService.duration_minutes)}</p></div><div className="mt-5 flex justify-end"><Button onClick={confirmService}>Confirmar</Button></div></Modal>}
    {loading && <div className="fixed inset-0 z-[60] grid place-items-center bg-neutral-950/45 px-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl animate-[sheet-in_220ms_ease-out]"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-teal-100 border-t-teal-950 animate-spin" aria-hidden="true" /><h2 className="mt-5 font-display text-2xl font-bold">Estamos reservando tu hora…</h2><p className="mt-2 text-sm leading-6 text-neutral-500">Estamos confirmando disponibilidad y registrando tu cita.</p></div></div>}
    {modal === "location" && settings && <Modal title="Ubicación" onClose={() => setModal(null)}><iframe title="Mapa de ELYON BARBER" className="h-72 w-full rounded-xl border border-teal-100" src={settings.google_maps_embed_url} loading="lazy" /><p className="mt-4 font-bold">{settings.business_name}</p><p className="text-neutral-600">{settings.address}</p><p className="mt-3 font-bold text-teal-950">WhatsApp: {settings.whatsapp_phone}</p></Modal>}
    {modal === "hours" && <Modal title="Horario" onClose={() => setModal(null)}><p className="text-neutral-600">Los horarios visibles en la reserva dependen de la disponibilidad configurada por el administrador.</p></Modal>}
    {modal === "success" && service && <Modal title="¡Cita agendada!" onClose={closeSuccess}><div className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-950 text-2xl text-white animate-[check-pop_320ms_ease-out]">✓</div><h3 className="mt-5 font-display text-3xl font-bold text-neutral-950">Todo listo, {form.name}</h3><p className="mt-3 text-sm leading-6 text-neutral-600">Tu reserva para <strong>{service.name}</strong> quedó registrada para el <strong>{dateLabel}</strong> a las <strong>{formatTime(time)}</strong>.</p>{emailWarning && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-800">{emailWarning}</p>}<Button className="mt-6 w-full" onClick={closeSuccess}>Aceptar</Button></div></Modal>}
  </main>;
}
