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
  const routeModule = await import("@/app/api/upload-image/route");
  return (routeModule.POST ||
    (routeModule as { default?: { POST?: typeof routeModule.POST } }).default?.POST)!;
};

describe("POST /api/upload-image", () => {
  beforeEach(() => {
    process.env.GITHUB_PAT = "test-token";
    mockedGetRepositoryFileMeta.mockReset();
    mockedPutRepositoryFile.mockReset();
  });

  const buildFormRequest = (formData: FormData) =>
    new Request("http://localhost/api/upload-image", {
      method: "POST",
      body: formData,
    });

  it("returns 400 when path is invalid", async () => {
    const POST = await loadPost();
    const form = new FormData();
    form.append("file", new File(["img"], "test.png", { type: "image/png" }));
    form.append("path", "public/other/test.png");

    const response = await POST(buildFormRequest(form) as never);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("path_not_allowed");
  });

  it("returns 400 when file is not image", async () => {
    const POST = await loadPost();
    const form = new FormData();
    form.append("file", new File(["x"], "test.txt", { type: "text/plain" }));
    form.append("path", "public/cases/case-a/test.txt");

    const response = await POST(buildFormRequest(form) as never);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("validation_error");
  });

  it("returns 200 when upload succeeds", async () => {
    const POST = await loadPost();
    mockedGetRepositoryFileMeta.mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      message: "Not found",
    });
    mockedPutRepositoryFile.mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers(),
      data: { content: { download_url: "https://example.com/file.png" } },
    });

    const form = new FormData();
    form.append("file", new File(["img"], "test.png", { type: "image/png" }));
    form.append("path", "public/cases/case-a/test.png");

    const response = await POST(buildFormRequest(form) as never);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.path).toBe("public/cases/case-a/test.png");
  });
});
