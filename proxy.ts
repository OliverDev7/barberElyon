import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function configuredLoginPath() {
  const value = process.env.ADMIN_LOGIN_PATH?.trim();
  return value && value.startsWith("/") && value.length >= 12 ? value : null;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const loginPath = configuredLoginPath();

  if (loginPath && pathname === loginPath) {
    const target = request.nextUrl.clone();
    target.pathname = "/admin/login";
    return NextResponse.rewrite(target);
  }

  if (pathname === "/admin/login" || pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = request.cookies.get("elyon_admin_session")?.value;
    if (!session) return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
