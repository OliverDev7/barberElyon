import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function publicReview(row: { id: string; full_name: string; email: string; rating: number; review_text: string; created_at: string }) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    rating: row.rating,
    reviewText: row.review_text,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("customer_reviews")
      .select("id,full_name,email,rating,review_text,created_at")
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .limit(24);

    if (error) throw error;
    const reviews = (data ?? []).map(publicReview);
    const average = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0;

    return Response.json({ reviews, average, total: reviews.length });
  } catch (error) {
    console.error("Could not load customer reviews:", error);
    return Response.json({ error: "No se pudieron cargar las reseñas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const fullName = cleanText(body.fullName, 120);
    const email = cleanText(body.email, 180).toLowerCase();
    const reviewText = cleanText(body.reviewText, 900);
    const rating = Number(body.rating);

    if (fullName.length < 3) return Response.json({ error: "Ingresa tu nombre y apellido." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Ingresa un correo válido." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return Response.json({ error: "Selecciona una calificación entre 1 y 5 estrellas." }, { status: 400 });
    if (reviewText.length < 10) return Response.json({ error: "Escribe una reseña de al menos 10 caracteres." }, { status: 400 });

    const { data, error } = await getSupabaseAdmin()
      .from("customer_reviews")
      .insert({ full_name: fullName, email, rating, review_text: reviewText })
      .select("id,full_name,email,rating,review_text,created_at")
      .single();

    if (error) throw error;

    return Response.json({ review: publicReview(data), message: "Gracias por compartir tu experiencia." }, { status: 201 });
  } catch (error) {
    console.error("Could not save customer review:", error);
    return Response.json({ error: "No se pudo guardar la reseña." }, { status: 500 });
  }
}
