"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminStandaloneSidebar } from "./AdminStandaloneSidebar";
import { Button, Panel } from "./ui";

type VerseSettings = { book: string; chapter: number; verse: number; text: string; reference: string; translation: string; show_footer: boolean; show_email: boolean };
type Book = { id: number | string; name?: string; nameLong?: string };
type Chapter = { id: number | string; number?: number; reference?: string };
type Verse = { id: number | string; number?: number; reference?: string };

const emptyVerse: VerseSettings = { book: "Romanos", chapter: 15, verse: 13, text: "", reference: "Romanos 15:13", translation: "Reina-Valera 1909", show_footer: true, show_email: true };
const input = "h-11 w-full rounded-xl border border-[#dce9e5] bg-white px-3.5 text-sm font-semibold text-neutral-900 outline-none transition hover:border-teal-200 focus:border-teal-900 focus:ring-4 focus:ring-teal-50";
const textarea = "min-h-40 w-full resize-y rounded-xl border border-[#dce9e5] bg-white px-3.5 py-3 text-sm font-semibold leading-6 text-neutral-900 outline-none transition hover:border-teal-200 focus:border-teal-900 focus:ring-4 focus:ring-teal-50";

function textFromVerse(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const item = value as Record<string, unknown>;
  for (const candidate of [item.text, item.content, item.body, item.verseText, item.value]) if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  if (Array.isArray(item.verses)) return item.verses.map(textFromVerse).filter(Boolean).join(" ");
  return "";
}

