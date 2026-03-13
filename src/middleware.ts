import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedRoutes = ["/dashboard", "/admin"];

export async function middleware(request: NextRequest) {
  // Run i18n middleware first to handle locale routing
  const intlResponse = intlMiddleware(request);

  // Run Supabase session refresh — reads cookies from request,
  // writes updated auth cookies to session response
  const { response: sessionResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.includes(route)
  );

  if (isProtectedRoute && !user) {
    const locale = pathname.split("/")[1];
    return NextResponse.redirect(
      new URL(`/${locale}/login`, request.url)
    );
  }

  // Merge Supabase auth cookies onto the i18n response so both
  // locale routing and session refresh take effect
  for (const cookie of sessionResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
