import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("increment_review_clicks");
    if (error) throw error;
    return Response.json({ totalClicks: Number(data ?? 0) });
  } catch (error) {
    console.error("Could not register review click:", error);
    return Response.json({ error: "No se pudo registrar el clic." }, { status: 500 });
  }
}
