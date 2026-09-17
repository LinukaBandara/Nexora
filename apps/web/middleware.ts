import { NextRequest, NextResponse } from "next/server";

// Runs before any (shell) page renders - this is what fixes the "flash
// of loading state before bouncing to /login" issue from the earlier
// client-side-only check in (shell)/layout.tsx. That client-side check
// still exists too (it needs the actual /auth/me response to populate
// permissions for the sidebar), but middleware now stops an obviously
// unauthenticated request before any page code runs at all.
//
// LIMITATION, stated plainly: this only checks that the cookie exists,
// not that the JWT inside it is validly signed or unexpired - real
// verification would need a JWT library (e.g. jose) running in the Edge
// runtime. An expired-but-present cookie still passes this gate and
// fails later at the API call itself, which the page's existing error
// handling already covers. Tightening this is a reasonable next step,
// not a silent gap - see docs/frontend.md.
export function middleware(request: NextRequest) {
  const token = request.cookies.get("nexora_access_token")?.value;
  const isProtectedRoute = !request.nextUrl.pathname.startsWith("/login")
    && !request.nextUrl.pathname.startsWith("/api");

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
