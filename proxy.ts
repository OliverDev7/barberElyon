import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const fallbackLoginPath = "/_elyon_admin_8f31c2";

function configuredLoginPath() {
  const value = process.env.ADMIN_LOGIN_PATH?.trim();
  if (!value) return fallbackLoginPath;
  return value.startsWith("/") ? value : `/${value}`;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const loginPath = configuredLoginPath();

  if (pathname === loginPath) {
    const target = request.nextUrl.clone();
    target.pathname = "/admin/login";
    const headers = new Headers(request.headers);
    headers.set("x-elyon-admin-entry", "1");
    return NextResponse.rewrite(target, { request: { headers } });
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = request.cookies.get("elyon_admin_session")?.value;
    if (!session) return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
