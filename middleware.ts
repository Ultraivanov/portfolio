import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CMS_SESSION_COOKIE,
  getCmsCredentials,
  readCookieValue,
  verifyCmsSessionToken,
} from "@/lib/cms-auth";

function isProtectedApiPath(pathname: string): boolean {
  return (
    pathname === "/api/cases" ||
    pathname.startsWith("/api/cases/") ||
    pathname === "/api/save-content" ||
    pathname === "/api/upload-image" ||
    pathname === "/api/upload-image/cleanup" ||
    pathname === "/api/intake/github" ||
    pathname === "/api/intake/github/runtime-import"
  );
}

function unauthorizedApiResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required.",
      },
    },
    { status: 401 }
  );
}

function nextWithCmsUser(request: NextRequest, username: string): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cms-user", username);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export async function middleware(request: NextRequest) {
  const credentials = getCmsCredentials();
  if (!credentials) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CONFIG_ERROR",
            message:
              "CMS auth is not configured. Set CMS_ADMIN_USER, CMS_ADMIN_PASSWORD, CMS_SESSION_SECRET.",
          },
        },
        { status: 500 }
      );
    }

    return new NextResponse("CMS auth is not configured.", { status: 500 });
  }

  const pathname = request.nextUrl.pathname;
  const cookieValue = readCookieValue(request.headers.get("cookie"), CMS_SESSION_COOKIE);
  const isAuthenticated = cookieValue
    ? Boolean(
        await verifyCmsSessionToken({
          token: cookieValue,
          sessionSecret: credentials.sessionSecret,
          expectedUser: credentials.username,
        })
      )
    : false;

  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isProtectedApiPath(pathname) && !isAuthenticated) {
      return unauthorizedApiResponse();
    }
    return nextWithCmsUser(request, credentials.username);
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/admin/login", request.url);
    const nextValue = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextValue);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithCmsUser(request, credentials.username);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/cases",
    "/api/cases/:path*",
    "/api/save-content",
    "/api/upload-image",
    "/api/upload-image/cleanup",
    "/api/intake/github",
    "/api/intake/github/runtime-import",
  ],
};
