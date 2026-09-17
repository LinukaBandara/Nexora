import { NextRequest, NextResponse } from "next/server";
import { refreshTokens, setAuthCookies } from "../../refresh/route";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// Every authenticated API call from the browser goes through here instead
// of hitting the backend directly. This route reads the HttpOnly cookie
// (which client JS cannot) and attaches it as a Bearer token server-side.
// On a 401 (expired access token), it now attempts ONE silent refresh
// before giving up - this is the piece that was missing last turn: the
// refresh token was being stored but nothing called it. See
// docs/frontend.md.
async function callBackend(path: string[], search: string, method: string, body: string | undefined, accessToken: string | undefined) {
  const targetUrl = `${API_BASE_URL}/api/v1/${path.join("/")}${search}`;
  return fetch(targetUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
    cache: "no-store",
  });
}

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const method = request.method;
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();
  const search = request.nextUrl.search;

  const accessToken = request.cookies.get("nexora_access_token")?.value;
  let backendResponse = await callBackend(path, search, method, body, accessToken);

  if (backendResponse.status === 401) {
    const refreshed = await refreshTokens(request);

    if (!refreshed) {
      // Refresh token is gone/invalid too - the session is genuinely over.
      // Clear cookies so middleware sends the next navigation to /login
      // instead of looping on a dead session.
      const response = new NextResponse(await backendResponse.text(), { status: 401 });
      response.cookies.delete("nexora_access_token");
      response.cookies.delete("nexora_refresh_token");
      return response;
    }

    // Retry the original request exactly once with the new access token.
    backendResponse = await callBackend(path, search, method, body, refreshed.accessToken);

    const responseBody = await backendResponse.text();
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
    });
    setAuthCookies(response, refreshed);
    return response;
  }

  const responseBody = await backendResponse.text();
  return new NextResponse(responseBody, {
    status: backendResponse.status,
    headers: { "Content-Type": backendResponse.headers.get("Content-Type") ?? "application/json" },
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
