import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("nexora_access_token");
  response.cookies.delete("nexora_refresh_token");
  response.cookies.delete("nexora_demo_mode");
  return response;
}
