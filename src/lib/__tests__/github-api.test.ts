/**
 * @jest-environment node
 */
import { fetchGitHubWithRetry } from "@/lib/github-api";

function createResponse(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("fetchGitHubWithRetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retries on retryable status code", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createResponse(500, { message: "server error" }))
      .mockResolvedValueOnce(createResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "GET" },
      { attempts: 3, baseDelayMs: 0, timeoutMs: 5000 }
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries after transient network error", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(createResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "PUT", body: "{}" },
      { attempts: 3, baseDelayMs: 0, timeoutMs: 5000 }
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 409 conflict", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createResponse(409, { message: "sha mismatch" }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "PUT", body: "{}" },
      { attempts: 3, baseDelayMs: 0, timeoutMs: 5000 }
    );

    expect(response.status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("honors Retry-After seconds header", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createResponse(429, { message: "rate limited" }, { "retry-after": "0" })
      )
      .mockResolvedValueOnce(createResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "GET" },
      { attempts: 2, baseDelayMs: 25, timeoutMs: 5000 }
    );

    const delays = timeoutSpy.mock.calls.map((call) => call[1]);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(delays).toContain(0);
    expect(delays).not.toContain(25);
  });

  it("honors Retry-After HTTP-date header", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createResponse(503, { message: "unavailable" }, {
          "retry-after": new Date(1_700_000_000_000).toUTCString(),
        })
      )
      .mockResolvedValueOnce(createResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "GET" },
      { attempts: 2, baseDelayMs: 25, timeoutMs: 5000 }
    );

    const delays = timeoutSpy.mock.calls.map((call) => call[1]);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(delays).toContain(0);
    expect(delays).not.toContain(25);
  });

  it("falls back to exponential backoff for invalid Retry-After header", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createResponse(503, { message: "unavailable" }, { "retry-after": "soon" })
      )
      .mockResolvedValueOnce(createResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchGitHubWithRetry(
      "https://api.github.com/repos/a/b/contents/path",
      { method: "GET" },
      { attempts: 2, baseDelayMs: 17, timeoutMs: 5000 }
    );

    const delays = timeoutSpy.mock.calls.map((call) => call[1]);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(delays).toContain(17);
  });
});
