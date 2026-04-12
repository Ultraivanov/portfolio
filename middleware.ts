import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const decodeBase64 = (value: string) => {
  if (typeof atob === "function") {
    return atob(value);
  }
  return Buffer.from(value, "base64").toString("utf8");
};

export function middleware(request: NextRequest) {
  const username = process.env.KEYSTATIC_ADMIN_USER;
  const password = process.env.KEYSTATIC_ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Keystatic auth is not configured.", {
      status: 500,
    });
  }

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Basic ")) {
    const decoded = decodeBase64(auth.slice(6));
    const [user, pass] = decoded.split(":");
    if (user === username && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Keystatic"',
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
