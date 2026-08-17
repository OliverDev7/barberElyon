import { getAvailabilityForDate } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!date) return Response.json({ error: "Fecha requerida." }, { status: 400 });

  try {
    return Response.json(await getAvailabilityForDate(date));
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo cargar disponibilidad." }, { status: 500 });
  }
}