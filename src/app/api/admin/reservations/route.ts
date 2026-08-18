import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
const allowedStatuses = new Set(["confirmed", "pending", "cancelled"]);

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(5, Math.max(1, Number(url.searchParams.get("pageSize") ?? 5) || 5));
  const { data, error } = await getSupabaseAdmin().rpc("admin_search_reservations", { p_search: search, p_page: page, p_page_size: pageSize });
  if (error) return Response.json({ error: "No se pudo consultar las reservas. Ejecuta la migración supabase/2026-08-17-admin-and-reservation-functions.sql en Supabase." }, { status: 500 });
  const total = Number(data?.[0]?.total_count ?? 0);
  return Response.json({ reservations: data ?? [], page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
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