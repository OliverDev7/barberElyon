import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from("bible_verse_settings").select("book,chapter,verse,text,reference,translation,show_footer,show_email").limit(1).single();
  if (error) return Response.json({ verse: null }, { status: 200 });
  return Response.json({ verse: data?.show_footer ? data : null });
}