import { createAdminSessionValue, setAdminCookie } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

    if (!email || !password) return Response.json({ error: "Ingresa tu correo y contraseña." }, { status: 400 });
    if (!expectedEmail || !expectedPassword || email !== expectedEmail || password !== expectedPassword) {
      return Response.json({ error: "Credenciales incorrectas." }, { status: 401 });
    }

    await setAdminCookie(createAdminSessionValue());
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Solicitud de inicio de sesión inválida." }, { status: 400 });
  }
}
