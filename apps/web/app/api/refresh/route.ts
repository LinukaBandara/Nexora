import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

// Called in-process by the proxy route when a request comes back 401 -
// see app/api/proxy/[...path]/route.ts. Returns the raw token values
// rather than a Response, so each caller can set cookies on its own
// actual outgoing response instead of a throwaway one.
export async function refreshTokens(request: NextRequest): Promise<RefreshedTokens | null> {
  const refreshToken = request.cookies.get("nexora_refresh_token")?.value;
  if (!refreshToken) return null;

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendResponse.ok) {
    // Matches RefreshTokenCommandHandler's reuse-detection behavior on the
    // backend (docs/authentication.md): if the stored refresh token is no
    // longer valid, the whole session is over, not just this one request.
    return null;
  }

  const tokens = await backendResponse.json();
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export function setAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  response.cookies.set("nexora_access_token", tokens.accessToken, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 15 * 60,
  });
  // Refresh tokens rotate on every use (docs/authentication.md) - the new
  // one replaces the old cookie, never appended alongside it.
  response.cookies.set("nexora_refresh_token", tokens.refreshToken, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 24 * 60 * 60,
  });
}

// Manual/standalone entry point - the proxy route calls refreshTokens()
// directly instead of hitting this over HTTP, to avoid an extra round trip.
export async function POST(request: NextRequest) {
  const tokens = await refreshTokens(request);
  if (!tokens) {
    return NextResponse.json({ message: "Unable to refresh session." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
