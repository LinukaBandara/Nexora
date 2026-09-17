import { NextRequest, NextResponse } from "next/server";
import { refreshTokens, setAuthCookies } from "@/lib/auth-refresh";
import { demoResponse } from "@/lib/demo-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

async function callBackend(path: string[], search: string, method: string, body: string | undefined, accessToken: string | undefined) {
  const targetUrl = `${API_BASE_URL}/api/v1/${path.join("/")}${search}`;
  return fetch(targetUrl, {
    method,
    headers: { "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
}

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();
  const search = request.nextUrl.search;

  if (request.cookies.get("nexora_demo_mode")?.value === "1") {
    return NextResponse.json(demoResponse(path, search, method));
  }

  const accessToken = request.cookies.get("nexora_access_token")?.value;

  try {
    let backendResponse = await callBackend(path, search, method, body, accessToken);
    if (backendResponse.status === 401) {
      const refreshed = await refreshTokens(request);
      if (!refreshed) {
        const response = new NextResponse(await backendResponse.text(), { status: 401 });
        response.cookies.delete("nexora_access_token");
        response.cookies.delete("nexora_refresh_token");
        return response;
      }
      backendResponse = await callBackend(path, search, method, body, refreshed.accessToken);
      const response = new NextResponse(await backendResponse.text(), {
        status: backendResponse.status,
        headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
      });
      setAuthCookies(response, refreshed);
      return response;
    }
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "NEXORA API is offline. Sign in again to use demo mode." }, { status: 503 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
