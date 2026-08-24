import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  if (!expected || authorization !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin().rpc("cleanup_old_reservations", { p_keep_months: 12 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, deleted: Number(data ?? 0), keepMonths: 12, cleanedAt: new Date().toISOString() });
}