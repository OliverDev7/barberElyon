import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const fields = ["book", "chapter", "verse", "text", "reference", "translation", "show_footer", "show_email"] as const;

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { data, error } = await getSupabaseAdmin().from("bible_verse_settings").select("*").limit(1).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ verse: data });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const changes = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  if (typeof changes.book !== "string" || typeof changes.text !== "string" || typeof changes.reference !== "string") return Response.json({ error: "Libro, texto y referencia son obligatorios." }, { status: 400 });
  if (!changes.book.trim() || !changes.text.trim() || !changes.reference.trim()) return Response.json({ error: "Libro, texto y referencia no pueden quedar vacíos." }, { status: 400 });
  if (!Number.isInteger(Number(changes.chapter)) || Number(changes.chapter) < 1 || !Number.isInteger(Number(changes.verse)) || Number(changes.verse) < 1) return Response.json({ error: "Capítulo y versículo deben ser números válidos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: current, error: currentError } = await supabase.from("bible_verse_settings").select("id").limit(1).single();
  if (currentError || !current) return Response.json({ error: currentError?.message ?? "No existe la configuración del versículo. Ejecuta la migración de Supabase." }, { status: 500 });

  const normalized = {
    ...changes,
    book: String(changes.book).trim(),
    chapter: Number(changes.chapter),
    verse: Number(changes.verse),
    text: String(changes.text).trim(),
    reference: String(changes.reference).trim(),
    translation: String(changes.translation ?? "Reina-Valera 1909").trim() || "Reina-Valera 1909",
    show_footer: Boolean(changes.show_footer),
    show_email: Boolean(changes.show_email),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("bible_verse_settings").update(normalized).eq("id", current.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ verse: data });
}