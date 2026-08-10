import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "elyon_admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createAdminSessionValue() {
  const expires = Date.now() + 1000 * 60 * 60 * 8;
  const payload = `admin:${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSession(value?: string) {
  if (!value) return false;
  const [role, expires, signature] = value.split(".");
  const payload = `${role}.${expires}`;
  const legacyPayload = `${role}:${expires}`;
  const expected = sign(legacyPayload);
  return role === "admin" && Number(expires) > Date.now() && signature === expected && payload.length > 0;
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get(cookieName)?.value;
  if (!isValidAdminSession(session)) {
    throw new Error("Unauthorized");
  }
}

export async function setAdminCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export { cookieName };
