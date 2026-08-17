import { getSupabaseAdmin } from "./supabaseAdmin";

export type PublicService = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
  active: boolean;
  sort_order: number;
};

export type PublicSettings = {
  business_name: string;
  barber_name: string;
  location_city: string;
  address: string;
  google_maps_embed_url: string;
  whatsapp_phone: string;
};

export async function getPublicConfig() {
  const supabase = getSupabaseAdmin();
  const [{ data: settings, error: settingsError }, { data: services, error: servicesError }] = await Promise.all([
    supabase.from("business_settings").select("business_name,barber_name,location_city,address,google_maps_embed_url,whatsapp_phone").limit(1).single(),
    supabase.from("services").select("id,name,duration_minutes,price,description,active,sort_order").eq("active", true).order("sort_order"),
  ]);

  if (settingsError) throw settingsError;
  if (servicesError) throw servicesError;
  return { settings: settings as PublicSettings, services: services as PublicService[] };
}

function minutesFromTime(value: string) {
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export async function getAvailabilityForDate(date: string, serviceDurationMinutes = 60) {
  const supabase = getSupabaseAdmin();
  const day = new Date(`${date}T12:00:00`).getDay();
  const duration = Math.max(1, Number(serviceDurationMinutes) || 60);
  const [{ data: dayConfig }, { data: blockedDay }, { data: slots }, { data: blockedSlots }, { data: reservations }] = await Promise.all([
    supabase.from("availability_days").select("active,label").eq("day_of_week", day).single(),
    supabase.from("blocked_days").select("id").eq("date", date).maybeSingle(),
    supabase.from("availability_slots").select("id,time_24,period,active").eq("day_of_week", day).eq("active", true).order("time_24"),
    supabase.from("blocked_slots").select("time_24").eq("date", date),
    supabase.from("reservations").select("reservation_time,service_duration_minutes").eq("reservation_date", date).neq("status", "cancelled"),
  ]);

  if (!dayConfig?.active || blockedDay) return { available: false, slots: [] };

  const normalizedSlots = (slots ?? []).map((slot) => ({ ...slot, time_24: String(slot.time_24).slice(0, 5) }));
  const slotStarts = new Set(normalizedSlots.map((slot) => minutesFromTime(slot.time_24)));
  const blocked = new Set((blockedSlots ?? []).map((slot) => minutesFromTime(String(slot.time_24))));
  const reservations = (reservations ?? []).map((reservation) => {
    const start = minutesFromTime(String(reservation.reservation_time));
    const reservationDuration = Math.max(1, Number(reservation.service_duration_minutes) || 60);
    return { start, end: start + reservationDuration };
  });
  const closingMinutes = normalizedSlots.length ? Math.max(...normalizedSlots.map((slot) => minutesFromTime(slot.time_24))) + 60 : 0;

  const canFit = (start: number) => {
    const end = start + duration;
    if (end > closingMinutes) return false;

    for (let minute = start; minute < end; minute += 60) {
      if (!slotStarts.has(minute)) return false;
      if (blocked.has(minute)) return false;
    }

    return !reservations.some((reservation) => reservation.start < end && reservation.end > start);
  };

  return {
    available: true,
    slots: normalizedSlots.filter((slot) => canFit(minutesFromTime(slot.time_24))),
  };
}
