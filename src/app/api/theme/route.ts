import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { theme } = await request.json();

  const response = NextResponse.json({ success: true });

  response.cookies.set("theme", theme, {
    path: "/",
    httpOnly: false, // allow client to read
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return response;
}