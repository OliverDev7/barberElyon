import { requireAdminApi } from "@/lib/adminAuth";
import { getAvailabilityForDate } from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function clean(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const customerId = clean(body.customerId, 64);
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const serviceId = clean(body.serviceId, 64);
    const date = clean(body.date, 10);
    const time = clean(body.time, 5);

    if (!firstName || !lastName || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return Response.json({ error: "Completa cliente, servicio, fecha y hora." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id,name,price,discount_price,discount_active,duration_minutes")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) return Response.json({ error: "Servicio no disponible." }, { status: 400 });

    const availability = await getAvailabilityForDate(date, service.duration_minutes);
    if (!availability.available || !availability.slots.some((slot) => slot.time_24 === time)) {
      return Response.json({ error: "Ese horario no está disponible para la duración de este servicio." }, { status: 409 });
    }

    let resolvedCustomerId = customerId || null;
    if (resolvedCustomerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id,first_name,last_name,email,phone")
        .eq("id", resolvedCustomerId)
        .single();
      if (customerError || !customer) return Response.json({ error: "El cliente seleccionado ya no existe." }, { status: 400 });
    } else {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({ first_name: firstName, last_name: lastName, email: null, phone: null })
        .select("id")
        .single();
      if (customerError || !customer) throw customerError ?? new Error("CUSTOMER_CREATE_FAILED");
      resolvedCustomerId = customer.id;
    }

    const hasDiscount = Boolean(service.discount_active && service.discount_price !== null && Number(service.discount_price) < Number(service.price));
    const originalPrice = Number(service.price);
    const effectivePrice = hasDiscount ? Number(service.discount_price) : originalPrice;

    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        customer_id: resolvedCustomerId,
        service_id: service.id,
        service_name: service.name,
        service_price: effectivePrice,
        service_original_price: originalPrice,
        service_duration_minutes: service.duration_minutes,
        reservation_date: date,
        reservation_time: time,
        first_name: firstName,
        last_name: lastName,
        email: null,
        phone: null,
        observations: null,
        status: "confirmed",
        reservation_source: "admin",
      })
      .select("id,customer_id,service_name,service_price,service_original_price,service_duration_minutes,reservation_date,reservation_time,status,reservation_source")
      .single();

    if (reservationError) {
      if (reservationError.code === "23505") return Response.json({ error: "Ese horario acaba de ser ocupado. Elige otro." }, { status: 409 });
      throw reservationError;
    }

    return Response.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("Admin manual reservation failed:", error);
    return Response.json({ error: "No se pudo crear la reserva manual." }, { status: 500 });
  }
}
