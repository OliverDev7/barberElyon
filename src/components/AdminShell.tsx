"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { bookingLink } from "@/data/mockData";
import { durationLabel, formatPrice, formatTime } from "@/lib/format";
import { AdminLink, BrandMark, Button, Panel, StatusPill } from "./ui";

type Service = { id: string; name: string; duration_minutes: number; price: number; description: string; active: boolean; sort_order: number };
type Reservation = { id: string; first_name: string; last_name: string; email: string; phone: string; service_name: string; service_price: number; reservation_date: string; reservation_time: string; observations: string | null; status: string };
type Settings = { business_name: string; barber_name: string; address: string; google_maps_embed_url: string; whatsapp_phone?: string };
type Day = { day_of_week: number; label: string; active: boolean };
type Slot = { id: string; day_of_week: number; time_24: string; period: string; active: boolean };
type ServiceForm = { id: string; name: string; duration_minutes: number | string; price: number | string; description: string; active: boolean; sort_order: number };

const nav = [
  ["Dashboard", "/admin"],
  ["Reservas", "/admin/reservas"],
  ["Clientes", "/admin/clientes"],
  ["Servicios", "/admin/servicios"],
  ["Horarios / Disponibilidad", "/admin/agenda"],
  ["Configuracion", "/admin/configuracion"],
];
const dayNames = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export function AdminShell({ section }: { section: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceForm>({ id: "", name: "", duration_minutes: 60, price: 12000, description: "", active: true, sort_order: 99 });
  const [slotForm, setSlotForm] = useState({ day_of_week: 1, time_24: "09:00", period: "morning" });
  const [blockDay, setBlockDay] = useState({ date: new Date().toISOString().slice(0, 10), reason: "" });
  const [blockSlot, setBlockSlot] = useState({ date: new Date().toISOString().slice(0, 10), time_24: "09:00", reason: "" });
  const [copied, setCopied] = useState(false);
  const title = useMemo(() => nav.find(([label]) => label.toLowerCase() === section)?.[0] ?? "Dashboard", [section]);

  async function loadAll() {
    const [servicesRes, reservationsRes, settingsRes, availabilityRes] = await Promise.all([
      fetch("/api/admin/services"),
      fetch("/api/admin/reservations"),
      fetch("/api/admin/settings"),
      fetch("/api/admin/availability"),
    ]);
    const [servicesData, reservationsData, settingsData, availabilityData] = await Promise.all([servicesRes.json(), reservationsRes.json(), settingsRes.json(), availabilityRes.json()]);
    setServices(servicesData.services ?? []);
    setReservations(reservationsData.reservations ?? []);
    setSelectedReservation((reservationsData.reservations ?? [])[0] ?? null);
    setSettings(settingsData.settings ?? null);
    setDays(availabilityData.days ?? []);
    setSlots(availabilityData.slots ?? []);
  }

  useEffect(() => {
    const id = window.setTimeout(() => void loadAll(), 0);
    return () => window.clearTimeout(id);
  }, []);

  async function saveService() {
    await fetch("/api/admin/services", { method: serviceForm.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(serviceForm) });
    setServiceForm({ id: "", name: "", duration_minutes: 60, price: 12000, description: "", active: true, sort_order: 99 });
    await loadAll();
  }

  async function deleteService(id: string) {
    await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function saveSettings() {
    await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    await loadAll();
  }

  async function toggleDay(day: Day) {
    await fetch("/api/admin/availability", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day_of_week: day.day_of_week, active: !day.active }) });
    await loadAll();
  }

  async function addAvailability(type: "slot" | "blocked_day" | "blocked_slot") {
    const body = type === "slot" ? { type, ...slotForm } : type === "blocked_day" ? { type, ...blockDay } : { type, ...blockSlot };
    await fetch("/api/admin/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await loadAll();
  }

  async function deleteAvailability(table: "availability_slots" | "blocked_days" | "blocked_slots", id: string) {
    await fetch(`/api/admin/availability?table=${table}&id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-teal-100 bg-white p-5 shadow-sm">
      <BrandMark />
      <nav className="mt-8 grid gap-1">{nav.map(([label, href]) => <AdminLink key={href} href={href}>{label}</AdminLink>)}</nav>
      <Link className="mt-auto rounded-md border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950" href="/reservar/elyon-barber">Ver link publico</Link>
    </aside>
  );

  return (
    <main className="min-h-screen bg-[#f7faf8] text-neutral-950">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-40 bg-neutral-950/40 lg:hidden" onClick={() => setOpen(false)}><div className="h-full" onClick={(e) => e.stopPropagation()}>{sidebar}</div></div>}
      <section className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-teal-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <button className="focus-ring rounded-md border border-teal-100 bg-white px-3 py-2 font-black text-teal-950 lg:hidden" onClick={() => setOpen(true)}>Menu</button>
            <div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-950">Dashboard - ELYON BARBER</p><h1 className="font-serif text-3xl font-bold">{title}</h1></div>
            <Button variant="ghost" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }}>Salir</Button>
          </div>
        </header>
        <div className="grid gap-5 p-4 sm:p-6">
          {section === "dashboard" && <><Stats reservations={reservations} /><PopularServices reservations={reservations} /><Reservations reservations={reservations.slice(0, 5)} selected={selectedReservation} setSelected={setSelectedReservation} /></>}
          {section === "agenda" && <><Agenda reservations={reservations} /><Availability days={days} slots={slots} slotForm={slotForm} setSlotForm={setSlotForm} toggleDay={toggleDay} addAvailability={addAvailability} deleteAvailability={deleteAvailability} blockDay={blockDay} setBlockDay={setBlockDay} blockSlot={blockSlot} setBlockSlot={setBlockSlot} /></>}
          {section === "reservas" && <Reservations reservations={reservations} selected={selectedReservation} setSelected={setSelectedReservation} />}
          {section === "clientes" && <Clients reservations={reservations} />}
          {section === "servicios" && <Services services={services} form={serviceForm} setForm={setServiceForm} save={saveService} deleteService={deleteService} />}
          {section === "configuracion" && settings && <><Settings settings={settings} setSettings={setSettings} save={saveSettings} /><Panel><h2 className="text-xl font-black">Link de reservas</h2><p className="mt-3 rounded-lg border border-teal-100 bg-teal-50 p-4 font-mono">{bookingLink}</p><Button className="mt-4" onClick={() => { navigator.clipboard?.writeText(bookingLink); setCopied(true); }}>Copiar enlace</Button>{copied && <p className="mt-3 font-bold text-teal-950">Enlace copiado!</p>}</Panel></>}
        </div>
      </section>
    </main>
  );
}

function Stats({ reservations }: { reservations: Reservation[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const todayReservations = reservations.filter((item) => item.reservation_date === today && item.status !== "cancelled");
  const income = reservations.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.service_price, 0);
  const clients = new Set(reservations.map((item) => item.email.toLowerCase())).size;
  const upcoming = reservations.find((item) => `${item.reservation_date} ${item.reservation_time}` >= `${today} 00:00`);
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Reservas de hoy", String(todayReservations.length)], ["Proxima reserva", upcoming ? `${upcoming.reservation_date} ${formatTime(upcoming.reservation_time)}` : "-"], ["Clientes", String(clients)], ["Ingresos generados", formatPrice(income)]].map(([a, b]) => <Panel key={a}><p className="text-sm font-bold text-neutral-500">{a}</p><p className="mt-3 text-3xl font-black text-teal-950">{b}</p></Panel>)}</div>;
}

function PopularServices({ reservations }: { reservations: Reservation[] }) {
  const counts = reservations.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.service_name]: (acc[item.service_name] ?? 0) + 1 }), {});
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return <Panel><h2 className="mb-4 text-xl font-black">Servicios mas reservados</h2><div className="grid gap-2">{rows.length ? rows.map(([name, count]) => <div className="flex justify-between rounded-lg border border-neutral-200 p-3" key={name}><b>{name}</b><span>{count} reservas</span></div>) : <p className="text-neutral-500">Sin reservas aun.</p>}</div></Panel>;
}

function Reservations({ reservations, selected, setSelected }: { reservations: Reservation[]; selected: Reservation | null; setSelected: (r: Reservation) => void }) {
  return <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Panel><h2 className="mb-4 text-xl font-black">Reservas</h2><div className="grid gap-3">{reservations.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="rounded-lg border border-neutral-200 bg-white p-4 text-left hover:bg-teal-50"><b>{item.first_name} {item.last_name}</b><p className="text-sm text-neutral-600">{item.service_name} - {item.reservation_date} - {formatTime(item.reservation_time)}</p><p className="text-sm font-bold text-teal-950">{formatPrice(item.service_price)}</p><StatusPill>{item.status}</StatusPill></button>)}</div></Panel>{selected && <Panel><h2 className="font-serif text-3xl font-bold">{selected.first_name} {selected.last_name}</h2><div className="mt-5 grid gap-2"><p><b>Nombre:</b> {selected.first_name}</p><p><b>Apellido:</b> {selected.last_name}</p><p><b>Correo:</b> {selected.email}</p><p><b>Telefono:</b> {selected.phone}</p><p><b>Servicio:</b> {selected.service_name}</p><p><b>Fecha:</b> {selected.reservation_date}</p><p><b>Hora:</b> {formatTime(selected.reservation_time)}</p><p><b>Precio:</b> {formatPrice(selected.service_price)}</p><p><b>Estado:</b> {selected.status}</p><p><b>Observaciones:</b> {selected.observations || "Sin observaciones"}</p></div></Panel>}</div>;
}

function Clients({ reservations }: { reservations: Reservation[] }) {
  const clients = Object.values(reservations.reduce<Record<string, { name: string; email: string; phone: string; count: number; last: string }>>((acc, item) => {
    const key = item.email.toLowerCase();
    acc[key] = { name: `${item.first_name} ${item.last_name}`, email: item.email, phone: item.phone, count: (acc[key]?.count ?? 0) + 1, last: item.reservation_date };
    return acc;
  }, {}));
  return <Panel><h2 className="mb-4 text-xl font-black">Clientes</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{clients.map((client) => <div className="rounded-lg border border-neutral-200 p-4" key={client.email}><b>{client.name}</b><p className="text-sm text-neutral-500">{client.email}</p><p className="text-sm text-neutral-500">{client.phone}</p><p className="mt-3 font-bold text-teal-950">{client.count} reservas</p><p className="text-sm text-neutral-500">Ultima: {client.last}</p></div>)}</div></Panel>;
}

function Agenda({ reservations }: { reservations: Reservation[] }) {
  return <Panel><h2 className="mb-4 text-xl font-black">Agenda</h2><div className="grid gap-2">{reservations.map((item) => <div key={item.id} className="grid grid-cols-[92px_1fr] gap-3 rounded-lg border border-neutral-200 p-3"><b className="text-teal-950">{formatTime(item.reservation_time)}</b><div><p className="font-bold">{item.first_name} {item.last_name}</p><p className="text-sm text-neutral-500">{item.service_name}</p></div></div>)}</div></Panel>;
}

function Services({ services, form, setForm, save, deleteService }: { services: Service[]; form: ServiceForm; setForm: (f: ServiceForm) => void; save: () => void; deleteService: (id: string) => void }) {
  return <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]"><Panel><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">Servicios</h2><Button variant="ghost" onClick={() => setForm({ id: "", name: "", duration_minutes: 60, price: 12000, description: "", active: true, sort_order: 99 })}>Nuevo</Button></div><div className="grid gap-3 sm:grid-cols-2">{services.map((item) => <button key={item.id} onClick={() => setForm(item)} className="rounded-lg border border-neutral-200 p-4 text-left hover:bg-teal-50"><b>{item.name}</b><p>{formatPrice(item.price)} - {durationLabel(item.duration_minutes)}</p><p className="text-sm text-neutral-500">({item.description})</p><p className="mt-3 text-sm font-bold text-teal-950">{item.active ? "Activo" : "Inactivo"}</p></button>)}</div></Panel><Panel><h2 className="text-xl font-black">{form.id ? "Editar servicio" : "Nuevo servicio"}</h2><div className="mt-4 grid gap-3"><input className="rounded-lg border p-3" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input className="rounded-lg border p-3" type="number" placeholder="Duracion minutos" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /><input className="rounded-lg border p-3" type="number" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /><textarea className="rounded-lg border p-3" placeholder="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /><label className="flex gap-2"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Activo</label><Button onClick={save}>Guardar servicio</Button>{form.id && <Button variant="ghost" onClick={() => deleteService(form.id)}>Eliminar servicio</Button>}</div></Panel></div>;
}

function Availability(props: { days: Day[]; slots: Slot[]; slotForm: { day_of_week: number; time_24: string; period: string }; setSlotForm: (value: { day_of_week: number; time_24: string; period: string }) => void; toggleDay: (day: Day) => void; addAvailability: (type: "slot" | "blocked_day" | "blocked_slot") => void; deleteAvailability: (table: "availability_slots" | "blocked_days" | "blocked_slots", id: string) => void; blockDay: { date: string; reason: string }; setBlockDay: (value: { date: string; reason: string }) => void; blockSlot: { date: string; time_24: string; reason: string }; setBlockSlot: (value: { date: string; time_24: string; reason: string }) => void }) {
  return <><Panel><h2 className="mb-4 text-xl font-black">Dias disponibles</h2><div className="grid gap-3">{props.days.map((day) => <button key={day.day_of_week} onClick={() => props.toggleDay(day)} className="rounded-lg border border-neutral-200 p-3 text-left hover:bg-teal-50"><b>{day.label}</b><p>{day.active ? "Disponible" : "No disponible"}</p></button>)}</div></Panel><Panel><h2 className="text-xl font-black">Agregar horario</h2><div className="mt-4 grid gap-3 sm:grid-cols-4"><select className="rounded-lg border p-3" value={props.slotForm.day_of_week} onChange={(e) => props.setSlotForm({ ...props.slotForm, day_of_week: Number(e.target.value) })}>{dayNames.map((d, i) => <option key={d} value={i}>{d}</option>)}</select><input className="rounded-lg border p-3" type="time" value={props.slotForm.time_24} onChange={(e) => props.setSlotForm({ ...props.slotForm, time_24: e.target.value })} /><select className="rounded-lg border p-3" value={props.slotForm.period} onChange={(e) => props.setSlotForm({ ...props.slotForm, period: e.target.value })}><option value="morning">Manana</option><option value="afternoon">Tarde</option><option value="night">Noche</option></select><Button onClick={() => props.addAvailability("slot")}>Agregar</Button></div><div className="mt-5 flex flex-wrap gap-2">{props.slots.map((slot) => <button className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-950" key={slot.id} onClick={() => props.deleteAvailability("availability_slots", slot.id)}>{dayNames[slot.day_of_week]} {formatTime(slot.time_24)} x</button>)}</div></Panel><Panel><h2 className="text-xl font-black">Bloqueos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="rounded-lg border p-3" type="date" value={props.blockDay.date} onChange={(e) => props.setBlockDay({ ...props.blockDay, date: e.target.value })} /><input className="rounded-lg border p-3" placeholder="Motivo" value={props.blockDay.reason} onChange={(e) => props.setBlockDay({ ...props.blockDay, reason: e.target.value })} /><Button onClick={() => props.addAvailability("blocked_day")}>Bloquear dia</Button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><input className="rounded-lg border p-3" type="date" value={props.blockSlot.date} onChange={(e) => props.setBlockSlot({ ...props.blockSlot, date: e.target.value })} /><input className="rounded-lg border p-3" type="time" value={props.blockSlot.time_24} onChange={(e) => props.setBlockSlot({ ...props.blockSlot, time_24: e.target.value })} /><input className="rounded-lg border p-3" placeholder="Motivo" value={props.blockSlot.reason} onChange={(e) => props.setBlockSlot({ ...props.blockSlot, reason: e.target.value })} /><Button onClick={() => props.addAvailability("blocked_slot")}>Bloquear horario</Button></div></Panel></>;
}

function Settings({ settings, setSettings, save }: { settings: Settings; setSettings: (s: Settings) => void; save: () => void }) {
  return <Panel><h2 className="text-xl font-black">Configuracion</h2><div className="mt-4 grid gap-3"><input className="rounded-lg border p-3" value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} /><input className="rounded-lg border p-3" value={settings.barber_name} onChange={(e) => setSettings({ ...settings, barber_name: e.target.value })} /><input className="rounded-lg border p-3" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /><input className="rounded-lg border p-3" value={settings.whatsapp_phone ?? ""} onChange={(e) => setSettings({ ...settings, whatsapp_phone: e.target.value })} /><input className="rounded-lg border p-3" value={settings.google_maps_embed_url} onChange={(e) => setSettings({ ...settings, google_maps_embed_url: e.target.value })} /><Button onClick={save}>Guardar configuracion</Button></div></Panel>;
}
