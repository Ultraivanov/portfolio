/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/save-content/route";

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

function validCaseContent() {
  return {
    slug: "test-case",
    title: "Test Case",
    subtitle: "Stable save flow",
    coverSrc: "/cases/test/cover.png",
    coverAlt: "Test cover",
    facts: [{ label: "role", value: "Product Designer" }],
    sections: [
      {
        title: "Context",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "Context text" },
          },
        ],
      },
    ],
  };
}

describe("POST /api/save-content", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      GITHUB_PAT: "token",
      GITHUB_REPO: "owner/repo",
      GITHUB_BRANCH: "main",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects invalid paths", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({
        path: "src/content/unknown.json",
        content: validCaseContent(),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/Allowed paths/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid case payload", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({
        path: "src/content/cases/test-case.json",
        content: { slug: "test-case" },
      })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toMatch(/must be/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns skipped when content is unchanged", async () => {
    const content = validCaseContent();
    const serialized = JSON.stringify(content, null, 2);

    const fetchMock = jest.fn().mockResolvedValueOnce(
      createGitHubResponse(
        {
          sha: "abc123",
          encoding: "base64",
          content: Buffer.from(serialized).toString("base64"),
        },
        200
      )
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({
        path: "src/content/cases/test-case.json",
        content,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe("unchanged");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves content when file does not exist", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(createGitHubResponse({ content: { sha: "new-sha" } }, 200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({
        path: "src/content/cases/test-case.json",
        content: validCaseContent(),
        message: "update case",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns CONTENT_CONFLICT on github sha conflict", async () => {
    const content = validCaseContent();
    const current = {
      ...content,
      title: "Current title",
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createGitHubResponse(
          {
            sha: "sha-current",
            encoding: "base64",
            content: Buffer.from(JSON.stringify(current, null, 2)).toString("base64"),
          },
          200
        )
      )
      .mockResolvedValueOnce(
        createGitHubResponse(
          { message: "sha does not match" },
          409
        )
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await POST(
      createRequest({
        path: "src/content/cases/test-case.json",
        content,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("CONTENT_CONFLICT");
    expect(body.error.message).toMatch(/sha does not match|Reload/i);
  });

  it("accepts home.json payload when schema is valid", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(createGitHubResponse({ content: { sha: "home-sha" } }, 200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const homeContent = {
      hero: {
        titleImageSrc: "/home/title.svg",
        titleImageAlt: "Title",
        headline: "Headline",
        ctaLabel: "Contact",
        ctaHref: "/contact",
        secondaryCtaLabel: "CV",
        secondaryCtaHref: "/cv",
      },
      about: {
        name: "Dima",
        role: "Designer",
        avatarSrc: "/home/avatar.png",
        description: "Bio",
      },
      cover: { src: "/home/cover.png", alt: "Cover" },
      skills: { label: "/ skills", groups: [{ title: "A", items: ["B"] }] },
      tools: { label: "/ tools", groups: [{ title: "A", items: ["B"] }] },
      resources: {
        label: "/ resources",
        items: [
          {
            title: "Resource",
            description: "Desc",
            linkLabel: "Open",
            href: "https://example.com",
          },
        ],
      },
      cta: {
        titleLine1: "Let us",
        titleLine2: "build",
        highlight: "together",
        description: "Desc",
        links: [{ label: "CV", href: "/cv" }],
      },
    };

    const response = await POST(
      createRequest({
        path: "src/content/home.json",
        content: homeContent,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("strips legacy media.variant before validation and save", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createGitHubResponse({}, 404))
      .mockResolvedValueOnce(createGitHubResponse({ content: { sha: "new-sha" } }, 200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const contentWithLegacyVariant = {
      ...validCaseContent(),
      sections: [
        {
          title: "Context",
          blocks: [
            {
              discriminant: "media",
              value: {
                src: "/cases/test/diagram.svg",
                alt: "Diagram",
                caption: "Caption",
                variant: "diagram",
              },
            },
          ],
        },
      ],
    };

    const response = await POST(
      createRequest({
        path: "src/content/cases/test-case.json",
        content: contentWithLegacyVariant,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    const updateCall = fetchMock.mock.calls[1];
    const options = updateCall[1] as RequestInit;
    const requestBody = JSON.parse(String(options.body));
    const decoded = JSON.parse(Buffer.from(requestBody.content, "base64").toString("utf-8"));
    const mediaValue = decoded.sections[0].blocks[0].value;

    expect(mediaValue.variant).toBeUndefined();
    expect(mediaValue.src).toBe("/cases/test/diagram.svg");
  });
});
