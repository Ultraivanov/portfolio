/**
 * @jest-environment node
 */
import { GET } from "@/app/api/cover/blueprint/route";

describe("GET /api/cover/blueprint", () => {
  it("returns svg response with expected content-type", async () => {
    const request = new Request(
      "http://localhost/api/cover/blueprint?title=Agent%20Workbench&subtitle=UX%20case&focus=agentic-flow"
    );

    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("image/svg+xml");
    expect(body).toContain("<svg");
    expect(body).toContain("Agent Workbench");
    expect(body).toContain("Agentic flow");
  });

  it("falls back to ux-driven focus and clamps dimensions", async () => {
    const request = new Request(
      "http://localhost/api/cover/blueprint?title=Case&subtitle=Sub&focus=unknown&width=99999&height=10"
    );

    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("UX-driven");
    expect(body).toContain('viewBox="0 0 2400 450"');
  });
});
