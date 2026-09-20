import { NextRequest, NextResponse } from "next/server";

const DEMO_MODE_ENABLED = process.env.NEXORA_DEMO_MODE === "true";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("nexora_access_token")?.value;
  const demoMode = DEMO_MODE_ENABLED && request.cookies.get("nexora_demo_mode")?.value === "1";
  const isProtectedRoute =
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/api");

  if (isProtectedRoute && !token && !demoMode) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
