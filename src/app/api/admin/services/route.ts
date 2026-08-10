import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin().from("services").select("*").order("sort_order");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ services: data });
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("services").insert({
    name: body.name,
    duration_minutes: Number(body.duration_minutes),
    price: Number(body.price),
    description: body.description ?? "",
    active: body.active ?? true,
    sort_order: Number(body.sort_order ?? 99),
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ service: data });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const { id, ...changes } = body;
  const { data, error } = await getSupabaseAdmin().from("services").update({
    ...changes,
    duration_minutes: changes.duration_minutes === undefined ? undefined : Number(changes.duration_minutes),
    price: changes.price === undefined ? undefined : Number(changes.price),
    updated_at: new Date().toISOString(),
  }).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ service: data });
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID requerido." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("services").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
