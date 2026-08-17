import { getAvailabilityForDate, getPublicConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date");
  const serviceId = params.get("serviceId");
  if (!date) return Response.json({ error: "Fecha requerida." }, { status: 400 });

  try {
     let serviceDurationMinutes = 60;
    if (serviceId) {
      const { services } = await getPublicConfig();
      const service = services.find((item) => item.id === serviceId);
      if (!service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });
      serviceDurationMinutes = service.duration_minutes;
    }
    return Response.json(await getAvailabilityForDate(date, serviceDurationMinutes));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo cargar disponibilidad." }, { status: 500 });
  }
}