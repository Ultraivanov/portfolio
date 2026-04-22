/**
 * @jest-environment node
 */
import { POST } from "@/app/api/admin/logout/route";

describe("POST /api/admin/logout", () => {
  it("clears cms session cookie", async () => {
    const response = await POST();
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(setCookie).toContain("cms_session=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
