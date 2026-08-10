import { createAdminSessionValue, setAdminCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = await request.json();
  if (body.email !== process.env.ADMIN_EMAIL || body.password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Credenciales incorrectas." }, { status: 401 });
  }
  await setAdminCookie(createAdminSessionValue());
  return Response.json({ ok: true });
}
