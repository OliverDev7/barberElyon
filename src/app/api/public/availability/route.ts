import { getAvailabilityForDate } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const serviceId = params.get("serviceId");
  if (!date) return Response.json({ error: "Fecha requerida." }, { status: 400 });

  try {
    let durationMinutes = 60;
    if (serviceId) {
      const { data: service, error } = await getSupabaseAdmin().from("services").select("duration_minutes").eq("id", serviceId).eq("active", true).single();
      if (error || !service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });
      durationMinutes = service.duration_minutes;
    }

    return Response.json(await getAvailabilityForDate(date, durationMinutes));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo cargar disponibilidad." }, { status: 500 });
  }
}