export function AdminVersesPage() {
  const [verse, setVerse] = useState<VerseSettings>(emptyVerse);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentBook = useMemo(() => books.find((book) => String(book.nameLong ?? book.name) === verse.book), [books, verse.book]);
  const currentChapter = useMemo(() => chapters.find((chapter) => Number(chapter.number) === verse.chapter), [chapters, verse.chapter]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [settingsResponse, booksResponse] = await Promise.all([fetch("/api/admin/verse-settings", { cache: "no-store" }), fetch("/api/admin/bible?action=books", { cache: "no-store" })]);
        const settingsData = await settingsResponse.json(); const booksData = await booksResponse.json();
        if (!settingsResponse.ok) throw new Error(settingsData.error ?? "No se pudo cargar la configuración.");
        if (!booksResponse.ok) throw new Error(booksData.error ?? "No se pudieron cargar los libros.");
        if (!active) return;
        if (settingsData.verse) setVerse(settingsData.verse);
        setBooks(booksData.books ?? []);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "No se pudo cargar la configuración."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!currentBook) return;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/bible?action=chapters&bookId=${encodeURIComponent(String(currentBook.id))}`, { cache: "no-store" });
        const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los capítulos.");
        setChapters(data.chapters ?? []);
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los capítulos."); }
    })();
  }, [currentBook]);

  useEffect(() => {
    if (!currentBook || !currentChapter) return;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/bible?action=verses&bookId=${encodeURIComponent(String(currentBook.id))}&chapterId=${encodeURIComponent(String(currentChapter.id))}`, { cache: "no-store" });
        const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los versículos.");
        setVerses(data.verses ?? []);
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los versículos."); }
    })();
  }, [currentBook, currentChapter]);

  async function chooseVerse(selected: Verse) {
    if (!currentBook || !currentChapter) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/bible?action=verse&bookId=${encodeURIComponent(String(currentBook.id))}&chapterId=${encodeURIComponent(String(currentChapter.id))}&verseId=${encodeURIComponent(String(selected.id))}`, { cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo obtener el texto del versículo.");
      const chapterNumber = Number(currentChapter.number ?? verse.chapter); const verseNumber = Number(selected.number ?? verse.verse);
      setVerse((current) => ({ ...current, book: String(currentBook.nameLong ?? currentBook.name ?? current.book), chapter: chapterNumber, verse: verseNumber, text: textFromVerse(data.verse) || current.text, reference: `${currentBook.nameLong ?? currentBook.name ?? current.book} ${chapterNumber}:${verseNumber}` }));
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo obtener el texto. Puedes introducirlo manualmente."); }
  }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/verse-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(verse) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el versículo.");
      setVerse(data.verse); setMessage("Versículo guardado correctamente. Los nuevos correos y el footer usarán esta configuración.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el versículo."); }
    finally { setSaving(false); }
  }

  return <AdminStandaloneSidebar><div className="grid gap-6">
    <div className="grid gap-2 sm:flex sm:items-end sm:justify-between"><div><p className="eyebrow text-neutral-400">Contenido y comunicaciones</p><h2 className="section-title mt-1">Versículos bíblicos</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Selecciona el versículo que quieres mostrar en el Footer y en los correos de confirmación de Elyon Barber.</p></div><div className="rounded-full border border-[#dce9e5] bg-[#eef5f3] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-teal-900">Reina-Valera 1909</div></div>
    {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950">{message}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-6">
        <Panel><div className="flex items-center justify-between gap-3"><div><p className="eyebrow text-neutral-400">Selector bíblico</p><h3 className="mt-1 text-xl font-black">Buscar un versículo</h3></div><span className="hidden rounded-full bg-neutral-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-neutral-500 sm:block">Consulta online</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><label className="grid gap-1.5 text-xs font-black text-neutral-600">Libro<select className={input} value={String(currentBook?.id ?? "")} onChange={(e) => { const book = books.find((b) => String(b.id) === e.target.value); if (book) { const name = String(book.nameLong ?? book.name ?? ""); setVerse((v) => ({ ...v, book: name, chapter: 1, verse: 1, reference: `${name} 1:1` })); setChapters([]); setVerses([]); } }}>{books.map((book) => <option key={book.id} value={book.id}>{book.nameLong ?? book.name}</option>)}</select></label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Capítulo<select className={input} value={String(currentChapter?.id ?? "")} onChange={(e) => { const chapter = chapters.find((item) => String(item.id) === e.target.value); if (chapter) { const number = Number(chapter.number ?? 1); setVerse((v) => ({ ...v, chapter: number, verse: 1, reference: `${v.book} ${number}:1` })); } }}>{chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.number ?? chapter.reference}</option>)}</select></label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Versículo<select className={input} value={String(verses.find((item) => Number(item.number) === verse.verse)?.id ?? "")} onChange={(e) => { const selected = verses.find((item) => String(item.id) === e.target.value); if (selected) void chooseVerse(selected); }}>{verses.map((item) => <option key={item.id} value={item.id}>{item.number ?? item.reference}</option>)}</select></label></div><p className="mt-3 text-xs leading-5 text-neutral-400">Si la consulta online no responde, puedes escribir la referencia y el texto manualmente.</p></Panel>
        <Panel><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-black text-neutral-600">Referencia<input className={input} value={verse.reference} onChange={(e) => setVerse({ ...verse, reference: e.target.value })} placeholder="Juan 3:16" /></label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Traducción<input className={input} value={verse.translation} onChange={(e) => setVerse({ ...verse, translation: e.target.value })} /></label><label className="grid gap-1.5 text-xs font-black text-neutral-600 sm:col-span-2">Texto del versículo<textarea className={textarea} value={verse.text} onChange={(e) => setVerse({ ...verse, text: e.target.value })} placeholder="Escribe aquí el texto del versículo…" /></label></div></Panel>
        <Panel><p className="eyebrow text-neutral-400">Publicación</p><h3 className="mt-1 text-xl font-black">¿Dónde quieres mostrarlo?</h3><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${verse.show_footer ? "border-teal-200 bg-teal-50" : "border-neutral-200 bg-neutral-50"}`}><input className="mt-0.5 h-5 w-5 accent-teal-900" type="checkbox" checked={verse.show_footer} onChange={(e) => setVerse({ ...verse, show_footer: e.target.checked })} /><span><b className="block">Footer del sitio</b><small className="mt-1 block font-medium leading-5 text-neutral-500">Aparece al pie de las páginas públicas.</small></span></label><label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${verse.show_email ? "border-teal-200 bg-teal-50" : "border-neutral-200 bg-neutral-50"}`}><input className="mt-0.5 h-5 w-5 accent-teal-900" type="checkbox" checked={verse.show_email} onChange={(e) => setVerse({ ...verse, show_email: e.target.checked })} /><span><b className="block">Correos de reserva</b><small className="mt-1 block font-medium leading-5 text-neutral-500">Se incluye en nuevos correos enviados al cliente.</small></span></label></div></Panel>
      </div>
      <div className="grid gap-6 xl:sticky xl:top-24 xl:self-start"><Panel className="overflow-hidden p-0"><div className="bg-teal-950 p-5 text-white sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Vista previa</p><p className="mt-4 text-lg font-black leading-7">{verse.reference || "Referencia del versículo"}</p></div><div className="p-5 sm:p-6"><blockquote className="font-serif text-lg leading-8 text-neutral-700">{verse.text || "El texto del versículo aparecerá aquí."}</blockquote><p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-neutral-400">{verse.translation || "Traducción"}</p><div className="mt-6 grid gap-2 rounded-xl bg-neutral-50 p-4 text-sm"><div className="flex justify-between gap-3"><span className="text-neutral-500">Footer</span><b>{verse.show_footer ? "Activado" : "Desactivado"}</b></div><div className="flex justify-between gap-3"><span className="text-neutral-500">Correo</span><b>{verse.show_email ? "Activado" : "Desactivado"}</b></div></div></div></Panel><Button className="w-full" onClick={() => void save()} disabled={saving || loading}>{saving ? "Guardando…" : "Guardar versículo"}</Button></div>
    </div>
  </div></AdminStandaloneSidebar>;
}