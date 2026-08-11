import crypto from "crypto";
import { cookies } from "next/headers";

const cookieName = "elyon_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 8;

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AdminUnauthorizedError";
  }
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionValue() {
  const expires = Date.now() + sessionLifetimeSeconds * 1000;
  const payload = `admin:${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSession(value?: string) {
  try {
    if (!value) return false;
    const separator = value.lastIndexOf(".");
    if (separator <= 0) return false;
    const payload = value.slice(0, separator);
    const signature = value.slice(separator + 1);
    const [role, expires] = payload.split(":");
    if (role !== "admin" || !expires || !/^\d+$/.test(expires)) return false;
    if (Number(expires) <= Date.now()) return false;
    return safeEqual(signature, sign(payload));
  } catch {
    return false;
  }
}

export async function hasValidAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(cookieName)?.value);
}

export async function requireAdmin() {
  if (!(await hasValidAdminSession())) throw new AdminUnauthorizedError();
}

export async function requireAdminApi() {
  if (await hasValidAdminSession()) return null;
  return Response.json({ error: "Sesión de administrador no válida o expirada." }, { status: 401 });
}

export async function setAdminCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export { cookieName };
