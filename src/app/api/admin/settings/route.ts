import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const editableFields = ["business_name", "barber_name", "location_city", "address", "google_maps_embed_url", "whatsapp_phone"] as const;

export async function GET() {
  await requireAdmin();
  const { data, error } = await getSupabaseAdmin().from("business_settings").select("*").limit(1).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}

export async function PATCH(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const changes = Object.fromEntries(editableFields.filter((field) => body[field] !== undefined).map((field) => [field, typeof body[field] === "string" ? body[field].trim() : body[field]]));
  if (Object.keys(changes).length === 0) return Response.json({ error: "No hay cambios válidos." }, { status: 400 });
  if (changes.business_name === "" || changes.barber_name === "" || changes.address === "" || changes.whatsapp_phone === "") return Response.json({ error: "Los datos principales no pueden quedar vacíos." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: current, error: currentError } = await supabase.from("business_settings").select("id").limit(1).single();
  if (currentError || !current) return Response.json({ error: currentError?.message ?? "No existe configuración de negocio." }, { status: 500 });
  const { data, error } = await supabase.from("business_settings").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", current.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ settings: data });
}
