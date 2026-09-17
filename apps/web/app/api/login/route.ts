import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body?.action === "logout") {
    const response = NextResponse.json({ success: true });
    response.cookies.delete("nexora_access_token");
    response.cookies.delete("nexora_refresh_token");
    response.cookies.delete("nexora_demo_mode");
    return response;
  }

  try {
    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
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
      maxAge: 15 * 60,
    });
    response.cookies.set("nexora_refresh_token", result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch {
    if (!body.email || !body.password) {
      return NextResponse.json({ message: "Enter an email and password to continue in demo mode." }, { status: 400 });
    }

    const response = NextResponse.json({ userId: "demo-user", organizationId: "demo-org", demo: true });
    response.cookies.set("nexora_demo_mode", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
    response.cookies.delete("nexora_access_token");
    response.cookies.delete("nexora_refresh_token");
    return response;
  }
}
