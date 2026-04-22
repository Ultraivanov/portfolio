import { apiError, apiSuccess } from "@/lib/api-response";
import {
  CMS_SESSION_COOKIE,
  CMS_SESSION_MAX_AGE_SECONDS,
  createCmsSessionToken,
  getCmsCredentials,
  isCmsLoginValid,
} from "@/lib/cms-auth";

type LoginPayload = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  const credentials = getCmsCredentials();
  if (!credentials) {
    return apiError(
      500,
      "CONFIG_ERROR",
      "CMS auth is not configured. Set CMS_ADMIN_USER, CMS_ADMIN_PASSWORD, CMS_SESSION_SECRET."
    );
  }

  try {
    const payload = (await request.json()) as LoginPayload;
    const username = typeof payload.username === "string" ? payload.username : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!username || !password) {
      return apiError(400, "INVALID_REQUEST", "username and password are required.");
    }

    if (!isCmsLoginValid({ username, password, credentials })) {
      return apiError(401, "INVALID_CREDENTIALS", "Invalid username or password.");
    }

    const sessionToken = await createCmsSessionToken({
      user: credentials.username,
      sessionSecret: credentials.sessionSecret,
    });

    const response = apiSuccess({ success: true });
    response.cookies.set({
      name: CMS_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: CMS_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
