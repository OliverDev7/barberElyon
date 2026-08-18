import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(10, Math.max(1, Number(url.searchParams.get("pageSize") ?? 10) || 10));
  const { data, error } = await getSupabaseAdmin().rpc("admin_search_clients", { p_search: search, p_page: page, p_page_size: pageSize });
  if (error) return Response.json({ error: "No se pudo consultar la lista de clientes. Ejecuta la migración supabase/2026-08-17-admin-and-reservation-functions.sql en Supabase." }, { status: 500 });
  const total = Number(data?.[0]?.total_count ?? 0);
  return Response.json({ clients: data ?? [], page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}