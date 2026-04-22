/**
 * @jest-environment node
 */
import { POST } from "@/app/api/admin/login/route";

function createJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login", () => {
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

  it("returns config error when CMS auth env is missing", async () => {
    process.env = { ...originalEnv };

    const response = await POST(
      createJsonRequest({ username: "Dima", password: "top-secret" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("CONFIG_ERROR");
  });

  it("rejects invalid credentials", async () => {
    const response = await POST(
      createJsonRequest({ username: "Dima", password: "wrong-password" })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("creates signed session cookie for valid credentials", async () => {
    const response = await POST(
      createJsonRequest({ username: "dima", password: "top-secret" })
    );
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(setCookie).toContain("cms_session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/");
  });
});
