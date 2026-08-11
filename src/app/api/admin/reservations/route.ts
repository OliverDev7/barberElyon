import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const allowedStatuses = new Set(["confirmed", "pending", "cancelled"]);

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { data, error } = await getSupabaseAdmin().from("reservations").select("*").order("reservation_date").order("reservation_time");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reservations: data });
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const body = await request.json();
  if (typeof body.id !== "string" || !body.id) return Response.json({ error: "ID requerido." }, { status: 400 });
  if (typeof body.status !== "string" || !allowedStatuses.has(body.status)) return Response.json({ error: "Estado de reserva inválido." }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("reservations").update({ status: body.status }).eq("id", body.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reservation: data });
}
