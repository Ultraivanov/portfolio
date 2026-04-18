/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/upload-image/route";

function createRequest(file: File, path: string): NextRequest {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  return {
    formData: async () => formData,
  } as NextRequest;
}

function createGitHubResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/upload-image", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      GITHUB_PAT: "test-token",
      GITHUB_REPO: "owner/repo",
      GITHUB_BRANCH: "main",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("uploads non-svg files and reports unchanged size", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(
        createGitHubResponse(
          {
            content: { download_url: "https://example.com/file.png" },
          },
          200
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const file = new File(["hello world"], "cover.png", { type: "image/png" });
    const response = await POST(
      createRequest(file, "public/cases/demo/cover.png")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.size.beforeBytes).toBe(11);
    expect(body.size.afterBytes).toBe(11);
    expect(body.svgOptimization).toBeUndefined();

    const putCall = fetchMock.mock.calls[1];
    const requestBody = JSON.parse(putCall[1].body as string) as {
      content: string;
    };
    expect(Buffer.from(requestBody.content, "base64").toString("utf-8")).toBe(
      "hello world"
    );
  });

  it("optimizes safe svg and reports size info", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(
        createGitHubResponse(
          {
            content: { download_url: "https://example.com/file.svg" },
          },
          200
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0 L10 0 L10 10 Z"></path></svg>`;
    const file = new File([svg], "diagram.svg", { type: "image/svg+xml" });

    const response = await POST(
      createRequest(file, "public/cases/demo/diagram.svg")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.size.beforeBytes).toBeGreaterThan(0);
    expect(body.size.afterBytes).toBeGreaterThan(0);
    expect(body.svgOptimization).toBeDefined();
    expect(body.svgOptimization.originalBytes).toBe(body.size.beforeBytes);
    expect(body.svgOptimization.optimizedBytes).toBe(body.size.afterBytes);
  });

  it("rejects unsafe svg before GitHub upload", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const unsafe = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`;
    const file = new File([unsafe], "unsafe.svg", { type: "image/svg+xml" });

    const response = await POST(
      createRequest(file, "public/cases/demo/unsafe.svg")
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SVG_VALIDATION_ERROR");
    expect(body.error.message).toMatch(/Unsafe SVG/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects traversal upload path", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const file = new File(["hello"], "cover.png", { type: "image/png" });
    const response = await POST(
      createRequest(file, "public/cases/demo/../cover.png")
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_PATH");
    expect(body.error.message).toMatch(/traversal/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects upload path outside public/cases", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const file = new File(["hello"], "cover.png", { type: "image/png" });
    const response = await POST(
      createRequest(file, "public/uploads/demo/cover.png")
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_PATH");
    expect(body.error.message).toMatch(/public\/cases/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported file extension in upload path", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const file = new File(["hello"], "cover.png", { type: "image/png" });
    const response = await POST(
      createRequest(file, "public/cases/demo/cover.html")
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_PATH");
    expect(body.error.message).toMatch(/Unsupported file extension/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
