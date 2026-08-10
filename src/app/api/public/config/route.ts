import { getPublicConfig } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getPublicConfig());
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo cargar la configuracion." }, { status: 500 });
  }
}
