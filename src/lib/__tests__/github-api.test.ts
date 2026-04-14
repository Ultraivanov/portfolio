/**
 * @jest-environment node
 */
import { fetchGitHubWithRetry } from "@/lib/github-api";

function createResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchGitHubWithRetry", () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
});
