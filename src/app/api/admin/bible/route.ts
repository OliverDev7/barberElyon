import { requireAdminApi } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const API_BASE = "https://biblia-api.qhar.in";

async function bibleFetch(path: string) {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store", headers: { Accept: "application/json" } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.message === "string" ? data.message : "No se pudo consultar la Biblia.");
  return data;
}

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "books";
  try {
    if (action === "books") return Response.json({ books: await bibleFetch("/book") });
    const bookId = url.searchParams.get("bookId");
    if (!bookId) return Response.json({ error: "Falta el libro." }, { status: 400 });
    if (action === "chapters") return Response.json({ chapters: await bibleFetch(`/book/${encodeURIComponent(bookId)}/chapter`) });
    const chapterId = url.searchParams.get("chapterId");
    if (!chapterId) return Response.json({ error: "Falta el capítulo." }, { status: 400 });
    if (action === "verses") return Response.json({ verses: await bibleFetch(`/book/${encodeURIComponent(bookId)}/chapter/${encodeURIComponent(chapterId)}/verse`) });
    if (action === "verse") {
      const verseId = url.searchParams.get("verseId");
      if (!verseId) return Response.json({ error: "Falta el versículo." }, { status: 400 });
      return Response.json({ verse: await bibleFetch(`/verse/${encodeURIComponent(verseId)}`) });
    }
    return Response.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No se pudo consultar la Biblia." }, { status: 502 });
  }
}