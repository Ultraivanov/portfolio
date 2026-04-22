import { apiSuccess } from "@/lib/api-response";
import { CMS_SESSION_COOKIE } from "@/lib/cms-auth";

export async function POST() {
  const response = apiSuccess({ success: true });
  response.cookies.set({
    name: CMS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
