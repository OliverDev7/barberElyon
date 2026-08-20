"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark, Button, DarkPanel, PublicFooter, StatusPill } from "./ui";
import { durationLabel, formatPrice, formatTime } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string };
type Settings = { business_name: string; barber_name: string; address: string; google_maps_embed_url: string; whatsapp_phone: string };
type Slot = { id: string; time_24: string; period: "morning" | "afternoon" | "night" };

function startOfToday() { const value = new Date(); value.setHours(12, 0, 0, 0); return value; }
function addDays(value: Date, amount: number) { const result = new Date(value); result.setDate(result.getDate() + amount); return result; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function isSameDate(a: Date, b: Date) { return dateKey(a) === dateKey(b); }
function monthLabel(dates: Date[]) {
  const first = dates[0], last = dates[dates.length - 1];
  if (!first || !last) return "";
  const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  const firstLabel = first.toLocaleDateString("es-CL", options);
  const lastLabel = last.toLocaleDateString("es-CL", options);
  return firstLabel === lastLabel ? firstLabel : `${firstLabel} / ${lastLabel}`;
}

function Modal({ title, children, onClose, compact = false }: { title: string; children: ReactNode; onClose: () => void; compact?: boolean }) {
  return (
    <div className={`fixed inset-0 z-50 grid bg-neutral-950/45 p-3 backdrop-blur-sm ${compact ? "place-items-end" : "place-items-end sm:place-items-center sm:p-6"}`} onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title || "Confirmación"} className={`w-full overflow-auto bg-white shadow-2xl animate-[sheet-in_220ms_ease-out] ${compact ? "max-w-2xl rounded-t-[20px] border border-[#dce9e5] p-4 sm:rounded-[20px]" : "max-h-[92vh] rounded-t-[20px] p-5 sm:max-w-lg sm:rounded-[20px] sm:p-7"}`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          {title ? <h2 className="section-title text-neutral-950">{title}</h2> : <span />}
          <button aria-label="Cerrar" className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-xl font-black text-neutral-600 transition hover:bg-[#eef5f3] hover:text-teal-950" onClick={onClose}>×</button>
        </div>
        <div className={title ? "mt-5" : "mt-1"}>{children}</div>
      </section>
    </div>
  );
}

function StepPill({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  return (
    <div className={`flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black transition sm:px-4 ${active ? "border-teal-950 bg-teal-950 text-white" : done ? "border-teal-100 bg-[#eef5f3] text-teal-950" : "border-[#dce9e5] bg-white text-neutral-500"}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${active ? "bg-white/15" : "bg-white"}`}>{index}</span>
      {label}
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
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setAvailabilityLoading(true);
      const query = new URLSearchParams({ date: dateKey(date) });
      if (service?.id) query.set("serviceId", service.id);
      return fetch(`/api/public/availability?${query.toString()}`)
        .then((res) => res.json())
        .then((data) => { if (!cancelled) setSlots(data.slots ?? []); })
        .catch(() => { if (!cancelled) setSlots([]); })
        .finally(() => { if (!cancelled) setAvailabilityLoading(false); });
    });
    return () => { cancelled = true; };
  }, [date, service?.id]);

  const visibleDates = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(viewStart, index)), [viewStart]);
  const dateLabel = useMemo(() => date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }), [date]);
  const canBook = Boolean(form.name.trim() && form.lastName.trim() && form.email.trim() && form.phone.trim() && service && time && Object.keys(fieldErrors).length === 0);
  const grouped = {
    morning: slots.filter((slot) => slot.period === "morning"),
    afternoon: slots.filter((slot) => slot.period === "afternoon"),
    night: slots.filter((slot) => slot.period === "night"),
  };

  function moveCalendar(days: number) { const nextStart = addDays(viewStart, days); if (nextStart < today) return; setViewStart(nextStart); }
  function chooseDate(nextDate: Date) { if (nextDate < today) return; setDate(nextDate); setTime(""); setFieldErrors((current) => { const next = { ...current }; delete next.time; return next; }); }
  function goToToday() { setViewStart(today); chooseDate(today); }
  function confirmService() { if (!pendingService) return; setService(pendingService); setPendingService(null); setStep("datetime"); }

  function validateForm() {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ingresa tu nombre.";
    if (!form.lastName.trim()) next.lastName = "Ingresa tu apellido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Ingresa un correo válido.";
    if (!/^\d{9}$/.test(form.phone.trim())) next.phone = "Ingresa un teléfono chileno válido. Debe tener 9 números.";
    if (!service) next.service = "Selecciona un servicio.";
    if (!time) next.time = "Selecciona un horario disponible.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  function handlePhoneChange(value: string) {
    const rawDigits = value.replace(/\D/g, "");
    const hasInvalidCharacters = /\D/.test(value);
    const hasTooManyDigits = rawDigits.length > 9;
    const digitsOnly = rawDigits.slice(0, 9);
    setForm((current) => ({ ...current, phone: digitsOnly }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (hasInvalidCharacters) next.phone = "Este campo solo admite números.";
      else if (hasTooManyDigits) next.phone = "Ingresa un teléfono chileno válido. Debe tener 9 números.";
      else delete next.phone;
      return next;
    });
  }

  function handlePhoneKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (/^\d$/.test(event.key) && form.phone.length >= 9) {
      event.preventDefault();
      setFieldErrors((current) => ({ ...current, phone: "Ingresa un teléfono chileno válido. Debe tener 9 números." }));
    }
  }

  function handlePhonePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    handlePhoneChange(event.clipboardData.getData("text"));
  }

  async function book() {
    if (!validateForm() || !service) return;
    setLoading(true); setError(""); setEmailWarning("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, date: dateKey(date), time, firstName: form.name.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim(), observations: form.comment.trim() }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "No se pudo crear la reserva."); return; }
      if (data.emailSent === false) setEmailWarning(data.warning ?? "La reserva fue creada, pero el correo de confirmación no pudo enviarse.");
      setModal("success");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function closeSuccess() {
    setModal(null); setStep("services"); setService(null); setTime(""); setFieldErrors({});
    setForm({ name: "", lastName: "", email: "", phone: "", comment: "" });
    setEmailWarning(""); setError(""); goToToday();
  }

  return (
    <main className="app-shell">
      <header className="sticky top-0 z-30 border-b border-[#dce9e5] bg-white/88 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="page-container flex items-center justify-between gap-4">
          <BrandMark />
          <nav className="flex items-center gap-1 text-sm font-bold text-neutral-700 sm:gap-2">
            <button className="focus-ring rounded-lg px-3 py-2 transition hover:bg-[#eef5f3] hover:text-teal-950" onClick={() => setModal("location")}>Ubicación</button>
            <button className="focus-ring rounded-lg px-3 py-2 transition hover:bg-[#eef5f3] hover:text-teal-950" onClick={() => setModal("hours")}>Horario</button>
          </nav>
        </div>
      </header>

      <section className="page-container py-8 sm:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,.82fr)_minmax(560px,1.18fr)] lg:items-start xl:gap-12">
          <aside className="lg:sticky lg:top-28">
            <p className="eyebrow">Reserva online</p>
            <h1 className="display-title mt-4 max-w-2xl">Agenda tu próxima visita en Elyon Barber Studio.</h1>
            <p className="body-copy mt-5 max-w-xl">Elige servicio, fecha y horario en un flujo claro. Confirmamos tu reserva con los datos esenciales y sin pasos innecesarios.</p>
            <div className="mt-7 grid gap-3 text-sm text-neutral-600 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-lg border border-[#dce9e5] bg-white/70 p-4"><b className="block text-teal-950">01</b><span>Servicio</span></div>
              <div className="rounded-lg border border-[#dce9e5] bg-white/70 p-4"><b className="block text-teal-950">02</b><span>Fecha y hora</span></div>
              <div className="rounded-lg border border-[#dce9e5] bg-white/70 p-4"><b className="block text-teal-950">03</b><span>Confirmación</span></div>
            </div>
          </aside>

          <DarkPanel className="overflow-hidden">
            <div className="mb-7 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <StepPill index={1} label="Servicios" active={step === "services"} done={step !== "services"} />
              <StepPill index={2} label="Fecha y hora" active={step === "datetime"} done={step === "contact"} />
              <StepPill index={3} label="Datos" active={step === "contact"} done={false} />
            </div>

            {step === "services" && (
              <section key="services" className="animate-[step-in_220ms_ease-out]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="section-title">Servicios</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">Selecciona una atención para ver disponibilidad real.</p>
                  </div>
                  <StatusPill tone="gray">{services.length} opciones</StatusPill>
                </div>
                {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {services.map((item) => (
                    <article key={item.id} className="interactive-lift flex min-h-[190px] flex-col rounded-lg border border-[#dce9e5] bg-white p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-black leading-6 text-neutral-950">{item.name}</h3>
                          <p className="mt-1 text-sm font-semibold text-neutral-500">{durationLabel(item.duration_minutes)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-teal-950">{formatPrice(item.price)}</p>
                      </div>
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-neutral-500">{item.description}</p>
                      <Button className="mt-auto w-full sm:w-fit sm:self-end" onClick={() => setPendingService(item)}>Agendar</Button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {step === "datetime" && service && (
              <section key="datetime" className="animate-[step-in_220ms_ease-out]">
                <div className="flex flex-col gap-4 border-b border-[#edf3f1] pb-6 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="eyebrow">{settings?.barber_name ?? "Barbero Alonso Salinas"}</p>
                    <h2 className="section-title mt-2">Selecciona fecha y hora</h2>
                    <p className="mt-2 text-sm text-neutral-500">{service.name} · {durationLabel(service.duration_minutes)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setStep("services")}>Cambiar servicio</Button>
                </div>

                <div className="mt-6 rounded-lg border border-[#dce9e5] bg-white p-3 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="min-w-0 text-base font-black capitalize leading-tight text-neutral-800 sm:text-2xl">{monthLabel(visibleDates)}</h3>
                    <button type="button" onClick={goToToday} className="focus-ring shrink-0 rounded-full border border-[#dce9e5] px-3 py-2 text-xs font-black text-teal-950 transition hover:bg-[#eef5f3]">Hoy</button>
                  </div>
                  <div className="grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-1 sm:grid-cols-[44px_minmax(0,1fr)_44px] sm:gap-3">
                    <button aria-label="Fechas anteriores" className="focus-ring grid h-10 w-8 place-items-center rounded-lg bg-[#eef5f3] text-2xl font-light text-neutral-700 transition hover:bg-[#dce9e5] disabled:opacity-30 sm:h-12 sm:w-11" type="button" onClick={() => moveCalendar(-1)} disabled={isSameDate(viewStart, today)}>‹</button>
                    <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
                      {visibleDates.map((item) => {
                        const selected = isSameDate(item, date);
                        return (
                          <button type="button" key={dateKey(item)} onClick={() => chooseDate(item)} aria-pressed={selected} className={`focus-ring flex h-[74px] min-w-0 flex-col items-center justify-center rounded-lg text-center transition sm:h-24 ${selected ? "bg-[#26343b] text-white" : "bg-white text-neutral-900 hover:bg-[#eef5f3]"}`}>
                            <span className={`text-[9px] font-black uppercase sm:text-xs ${selected ? "text-white/75" : "text-neutral-500"}`}>{item.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}</span>
                            <span className="mt-1 text-xl font-black leading-none sm:text-3xl">{item.getDate()}</span>
                            <span className={`mt-1 hidden text-[10px] sm:block ${selected ? "text-white/65" : "text-neutral-400"}`}>{item.toLocaleDateString("es-CL", { month: "short" }).replace(".", "")}</span>
                          </button>
                        );
                      })}
                    </div>
                    <button aria-label="Fechas posteriores" className="focus-ring grid h-10 w-8 place-items-center rounded-lg bg-[#eef5f3] text-2xl font-light text-neutral-700 transition hover:bg-[#dce9e5] sm:h-12 sm:w-11" type="button" onClick={() => moveCalendar(1)}>›</button>
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  {([["morning", "Mañana"], ["afternoon", "Tarde"], ["night", "Noche"]] as const).map(([key, label]) => (
                    <div key={key}>
                      <h3 className="eyebrow text-neutral-500">{label}</h3>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {grouped[key].map((slot) => (
                          <button type="button" key={slot.id} onClick={() => { setTime(slot.time_24); setFieldErrors((current) => { const next = { ...current }; delete next.time; return next; }); }} className={`focus-ring min-h-11 rounded-lg border px-3 text-sm font-black transition ${time === slot.time_24 ? "border-teal-950 bg-teal-950 text-white" : "border-[#dce9e5] bg-white hover:bg-[#eef5f3]"}`}>{formatTime(slot.time_24)}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {availabilityLoading && <p className="mt-5 rounded-lg border border-[#dce9e5] bg-white px-4 py-3 text-sm font-bold text-neutral-500">Consultando disponibilidad...</p>}
                {!availabilityLoading && slots.length === 0 && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">No hay horas disponibles para este día.</p>}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep("services")}>Volver</Button>
                  <Button disabled={!time || availabilityLoading} onClick={() => setStep("contact")}>Continuar</Button>
                </div>
              </section>
            )}

            {step === "contact" && service && (
              <section key="contact" className="animate-[step-in_220ms_ease-out]">
                <div className="rounded-lg border border-[#dce9e5] bg-[#eef5f3]/70 p-5">
                  <p className="eyebrow">Resumen</p>
                  <h2 className="section-title mt-2">{service.name}</h2>
                  <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
                    <p><b>Fecha:</b> {dateLabel}</p>
                    <p><b>Hora:</b> {formatTime(time)}</p>
                    <p><b>Barbero:</b> {settings?.barber_name}</p>
                    <p className="font-black text-teal-950">Precio: {formatPrice(service.price)}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {([["name", "Nombre *"], ["lastName", "Apellido *"], ["email", "Correo *"], ["phone", "Teléfono *"]] as const).map(([key, label]) => (
                    <label key={key} className="grid gap-2 text-sm font-bold text-neutral-700">
                      {label}
                      <input className={`focus-ring min-h-11 rounded-lg border px-4 transition ${fieldErrors[key] ? "border-red-300 bg-red-50" : form[key] ? "border-teal-200 bg-white" : "border-[#dce9e5] bg-white"}`} value={form[key]} onBlur={validateForm} onChange={(event) => { if (key === "phone") handlePhoneChange(event.currentTarget.value); else { setForm({ ...form, [key]: event.target.value }); setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next; }); } }} onKeyDown={key === "phone" ? handlePhoneKeyDown : undefined} onPaste={key === "phone" ? handlePhonePaste : undefined} maxLength={key === "phone" ? 9 : undefined} inputMode={key === "phone" ? "numeric" : undefined} pattern={key === "phone" ? "[0-9]*" : undefined} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} autoComplete={key === "email" ? "email" : key === "phone" ? "tel" : "off"} />
                      {fieldErrors[key] && <span className="text-xs font-bold text-red-700">{fieldErrors[key]}</span>}
                    </label>
                  ))}
                  <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">
                    Observaciones <span className="font-normal text-neutral-500">(opcional)</span>
                    <textarea className="focus-ring min-h-28 resize-none rounded-lg border border-[#dce9e5] bg-white px-4 py-3" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
                  </label>
                </div>
                {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep("datetime")}>Volver</Button>
                  <Button disabled={loading || !canBook} onClick={book}>{loading ? "Agendando..." : "Agendar"}</Button>
                </div>
              </section>
            )}
          </DarkPanel>
        </div>
      </section>

      <PublicFooter />

      {pendingService && (
        <Modal title="" compact onClose={() => setPendingService(null)}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-lg font-black leading-tight text-neutral-950">Confirmar {pendingService.name}</h3>
              <p className="mt-1.5 text-sm font-semibold text-neutral-500">{durationLabel(pendingService.duration_minutes)} · {formatPrice(pendingService.price)}</p>
            </div>
            <Button className="w-full shrink-0 sm:w-auto" onClick={confirmService}>Confirmar</Button>
          </div>
        </Modal>
      )}
      {loading && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-neutral-950/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[20px] bg-white p-7 text-center shadow-2xl animate-[sheet-in_220ms_ease-out]">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border-4 border-teal-100 border-t-teal-950 animate-spin" aria-hidden="true" />
            <h2 className="mt-5 section-title text-2xl">Estamos reservando tu hora...</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">Confirmando disponibilidad y registrando tu cita.</p>
          </div>
        </div>
      )}
      {modal === "location" && settings && (
        <Modal title="Ubicación" onClose={() => setModal(null)}>
          <iframe title="Mapa de ELYON BARBER" className="h-72 w-full rounded-lg border border-[#dce9e5]" src={settings.google_maps_embed_url} loading="lazy" />
          <p className="mt-4 font-bold">{settings.business_name}</p>
          <p className="text-neutral-600">{settings.address}</p>
          <p className="mt-3 font-bold text-teal-950">WhatsApp: {settings.whatsapp_phone}</p>
        </Modal>
      )}
      {modal === "hours" && (
        <Modal title="Horario" onClose={() => setModal(null)}>
          <div className="grid gap-3">
            <div className="rounded-lg border border-[#dce9e5] bg-[#eef5f3] p-4"><p className="eyebrow">Lunes a sábado</p><p className="mt-1.5 text-lg font-black text-neutral-950">9:00 hrs a 20:00 hrs</p></div>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"><p className="eyebrow text-neutral-500">Domingo</p><p className="mt-1.5 text-lg font-black text-neutral-950">Cerrado</p></div>
          </div>
        </Modal>
      )}
      {modal === "success" && service && (
        <Modal title="Cita agendada" onClose={closeSuccess}>
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal-950 text-2xl text-white animate-[check-pop_320ms_ease-out]">✓</div>
            <h3 className="mt-5 section-title">Todo listo, {form.name}</h3>
            <p className="mt-3 text-sm leading-6 text-neutral-600">Tu reserva para <strong>{service.name}</strong> quedó registrada para el <strong>{dateLabel}</strong> a las <strong>{formatTime(time)}</strong>.</p>
            {emailWarning && <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-800">{emailWarning}</p>}
            <Button className="mt-6 w-full" onClick={closeSuccess}>Aceptar</Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
