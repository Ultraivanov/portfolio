/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { createCmsSessionToken } from "@/lib/cms-auth";
import { middleware } from "./middleware";

function createRequest(input: string, cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new NextRequest(input, { headers });
}

describe("CMS auth middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      CMS_ADMIN_USER: "Dima",
      CMS_ADMIN_PASSWORD: "top-secret",
      CMS_SESSION_SECRET: "session-secret-value",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("redirects /admin to login when no session cookie exists", async () => {
    const response = await middleware(createRequest("http://localhost/admin"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login?next=%2Fadmin");
  });

  it("returns 401 for protected CMS API when no session cookie exists", async () => {
    const response = await middleware(createRequest("http://localhost/api/cases"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows authenticated access to /admin and injects cms user header", async () => {
    const token = await createCmsSessionToken({
      user: "Dima",
      sessionSecret: "session-secret-value",
    });

    const response = await middleware(
      createRequest("http://localhost/admin", `cms_session=${token}`)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-request-x-cms-user")).toBe("Dima");
  });

  it("redirects authenticated /admin/login to /admin", async () => {
    const token = await createCmsSessionToken({
      user: "Dima",
      sessionSecret: "session-secret-value",
    });

    const response = await middleware(
      createRequest("http://localhost/admin/login", `cms_session=${token}`)
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/admin");
  });
});
