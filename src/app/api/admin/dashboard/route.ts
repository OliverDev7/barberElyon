import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: todayReservations, error: todayError }, { count: clients, error: clientsError }, { data: incomeRows, error: incomeError }, { count: activeServices, error: servicesError }, { data: upcoming, error: upcomingError }, { data: serviceRows, error: serviceRowsError }] = await Promise.all([
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("reservation_date", today).neq("status", "cancelled"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("reservations").select("service_price").neq("status", "cancelled"),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("reservations").select("id,service_name,service_price,reservation_date,reservation_time,status,customers(first_name,last_name)").neq("status", "cancelled").gte("reservation_date", today).order("reservation_date").order("reservation_time").limit(8),
    supabase.from("reservations").select("service_name").neq("status", "cancelled"),
  ]);
  const firstError = todayError || clientsError || incomeError || servicesError || upcomingError || serviceRowsError;
  if (firstError) return Response.json({ error: firstError.message }, { status: 500 });

  const serviceCountMap = new Map<string, number>();
  for (const row of serviceRows ?? []) serviceCountMap.set(row.service_name, (serviceCountMap.get(row.service_name) ?? 0) + 1);
  const serviceCounts = Array.from(serviceCountMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  const normalizedUpcoming = (upcoming ?? []).map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    return { id: row.id, first_name: customer?.first_name ?? "", last_name: customer?.last_name ?? "", service_name: row.service_name, service_price: row.service_price, reservation_date: row.reservation_date, reservation_time: row.reservation_time };
  });
  const estimatedIncome = (incomeRows ?? []).reduce((sum, row) => sum + Number(row.service_price ?? 0), 0);
  return Response.json({ todayReservations: todayReservations ?? 0, clients: clients ?? 0, estimatedIncome, activeServices: activeServices ?? 0, upcoming: normalizedUpcoming, serviceCounts });
}