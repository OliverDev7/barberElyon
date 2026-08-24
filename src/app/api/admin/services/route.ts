import { requireAdminApi } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function servicePayload(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const duration_minutes = Number(body.duration_minutes);
  const price = Number(body.price);
  const discount_price = body.discount_price === null || body.discount_price === "" || body.discount_price === undefined ? null : Number(body.discount_price);
  const discount_active = body.discount_active === undefined ? false : Boolean(body.discount_active);
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const active = body.active === undefined ? true : Boolean(body.active);
  const sort_order = Number(body.sort_order ?? 99);
  if (!name) throw new Error("El nombre del servicio es obligatorio.");
  if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) throw new Error("La duración debe ser un número entero mayor que 0.");
  if (!Number.isInteger(price) || price < 0) throw new Error("El precio debe ser un número entero mayor o igual que 0.");
  if (discount_price !== null && (!Number.isInteger(discount_price) || discount_price < 0)) throw new Error("El precio de oferta no es válido.");
  if (discount_active && discount_price !== null && discount_price >= price) throw new Error("El precio de oferta debe ser menor que el precio normal.");
  if (!Number.isInteger(sort_order)) throw new Error("El orden no es válido.");
  return { name, duration_minutes, price, discount_price, discount_active, description, active, sort_order };
}

export async function GET() {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const { data, error } = await getSupabaseAdmin().from("services").select("*").order("sort_order").order("created_at");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ services: data });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const payload = servicePayload(await request.json());
    const { data, error } = await getSupabaseAdmin().from("services").insert(payload).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ service: data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Datos inválidos." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  try {
    const body = await request.json();
    if (typeof body.id !== "string" || !body.id) return Response.json({ error: "ID requerido." }, { status: 400 });
    const payload = servicePayload(body);
    const { data, error } = await getSupabaseAdmin().from("services").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ service: data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Datos inválidos." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID requerido." }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("services").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}