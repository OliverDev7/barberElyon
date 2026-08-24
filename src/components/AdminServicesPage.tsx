"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminStandaloneSidebar } from "./AdminStandaloneSidebar";
import { Button, Panel, StatusPill } from "./ui";
import { durationLabel, formatPrice } from "@/lib/format";

type Service = { id: string; name: string; duration_minutes: number; price: number; discount_price: number | null; discount_active: boolean; description: string; active: boolean; sort_order: number };
type Form = Omit<Service, "id"> & { id: string };

type ServicesResponse = { services?: Service[]; error?: string };

const input = "h-11 w-full rounded-lg border border-[#dce9e5] bg-white px-3.5 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-teal-200 focus:border-teal-900 focus:ring-4 focus:ring-teal-50";
const textarea = "min-h-24 w-full rounded-lg border border-[#dce9e5] bg-white px-3.5 py-3 text-sm font-semibold text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-teal-200 focus:border-teal-900 focus:ring-4 focus:ring-teal-50";
const empty = (): Form => ({ id: "", name: "", duration_minutes: 60, price: 12000, discount_price: null, discount_active: false, description: "", active: true, sort_order: 99 });

export function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]); const [form, setForm] = useState<Form>(empty()); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");

  const load = useCallback(async (): Promise<ServicesResponse> => {
    const response = await fetch("/api/admin/services", { cache: "no-store" });
    const data = (await response.json()) as ServicesResponse;
    if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los servicios.");
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    load()
      .then((data) => {
        if (cancelled) return;
        setServices(data.services ?? []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "No se pudieron cargar los servicios.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function refreshServices() {
    setLoading(true);
    setError("");
    try {
      const data = await load();
      setServices(data.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los servicios.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try { const response = await fetch("/api/admin/services", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el servicio."); setForm(empty()); setMessage("Servicio guardado correctamente."); await refreshServices(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el servicio."); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar este servicio? Las reservas históricas conservarán su precio.")) return;
    try { const response = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo eliminar."); setMessage("Servicio eliminado."); setForm(empty()); await refreshServices(); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo eliminar."); }
  }

  const finalPrice = form.discount_active && form.discount_price !== null && form.discount_price < form.price ? form.discount_price : form.price;

  return <AdminStandaloneSidebar><div className="grid gap-6">
    {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}{message && <div role="status" className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950">{message}</div>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-neutral-400">Catálogo</p><h2 className="section-title mt-1">Servicios</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Administra precios y ofertas sin cambiar la estructura visual del sitio público.</p></div><Button onClick={() => setForm(empty())}>Nuevo servicio</Button></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel><div className="grid gap-3">{loading ? <div className="grid gap-3">{[1,2,3].map((n) => <div key={n} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />)}</div> : services.map((service) => { const hasDiscount = service.discount_active && service.discount_price !== null && service.discount_price < service.price; return <article key={service.id} className="rounded-2xl border border-neutral-100 bg-white p-4 transition hover:border-teal-100 hover:shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef5f3] text-lg text-teal-950">✂</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{service.name}</h3><StatusPill tone={service.active ? "green" : "gray"}>{service.active ? "Activo" : "Inactivo"}</StatusPill>{hasDiscount && <StatusPill tone="red">Oferta</StatusPill>}</div><p className="mt-1 text-sm text-neutral-500">{durationLabel(service.duration_minutes)} · {service.description || "Sin descripción"}</p><div className="mt-3 flex flex-wrap items-baseline gap-2">{hasDiscount ? <><span className="text-sm font-semibold text-neutral-400 line-through">{formatPrice(service.price)}</span><span className="text-2xl font-black text-red-600">{formatPrice(service.discount_price as number)}</span></> : <span className="text-2xl font-black text-teal-950">{formatPrice(service.price)}</span>}</div></div><div className="flex gap-2 sm:shrink-0"><Button variant="ghost" onClick={() => setForm({ ...service })}>Editar</Button><button onClick={() => void remove(service.id)} className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">Eliminar</button></div></div></article>; })}{!loading && !services.length && <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center"><p className="text-sm font-bold text-neutral-500">No hay servicios registrados.</p></div>}</div></Panel>
      <Panel className="h-fit xl:sticky xl:top-24"><div><p className="eyebrow text-neutral-400">Editor</p><h3 className="mt-1 text-xl font-black">{form.id ? "Editar servicio" : "Nuevo servicio"}</h3><p className="mt-2 text-xs leading-5 text-neutral-500">El precio normal permanece como referencia. Si activas la oferta, el nuevo monto se usa para nuevas reservas.</p></div><div className="mt-5 grid gap-3"><label className="grid gap-1.5 text-xs font-black text-neutral-600">Nombre<input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-black text-neutral-600">Duración (min)<input className={input} type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Precio normal<input className={input} type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></label></div><label className="flex items-center gap-3 rounded-xl border border-[#dce9e5] bg-[#eef5f3] p-3 text-sm font-black"><input type="checkbox" checked={form.discount_active} onChange={(e) => setForm({ ...form, discount_active: e.target.checked })} /> Activar descuento</label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Nuevo precio{form.discount_active && <span className="text-red-600">Precio que verá el cliente</span>}<input className={`${input} ${form.discount_active ? "border-red-200 focus:border-red-600 focus:ring-red-50" : ""}`} type="number" min="0" value={form.discount_price ?? ""} onChange={(e) => setForm({ ...form, discount_price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="Ej. 10000" disabled={!form.discount_active} /></label>{form.discount_active && <div className="rounded-xl border border-red-100 bg-red-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-red-500">Vista previa</p><div className="mt-2 flex items-baseline gap-2"><span className="text-sm font-semibold text-neutral-400 line-through">{formatPrice(form.price)}</span><span className="text-2xl font-black text-red-600">{formatPrice(finalPrice)}</span></div></div>}<label className="grid gap-1.5 text-xs font-black text-neutral-600">Descripción<textarea className={textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm font-bold"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Servicio activo</label><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button className="flex-1" onClick={() => void save()} disabled={saving}>{saving ? "Guardando…" : form.id ? "Guardar cambios" : "Crear servicio"}</Button>{form.id && <Button variant="ghost" onClick={() => setForm(empty())}>Cancelar</Button>}</div></div></Panel>
    </div>
  </div></AdminStandaloneSidebar>;
}