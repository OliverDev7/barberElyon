import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin().from("business_settings").select("*").limit(1).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const supabase = getSupabaseAdmin();
  const { data: current } = await supabase.from("business_settings").select("id").limit(1).single();
  const { data, error } = await supabase.from("business_settings").update({ ...body, updated_at: new Date().toISOString() }).eq("id", current?.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}
