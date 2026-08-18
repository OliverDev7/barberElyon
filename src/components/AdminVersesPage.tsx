"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Panel } from "./ui";

type VerseSettings = { book: string; chapter: number; verse: number; text: string; reference: string; translation: string; show_footer: boolean; show_email: boolean };
type Book = { id: number | string; name?: string; nameLong?: string };
type Chapter = { id: number | string; number?: number; reference?: string };
type Verse = { id: number | string; number?: number; reference?: string };

const emptyVerse: VerseSettings = { book: "Romanos", chapter: 15, verse: 13, text: "", reference: "Romanos 15:13", translation: "Reina-Valera 1909", show_footer: true, show_email: true };
const input = "h-11 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none transition hover:border-neutral-400 focus:border-teal-800 focus:ring-4 focus:ring-teal-50";
const textarea = "min-h-32 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none transition hover:border-neutral-400 focus:border-teal-800 focus:ring-4 focus:ring-teal-50";

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
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const currentBook = useMemo(() => books.find((b) => String(b.nameLong ?? b.name) === verse.book), [books, verse.book]);
  const currentChapter = useMemo(() => chapters.find((c) => Number(c.number) === verse.chapter), [chapters, verse.chapter]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [settingsResponse, booksResponse] = await Promise.all([fetch("/api/admin/verse-settings", { cache: "no-store" }), fetch("/api/admin/bible?action=books", { cache: "no-store" })]);
        const settingsData = await settingsResponse.json();
        const booksData = await booksResponse.json();
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
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los capítulos.");
        setChapters(data.chapters ?? []);
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los capítulos."); }
    })();
  }, [currentBook?.id]);

  useEffect(() => {
    if (!currentBook || !currentChapter) return;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/bible?action=verses&bookId=${encodeURIComponent(String(currentBook.id))}&chapterId=${encodeURIComponent(String(currentChapter.id))}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudieron cargar los versículos.");
        setVerses(data.verses ?? []);
      } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los versículos."); }
    })();
  }, [currentBook?.id, currentChapter?.id]);

  async function chooseVerse(selected: Verse) {
    if (!currentBook || !currentChapter) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/bible?action=verse&bookId=${encodeURIComponent(String(currentBook.id))}&chapterId=${encodeURIComponent(String(currentChapter.id))}&verseId=${encodeURIComponent(String(selected.id))}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo obtener el texto del versículo.");
      const chapterNumber = Number(currentChapter.number ?? verse.chapter);
      const verseNumber = Number(selected.number ?? verse.verse);
      setVerse((current) => ({ ...current, book: String(currentBook.nameLong ?? currentBook.name ?? current.book), chapter: chapterNumber, verse: verseNumber, text: textFromVerse(data.verse) || current.text, reference: `${currentBook.nameLong ?? currentBook.name ?? current.book} ${chapterNumber}:${verseNumber}` }));
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo obtener el texto. Puedes introducirlo manualmente."); }
  }

  async function save() {
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/verse-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(verse) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el versículo.");
      setVerse(data.verse); setMessage("Versículo guardado. Los nuevos correos y el footer usarán esta configuración.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el versículo."); }
    finally { setLoading(false); }
  }

  if (loading && books.length === 0) return <Panel className="min-h-72"><div className="grid min-h-64 place-items-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-teal-100 border-t-teal-950" /><p className="mt-4 text-sm font-bold text-neutral-500">Cargando versículos…</p></div></div></Panel>;

  return <div className="grid gap-5">
    <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-800">Contenido</p><h2 className="mt-1 font-serif text-3xl font-bold text-neutral-950">Versículos bíblicos</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Elige un versículo o introdúcelo manualmente y decide si aparecerá en el Footer, en los correos o en ambos.</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
    {message && <div role="status" className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-950">{message}</div>}
    <Panel><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Selector</p><h3 className="mt-1 text-lg font-black">Reina-Valera 1909</h3></div><span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-teal-900">Dominio público</span></div><div className="mt-4 grid gap-3 md:grid-cols-3">
      <label className="grid gap-1.5 text-xs font-black text-neutral-600">Libro<select className={input} value={String(currentBook?.id ?? "")} onChange={(e) => { const book = books.find((b) => String(b.id) === e.target.value); if (book) { const name = String(book.nameLong ?? book.name ?? ""); setVerse((v) => ({ ...v, book: name, chapter: 1, verse: 1, reference: `${name} 1:1` })); setChapters([]); setVerses([]); } }}>{books.map((b) => <option key={b.id} value={b.id}>{b.nameLong ?? b.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-xs font-black text-neutral-600">Capítulo<select className={input} value={String(currentChapter?.id ?? "")} onChange={(e) => { const c = chapters.find((item) => String(item.id) === e.target.value); if (c) { const number = Number(c.number ?? 1); setVerse((v) => ({ ...v, chapter: number, verse: 1, reference: `${v.book} ${number}:1` })); } }}>{chapters.map((c) => <option key={c.id} value={c.id}>{c.number ?? c.reference}</option>)}</select></label>
      <label className="grid gap-1.5 text-xs font-black text-neutral-600">Versículo<select className={input} value={String(verses.find((v) => Number(v.number) === verse.verse)?.id ?? "")} onChange={(e) => { const selected = verses.find((v) => String(v.id) === e.target.value); if (selected) void chooseVerse(selected); }}>{verses.map((v) => <option key={v.id} value={v.id}>{v.number ?? v.reference}</option>)}</select></label>
    </div><p className="mt-3 text-xs text-neutral-400">Si el servicio de consulta no responde, puedes utilizar los campos manuales de abajo.</p></Panel>
    <Panel><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-black text-neutral-600">Referencia<input className={input} value={verse.reference} onChange={(e) => setVerse({ ...verse, reference: e.target.value })} placeholder="Juan 3:16" /></label><label className="grid gap-1.5 text-xs font-black text-neutral-600">Traducción<input className={input} value={verse.translation} onChange={(e) => setVerse({ ...verse, translation: e.target.value })} /></label><label className="grid gap-1.5 text-xs font-black text-neutral-600 sm:col-span-2">Texto del versículo<textarea className={textarea} value={verse.text} onChange={(e) => setVerse({ ...verse, text: e.target.value })} placeholder="Escribe aquí el texto del versículo…" /></label></div></Panel>
    <Panel><p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">Dónde mostrarlo</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 text-sm font-bold"><input className="h-5 w-5 accent-teal-900" type="checkbox" checked={verse.show_footer} onChange={(e) => setVerse({ ...verse, show_footer: e.target.checked })} /><span><b className="block">Al pie de página</b><small className="font-medium text-neutral-500">Mostrar el versículo en el Footer.</small></span></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 p-4 text-sm font-bold"><input className="h-5 w-5 accent-teal-900" type="checkbox" checked={verse.show_email} onChange={(e) => setVerse({ ...verse, show_email: e.target.checked })} /><span><b className="block">Al pie del correo</b><small className="font-medium text-neutral-500">Añadirlo a nuevos correos de reserva.</small></span></label></div></Panel>
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="ghost" onClick={() => window.history.back()}>Cancelar</Button><Button onClick={() => void save()} disabled={loading}>{loading ? "Guardando…" : "Guardar versículo"}</Button></div>
  </div>;
}