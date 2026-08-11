import { getAvailabilityForDate, getPublicConfig } from "@/lib/data";
import { sendReservationEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requiredFields = ["serviceId", "date", "time", "firstName", "lastName", "email", "phone"] as const;

    for (const field of requiredFields) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        return Response.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
      }
    }

    const email = String(body.email).trim().toLowerCase();
    const phone = String(body.phone).trim();
    const date = String(body.date).trim();
    const time = String(body.time).trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Correo inválido." }, { status: 400 });
    if (!/^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/.test(phone)) return Response.json({ error: "Teléfono inválido. Usa un número chileno válido." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return Response.json({ error: "Fecha u horario inválido." }, { status: 400 });

    const availability = await getAvailabilityForDate(date);
    if (!availability.available || !availability.slots.some((slot) => slot.time_24 === time)) {
      return Response.json({ error: "Ese horario ya no está disponible." }, { status: 409 });
    }

    const supabase = getSupabaseAdmin();
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id,name,price,duration_minutes")
      .eq("id", body.serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });

    // The reservation must not depend on the public configuration endpoint.
    // This keeps a configuration/schema mismatch from blocking a valid booking.
    let barberName: string | undefined;
    try {
      const configResult = await getPublicConfig();
      barberName = configResult.data?.settings?.barber_name;
    } catch (configError) {
      console.error("Could not load barber configuration for reservation email:", configError);
    }

    const { data: reservation, error } = await supabase.from("reservations").insert({
      service_id: service.id,
      service_name: service.name,
      service_price: service.price,
      service_duration_minutes: service.duration_minutes,
      reservation_date: date,
      reservation_time: time,
      first_name: String(body.firstName).trim(),
      last_name: String(body.lastName).trim(),
      email,
      phone,
      observations: typeof body.observations === "string" && body.observations.trim() ? body.observations.trim() : null,
      status: "confirmed",
    }).select().single();

    if (error) {
      if (error.code === "23505") return Response.json({ error: "Ese horario acaba de ser reservado." }, { status: 409 });
      throw error;
    }

    let emailSent = false;
    let warning: string | undefined;
    try {
      await sendReservationEmail(email, {
        firstName: String(body.firstName).trim(),
        serviceName: service.name,
        date,
        time,
        price: service.price,
        observations: body.observations,
        barberName,
      });
      emailSent = true;
    } catch (emailError) {
      console.error("Reservation created but confirmation email failed:", emailError);
      warning = "La reserva fue creada correctamente, pero no pudimos enviar el correo de confirmación. Revisa la configuración SMTP.";
    }

    // Always return success after Supabase has created the reservation.
    return Response.json({ reservation, emailSent, warning }, { status: 201 });
  } catch (error) {
    console.error("Reservation request failed:", error);
    return Response.json({ error: "No se pudo crear la reserva." }, { status: 500 });
  }
}
