/** @jest-environment node */

jest.mock("@/lib/cms/github", () => ({
  getRepositoryFileMeta: jest.fn(),
  putRepositoryFile: jest.fn(),
}));

import {
  getRepositoryFileMeta,
  putRepositoryFile,
} from "@/lib/cms/github";

const mockedGetRepositoryFileMeta = getRepositoryFileMeta as jest.MockedFunction<typeof getRepositoryFileMeta>;
const mockedPutRepositoryFile = putRepositoryFile as jest.MockedFunction<typeof putRepositoryFile>;

const loadPost = async () => {
  const routeModule = await import("@/app/api/save-content/route");
  return (routeModule.POST ||
    (routeModule as { default?: { POST?: typeof routeModule.POST } }).default?.POST)!;
};

describe("POST /api/save-content", () => {
  beforeEach(() => {
    process.env.GITHUB_PAT = "test-token";
    mockedGetRepositoryFileMeta.mockReset();
    mockedPutRepositoryFile.mockReset();
  });

  const buildRequest = (body: unknown) =>
    new Request("http://localhost/api/save-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 400 when path is not allowed", async () => {
    const POST = await loadPost();
    const response = await POST(
      buildRequest({
        path: "src/content/home.json",
        content: {},
      }) as never,
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("path_not_allowed");
  });

  it("returns 400 when payload and path slugs mismatch", async () => {
    const POST = await loadPost();
    const response = await POST(
      buildRequest({
        path: "src/content/cases/case-a.json",
        content: {
          slug: "case-b",
          title: "Case",
          subtitle: "Sub",
          coverSrc: "/cases/case-b/cover.png",
          coverAlt: "Cover",
          facts: [{ label: "role", value: "Designer" }],
          sections: [{ title: "Context", blocks: [] }],
        },
      }) as never,
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("validation_error");
  });

  it("returns 200 when payload is valid and github write succeeds", async () => {
    const POST = await loadPost();
    mockedGetRepositoryFileMeta.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      data: { sha: "abc123" },
    });
    mockedPutRepositoryFile.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      data: {},
    });

    const response = await POST(
      buildRequest({
        path: "src/content/cases/case-a.json",
        content: {
          slug: "case-a",
          title: "Case",
          subtitle: "Sub",
          coverSrc: "/cases/case-a/cover.png",
          coverAlt: "Cover",
          facts: [{ label: "role", value: "Designer" }],
          sections: [{ title: "Context", blocks: [] }],
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(mockedPutRepositoryFile).toHaveBeenCalledTimes(1);
  });

  it("maps github conflict to conflict code", async () => {
    const POST = await loadPost();
    mockedGetRepositoryFileMeta.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      message: "Not found",
    });
    mockedPutRepositoryFile.mockResolvedValue({
      ok: false,
      status: 409,
      headers: new Headers(),
      message: "Conflict",
    });

    const response = await POST(
      buildRequest({
        path: "src/content/cases/case-a.json",
        content: {
          slug: "case-a",
          title: "Case",
          subtitle: "Sub",
          coverSrc: "/cases/case-a/cover.png",
          coverAlt: "Cover",
          facts: [{ label: "role", value: "Designer" }],
          sections: [{ title: "Context", blocks: [] }],
        },
      }) as never,
    );

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.code).toBe("github_conflict");
  });
});
