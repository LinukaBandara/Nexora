import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// This is the fix for the gap flagged in docs/frontend.md's first version:
// the access token used to be stored in a plain, client-JS-readable
// cookie. Now the browser never sees the token at all - this route calls
// the backend, then sets an HttpOnly cookie the browser will send
// automatically but JavaScript cannot read (so an XSS bug elsewhere in
// the app can't exfiltrate it). All subsequent API calls go through
// /api/proxy, which reads this cookie server-side.
export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const errorBody = await backendResponse.json().catch(() => ({ message: "Login failed." }));
    return NextResponse.json(errorBody, { status: backendResponse.status });
  }

  const result = await backendResponse.json();
  const response = NextResponse.json({ userId: result.userId, organizationId: result.organizationId });

  response.cookies.set("nexora_access_token", result.tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60, // matches the backend's 15-minute access token lifetime
  });

  // The refresh token is stored too, HttpOnly, so a future increment can
  // add silent refresh here without any frontend redesign - see
  // docs/frontend.md, "refresh flow still not wired up" for what's
  // genuinely still missing.
  response.cookies.set("nexora_refresh_token", result.tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // matches the backend's 30-day refresh token lifetime
  });

  return response;
}
