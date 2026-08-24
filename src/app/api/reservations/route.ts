import { getAvailabilityForDate, getPublicConfig } from "@/lib/data";
import { sendReservationEmail } from "@/lib/email";
import { sendBarberNotificationEmail } from "@/lib/barberNotificationEmail";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requiredFields = ["serviceId", "date", "time", "firstName", "lastName", "email", "phone"] as const;
    for (const field of requiredFields) if (typeof body[field] !== "string" || !body[field].trim()) return Response.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });

    const email = String(body.email).trim().toLowerCase();
    const phone = String(body.phone).trim();
    const date = String(body.date).trim();
    const time = String(body.time).trim();
    const firstName = String(body.firstName).trim();
    const lastName = String(body.lastName).trim();
    const serviceId = String(body.serviceId).trim();
    const observations = typeof body.observations === "string" && body.observations.trim() ? body.observations.trim() : null;

    if (!/^([^\s@]+)@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Correo inválido." }, { status: 400 });
    if (!/^\d{9}$/.test(phone)) return Response.json({ error: "Teléfono inválido. Debe contener 9 números." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return Response.json({ error: "Fecha u horario inválido." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: service, error: serviceError } = await supabase.from("services").select("id,name,price,discount_price,discount_active,duration_minutes").eq("id", serviceId).eq("active", true).single();
    if (serviceError || !service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });

    const availability = await getAvailabilityForDate(date, service.duration_minutes);
    if (!availability.available || !availability.slots.some((slot) => slot.time_24 === time)) return Response.json({ error: "Ese horario ya no está disponible para la duración de este servicio." }, { status: 409 });

    const hasDiscount = Boolean(service.discount_active && service.discount_price !== null && Number(service.discount_price) < Number(service.price));
    const effectivePrice = hasDiscount ? Number(service.discount_price) : Number(service.price);

    let barberName: string | undefined;
    try {
      const configResult = await getPublicConfig();
      barberName = configResult.settings?.barber_name;
    } catch (configError) {
      console.error("Could not load barber configuration for reservation email:", configError);
    }

    const { data: reservation, error } = await supabase.rpc("create_reservation_v2", {
      p_service_id: service.id,
      p_service_name: service.name,
      p_service_price: effectivePrice,
      p_service_duration_minutes: service.duration_minutes,
      p_reservation_date: date,
      p_reservation_time: time,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email,
      p_phone: phone,
      p_observations: observations,
      p_status: "confirmed",
    });

    if (error) {
      if (error.code === "23P01" || error.message?.includes("RESERVATION_CONFLICT")) return Response.json({ error: "Ese horario ya no está disponible para la duración de este servicio." }, { status: 409 });
      if (error.message?.includes("SERVICE_NOT_AVAILABLE")) return Response.json({ error: "Servicio no disponible." }, { status: 400 });
      throw error;
    }

    let emailSent = false;
    let warning: string | undefined;
    try {
      const siteUrl = new URL(request.url).origin;
      await sendReservationEmail(email, { firstName, lastName, serviceName: service.name, date, time, barberName }, siteUrl);
      emailSent = true;
    } catch (emailError) {
      console.error("Reservation created but customer confirmation email failed:", emailError);
      warning = "La reserva fue creada correctamente, pero no pudimos enviar el correo de confirmación. Revisa la configuración SMTP.";
    }

    let barberEmailSent = false;
    const barberNotificationEmail = process.env.BARBER_NOTIFICATION_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim() || "";
    if (barberNotificationEmail) {
      try {
        await sendBarberNotificationEmail(barberNotificationEmail, { firstName, lastName, phone, serviceName: service.name, date, time, observations, barberName });
        barberEmailSent = true;
      } catch (barberEmailError) {
        console.error("Reservation created but barber notification email failed:", barberEmailError);
      }
    } else {
      console.warn("Barber notification email is not configured. Set BARBER_NOTIFICATION_EMAIL or use ADMIN_EMAIL.");
    }

    return Response.json({ reservation, emailSent, barberEmailSent, warning, effectivePrice, originalPrice: Number(service.price) }, { status: 201 });
  } catch (error) {
    console.error("Reservation request failed:", error);
    return Response.json({ error: "No se pudo crear la reserva." }, { status: 500 });
  }
}