import crypto from "crypto";
import { createAdminSessionValue, setAdminCookie } from "@/lib/adminAuth";

function secretsMatch(input: string, expected: string) {
  const inputBuffer = Buffer.from(input, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return inputBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const expectedEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

    if (!email || !password) return Response.json({ error: "Ingresa tu correo y contraseña." }, { status: 400 });
    if (!expectedEmail || !expectedPassword) {
      console.error("Admin login is not configured: ADMIN_EMAIL and ADMIN_PASSWORD are required.");
      return Response.json({ error: "El acceso de administrador no está configurado en el servidor." }, { status: 503 });
    }
    if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
      console.error("Admin login is not configured: ADMIN_SESSION_SECRET must contain at least 32 characters.");
      return Response.json({ error: "La sesión del administrador no está configurada correctamente en el servidor." }, { status: 503 });
    }

    if (!secretsMatch(email, expectedEmail) || !secretsMatch(password, expectedPassword)) {
      return Response.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

    await setAdminCookie(createAdminSessionValue());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin login failed:", error);
    return Response.json({ error: "No se pudo iniciar sesión. Inténtalo nuevamente." }, { status: 500 });
  }
}
