import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { data, error } = await getSupabaseAdmin()
    .from("review_click_stats")
    .select("total_clicks")
    .eq("id", true)
    .single();

  if (error) return Response.json({ error: "No se pudo cargar el contador de reseñas." }, { status: 500 });
  return Response.json({ totalClicks: Number(data?.total_clicks ?? 0) });
}
