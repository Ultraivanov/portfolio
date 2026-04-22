/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/upload-image/cleanup/route";

function createRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as NextRequest;
}

function createGitHubResponse(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function encodeJsonBase64(value: unknown): string {
  return Buffer.from(JSON.stringify(value, null, 2)).toString("base64");
}

describe("POST /api/upload-image/cleanup", () => {
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

  it("rejects invalid upload path", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({ path: "public/uploads/demo/cover.png" })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("INVALID_PATH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips cleanup when path is still referenced in case content", async () => {
    const caseContent = {
      slug: "demo",
      title: "Demo",
      subtitle: "Subtitle",
      coverSrc: "/cases/demo/cover.png",
      coverAlt: "Cover",
      facts: [],
      sections: [],
    };

    const fetchMock = jest.fn().mockResolvedValueOnce(
      createGitHubResponse(
        {
          sha: "case-sha",
          encoding: "base64",
          content: encodeJsonBase64(caseContent),
        },
        200
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({ path: "public/cases/demo/cover.png" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("referenced");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deletes orphaned upload when not referenced", async () => {
    const caseContent = {
      slug: "demo",
      title: "Demo",
      subtitle: "Subtitle",
      coverSrc: "/cases/demo/other.png",
      coverAlt: "Cover",
      facts: [],
      sections: [],
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createGitHubResponse(
          {
            sha: "case-sha",
            encoding: "base64",
            content: encodeJsonBase64(caseContent),
          },
          200
        )
      )
      .mockResolvedValueOnce(createGitHubResponse({ sha: "file-sha" }, 200))
      .mockResolvedValueOnce(
        createGitHubResponse({ commit: { sha: "cleanup-commit-sha" } }, 200)
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({ path: "public/cases/demo/cover.png" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.success).toBe(true);
    expect(body.deleted).toBe(true);
    expect(body.commitSha).toBe("cleanup-commit-sha");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const deleteCall = fetchMock.mock.calls[2];
    expect(deleteCall[1]?.method).toBe("DELETE");
  });

  it("skips cleanup when target file is already missing", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(createGitHubResponse({}, 404));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({ path: "public/cases/demo/cover.png" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("not_found");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
