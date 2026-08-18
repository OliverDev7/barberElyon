import { sendReservationReminderEmail } from "@/lib/reminderEmail";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const REMINDER_MIN_HOURS = 14;
const REMINDER_MAX_HOURS = 26;
const CHILE_TIME_ZONE = "America/Santiago";

function chileWallMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CHILE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute")) / 60000;
}

function dateStringOffset(days: number) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CHILE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const date = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + days));
  return date.toISOString().slice(0, 10);
}

function reservationWallMinutes(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.slice(0, 5).split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60000;
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!expected || authorization !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const today = dateStringOffset(0);
  const horizon = dateStringOffset(2);
  const nowWall = chileWallMinutes();

  const [{ data: reservations, error: reservationsError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("reservations").select("id,first_name,last_name,email,reservation_date,reservation_time,status").gte("reservation_date", today).lte("reservation_date", horizon).neq("status", "cancelled").order("reservation_date").order("reservation_time"),
    supabase.from("business_settings").select("barber_name").limit(1).maybeSingle(),
  ]);
  if (reservationsError) return Response.json({ error: reservationsError.message }, { status: 500 });
  if (settingsError) return Response.json({ error: settingsError.message }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
  const barberName = settings?.barber_name?.trim() || "Alonso Salinas";
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const reservation of reservations ?? []) {
    const remainingHours = (reservationWallMinutes(reservation.reservation_date, reservation.reservation_time) - nowWall) / 60;
    if (remainingHours < REMINDER_MIN_HOURS || remainingHours > REMINDER_MAX_HOURS) { skipped++; continue; }

    const { data: claim, error: claimError } = await supabase.from("reservation_reminders").insert({ reservation_id: reservation.id }).select("reservation_id").maybeSingle();
    if (claimError || !claim) { skipped++; continue; }

    try {
      await sendReservationReminderEmail(reservation.email, { firstName: reservation.first_name, lastName: reservation.last_name, date: reservation.reservation_date, time: reservation.reservation_time, barberName }, siteUrl);
      sent++;
    } catch (error) {
      await supabase.from("reservation_reminders").delete().eq("reservation_id", reservation.id);
      errors.push(`${reservation.id}: ${error instanceof Error ? error.message : "error de envío"}`);
    }
  }

  return Response.json({ ok: true, sent, skipped, errors, evaluatedAt: new Date().toISOString() });
}