import { getAvailabilityForDate } from "@/lib/data";
import { sendReservationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    for (const field of ["serviceId", "date", "time", "firstName", "lastName", "email", "phone"]) {
      if (!body[field]) return Response.json({ error: "Faltan datos obligatorios." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
      return Response.json({ error: "Correo invalido." }, { status: 400 });
    }
    if (!/^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/.test(String(body.phone).trim())) {
      return Response.json({ error: "Telefono invalido." }, { status: 400 });
    }

    const availability = await getAvailabilityForDate(body.date);
    if (!availability.available || !availability.slots.some((slot) => slot.time_24 === body.time)) {
      return Response.json({ error: "Ese horario ya no esta disponible." }, { status: 409 });
    }

    const supabase = getSupabaseAdmin();
    const { data: service, error: serviceError } = await supabase.from("services").select("id,name,price,duration_minutes").eq("id", body.serviceId).eq("active", true).single();
    if (serviceError || !service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });

    const { data: reservation, error } = await supabase.from("reservations").insert({
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      service_duration_minutes: service.duration_minutes,
      reservation_date: body.date,
      reservation_time: body.time,
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      observations: body.observations || null,
      status: "confirmed",
    }).select().single();

    if (error) {
      if (error.code === "23505") return Response.json({ error: "Ese horario acaba de ser reservado." }, { status: 409 });
      throw error;
    }

    await sendReservationEmail(body.email, {
      firstName: body.firstName,
      serviceName: service.name,
      date: body.date,
      time: body.time,
      price: service.price,
      observations: body.observations,
    });

    return Response.json({ reservation });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo crear la reserva." }, { status: 500 });
  }
}
