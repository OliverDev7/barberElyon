import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("customer_reviews")
      .select("id,full_name,email,rating,review_text,approved,created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;
    return Response.json({ reviews: data ?? [] });
  } catch (error) {
    console.error("Could not load admin reviews:", error);
    return Response.json({ error: "No se pudieron cargar las reseñas." }, { status: 500 });
  }
}
