import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin().from("reservations").select("*").order("reservation_date").order("reservation_time");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reservations: data });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const { data, error } = await getSupabaseAdmin().from("reservations").update({ status: body.status }).eq("id", body.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reservation: data });
}
