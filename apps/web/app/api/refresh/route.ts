import { NextRequest, NextResponse } from "next/server";
import { refreshTokens, setAuthCookies } from "@/lib/auth-refresh";

export async function POST(request: NextRequest) {
  const tokens = await refreshTokens(request);

  if (!tokens) {
    return NextResponse.json({ message: "Unable to refresh session." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
