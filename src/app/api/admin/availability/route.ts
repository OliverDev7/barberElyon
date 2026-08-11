import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
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
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  if (body.type === "slot") {
    const day = Number(body.day_of_week);
    const time = typeof body.time_24 === "string" ? body.time_24 : "";
    const period = typeof body.period === "string" ? body.period : "";
    if (!Number.isInteger(day) || day < 0 || day > 6 || !/^\d{2}:\d{2}$/.test(time) || !["morning", "afternoon", "night"].includes(period)) return Response.json({ error: "Horario inválido." }, { status: 400 });
    const { data, error } = await supabase.from("availability_slots").insert({ day_of_week: day, time_24: time, period, active: true }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ slot: data });
  }

  if (body.type === "blocked_day") {
    if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return Response.json({ error: "Fecha inválida." }, { status: 400 });
    const { data, error } = await supabase.from("blocked_days").insert({ date: body.date, reason: typeof body.reason === "string" ? body.reason.trim() : null }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ blockedDay: data });
  }

  if (body.type === "blocked_slot") {
    if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || typeof body.time_24 !== "string" || !/^\d{2}:\d{2}$/.test(body.time_24)) return Response.json({ error: "Bloqueo inválido." }, { status: 400 });
    const { data, error } = await supabase.from("blocked_slots").insert({ date: body.date, time_24: body.time_24, reason: typeof body.reason === "string" ? body.reason.trim() : null }).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ blockedSlot: data });
  }

  return Response.json({ error: "Tipo inválido." }, { status: 400 });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  const day = Number(body.day_of_week);
  if (!Number.isInteger(day) || day < 0 || day > 6 || typeof body.active !== "boolean") return Response.json({ error: "Datos de día inválidos." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("availability_days").update({ active: body.active }).eq("day_of_week", day).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ day: data });
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const table = url.searchParams.get("table");
  const id = url.searchParams.get("id");
  if (!id || !table) return Response.json({ error: "Datos requeridos." }, { status: 400 });
  if (!["availability_slots", "blocked_days", "blocked_slots"].includes(table)) return Response.json({ error: "Tabla inválida." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from(table).delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
