import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

export async function refreshTokens(request: NextRequest): Promise<RefreshedTokens | null> {
  const refreshToken = request.cookies.get("nexora_refresh_token")?.value;
  if (!refreshToken) return null;

  const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendResponse.ok) return null;

  const tokens = await backendResponse.json();
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export function setAuthCookies(response: NextResponse, tokens: RefreshedTokens) {
  response.cookies.set("nexora_access_token", tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  response.cookies.set("nexora_refresh_token", tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}
