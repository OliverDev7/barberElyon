"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Panel, StatusPill } from "./ui";
import { formatPrice, formatTime } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price: number; discount_price: number | null; discount_active: boolean };
type Client = { email: string | null; first_name: string; last_name: string; phone: string | null; last_service: string | null; last_reservation_date: string | null; reservations_count: number };

type Availability = { available: boolean; slots: Array<{ time_24: string }> };

const inputClass = "focus-ring min-h-11 w-full rounded-xl border border-[#dce9e5] bg-white px-4 text-sm font-semibold text-neutral-900 outline-none transition focus:border-teal-950";

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function AdminManualBooking() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState("");
  const [availability, setAvailability] = useState<Availability>({ available: false, slots: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/services", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los servicios.");
        setServices(data.services ?? []);
        if (data.services?.[0]) setServiceId(data.services[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudieron cargar los servicios."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim().length < 2) {
        setClients([]);
        return;
      }
      fetch(`/api/admin/clients?search=${encodeURIComponent(search.trim())}&page=1&pageSize=10`, { cache: "no-store" })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "No se pudo buscar el cliente.");
          setClients(data.clients ?? []);
        })
        .catch(() => setClients([]));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!date || !serviceId) {
      setAvailability({ available: false, slots: [] });
      return;
    }
    setTime("");
    fetch(`/api/public/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo cargar la disponibilidad.");
        setAvailability(data);
      })
      .catch(() => setAvailability({ available: false, slots: [] }));
  }, [date, serviceId]);

  const selectedService = useMemo(() => services.find((service) => service.id === serviceId) ?? null, [services, serviceId]);
  const effectivePrice = selectedService ? selectedService.discount_active && selectedService.discount_price !== null && selectedService.discount_price < selectedService.price ? selectedService.discount_price : selectedService.price : 0;

  function chooseClient(client: Client) {
    setSelectedClient(client);
    setNewClient(false);
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setSearch(`${client.first_name} ${client.last_name}`);
    setClients([]);
  }

  function chooseNewClient() {
    setSelectedClient(null);
    setNewClient(true);
    setSearch("");
    setFirstName("");
    setLastName("");
    setClients([]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!firstName.trim() || !lastName.trim()) return setError("Ingresa nombre y apellido del cliente.");
    if (!selectedClient && !newClient) return setError("Selecciona un cliente existente o crea uno nuevo.");
    if (!serviceId || !date || !time) return setError("Selecciona servicio, fecha y hora.");

    setSaving(true);
    try {
      const response = await fetch("/api/admin/manual-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedClient ? undefined : undefined, firstName, lastName, serviceId, date, time }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo crear la reserva.");
      setMessage(`Reserva creada para ${firstName} ${lastName}.`);
      setSelectedClient(null);
      setNewClient(false);
      setSearch("");
      setFirstName("");
      setLastName("");
      setTime("");
      window.setTimeout(() => router.replace("/admin"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Panel className="min-h-72"><div className="grid min-h-64 place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-100 border-t-teal-950" /></div></Panel>;

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Reserva manual</p>
          <h2 className="mt-1 text-2xl font-black">Agendar cliente</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">Usa un cliente existente cuando sea posible. Los clientes nuevos se guardan sin correo ni teléfono y quedan identificados por su ID interno.</p>
        </div>
        <button type="button" onClick={() => router.replace("/admin")} className="text-sm font-bold text-neutral-500 hover:text-teal-950">← Volver al dashboard</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-[#dce9e5] bg-[#eef5f3] px-4 py-3 text-sm font-bold text-teal-950">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">1 · Cliente</p>
          <h3 className="mt-1 text-xl font-black">¿A quién vas a agendar?</h3>
          <div className="mt-5 grid gap-4">
            {!newClient && !selectedClient ? (
              <>
                <label className="grid gap-2 text-sm font-bold text-neutral-700">Buscar cliente<input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, teléfono o correo" autoComplete="off" /></label>
                {clients.length > 0 && <div className="grid gap-2 rounded-2xl border border-[#dce9e5] bg-neutral-50 p-2">{clients.map((client) => <button key={`${client.email ?? "no-email"}-${client.first_name}-${client.last_name}`} type="button" onClick={() => chooseClient(client)} className="rounded-xl p-3 text-left transition hover:bg-white"><p className="font-black text-neutral-950">{client.first_name} {client.last_name}</p><p className="mt-1 text-xs text-neutral-500">{client.phone || client.email || "Sin datos de contacto"}</p></button>)}</div>}
                <div className="flex items-center gap-3"><span className="h-px flex-1 bg-neutral-100" /><span className="text-xs font-bold uppercase tracking-wide text-neutral-400">o</span><span className="h-px flex-1 bg-neutral-100" /></div>
                <Button type="button" variant="ghost" onClick={chooseNewClient}>＋ Cliente nuevo</Button>
              </>
            ) : (
              <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-teal-800">{selectedClient ? "Cliente existente" : "Cliente nuevo"}</p><p className="mt-1 text-lg font-black text-teal-950">{firstName} {lastName}</p>{selectedClient && <p className="mt-1 text-sm text-neutral-500">{selectedClient.phone || selectedClient.email || "Sin datos de contacto"}</p>}</div><button type="button" onClick={() => { setSelectedClient(null); setNewClient(false); setSearch(""); setFirstName(""); setLastName(""); }} className="text-xs font-black text-teal-900">Cambiar</button></div>
              </div>
            )}
            {newClient && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-neutral-700">Nombre<input className={inputClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" /></label><label className="grid gap-2 text-sm font-bold text-neutral-700">Apellido<input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" /></label></div>}
          </div>
        </Panel>

        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">2 · Servicio</p>
          <h3 className="mt-1 text-xl font-black">Qué servicio realizará</h3>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-neutral-700">Servicio<select className={inputClass} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>{services.map((service) => { const discounted = service.discount_active && service.discount_price !== null && service.discount_price < service.price; return <option key={service.id} value={service.id}>{service.name} · {formatPrice(discounted ? service.discount_price : service.price)}</option>; })}</select></label>
            {selectedService && <div className="flex flex-wrap items-center gap-2"><StatusPill tone="gray">{selectedService.duration_minutes} min</StatusPill>{selectedService.discount_active && <StatusPill tone="red">Oferta · {formatPrice(effectivePrice)}</StatusPill>}</div>}
          </div>
        </Panel>
      </div>

      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">3 · Horario</p>
        <h3 className="mt-1 text-xl font-black">Fecha y hora</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-neutral-700">Fecha<input className={inputClass} type="date" min={todayLocal()} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">Hora<select className={inputClass} value={time} onChange={(event) => setTime(event.target.value)} disabled={!availability.available}><option value="">Selecciona una hora</option>{availability.slots.map((slot) => <option key={slot.time_24} value={slot.time_24}>{formatTime(slot.time_24)}</option>)}</select></label>
        </div>
        {!availability.available && <p className="mt-3 text-sm font-semibold text-neutral-500">No hay horarios disponibles para esta fecha y servicio.</p>}
      </Panel>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => router.replace("/admin")} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving || !time}>{saving ? "Agendando…" : "Confirmar reserva"}</Button></div>
    </form>
  );
}
