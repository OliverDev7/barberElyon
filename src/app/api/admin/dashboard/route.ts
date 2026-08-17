import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { data, error } = await getSupabaseAdmin().rpc("admin_dashboard_stats");
  if (error) return Response.json({ error: "No se pudieron cargar las métricas. Ejecuta la migración supabase/admin_rework.sql en Supabase." }, { status: 500 });
  return Response.json(data ?? {});
}