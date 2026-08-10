import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const [{ data: days }, { data: slots }, { data: blockedDays }, { data: blockedSlots }] = await Promise.all([
    supabase.from("availability_days").select("*").order("day_of_week"),
    supabase.from("availability_slots").select("*").order("day_of_week").order("time_24"),
    supabase.from("blocked_days").select("*").order("date"),
    supabase.from("blocked_slots").select("*").order("date").order("time_24"),
  ]);
  return Response.json({ days, slots, blockedDays, blockedSlots });
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body.type === "slot") {
    const { data, error } = await supabase.from("availability_slots").insert({
      day_of_week: Number(body.day_of_week),
      time_24: body.time_24,
      period: body.period,
      active: true,
    }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ slot: data });
  }

  if (body.type === "blocked_day") {
    const { data, error } = await supabase.from("blocked_days").insert({ date: body.date, reason: body.reason }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ blockedDay: data });
  }

  if (body.type === "blocked_slot") {
    const { data, error } = await supabase.from("blocked_slots").insert({ date: body.date, time_24: body.time_24, reason: body.reason }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ blockedSlot: data });
  }

  return Response.json({ error: "Tipo invalido." }, { status: 400 });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("availability_days").update({ active: body.active }).eq("day_of_week", body.day_of_week).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ day: data });
}

export async function DELETE(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const table = url.searchParams.get("table");
  const id = url.searchParams.get("id");
  if (!id || !table) return Response.json({ error: "Datos requeridos." }, { status: 400 });
  if (!["availability_slots", "blocked_days", "blocked_slots"].includes(table)) {
    return Response.json({ error: "Tabla invalida." }, { status: 400 });
  }
  const { error } = await getSupabaseAdmin().from(table).delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
