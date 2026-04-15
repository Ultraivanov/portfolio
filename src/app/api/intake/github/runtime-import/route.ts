import { apiError, apiSuccess } from "@/lib/api-response";
import { fetchGitHubWithRetry } from "@/lib/github-api";

type RuntimeScreenshotInput = {
  route?: unknown;
  pageUrl?: unknown;
  screenshotUrl?: unknown;
};

type RuntimeImportPayload = {
  slug?: unknown;
  screenshots?: unknown;
};

const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024; // 8 MiB per screenshot
const FETCH_TIMEOUT_MS = 20_000;

export async function POST(request: Request) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";

  if (!githubToken) {
    return apiError(500, "CONFIG_ERROR", "GitHub PAT not configured");
  }

  try {
    const payload = (await request.json()) as RuntimeImportPayload;
    const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
    const screenshots = normalizeScreenshots(payload.screenshots);

    if (!slug || !isSafeSlug(slug)) {
      return apiError(400, "INVALID_REQUEST", "slug must be a safe non-empty string.");
    }

    if (screenshots.length === 0) {
      return apiError(400, "INVALID_REQUEST", "screenshots must be a non-empty array.");
    }

    const imported: Array<{
      route: string;
      pageUrl: string;
      src: string;
      bytes: number;
    }> = [];
    const failed: Array<{
      route: string;
      pageUrl: string;
      screenshotUrl: string;
      reason: string;
    }> = [];

    for (let i = 0; i < screenshots.length; i += 1) {
      const shot = screenshots[i];
      try {
        const buffer = await fetchImageBuffer(shot.screenshotUrl);
        if (buffer.byteLength > MAX_SCREENSHOT_BYTES) {
          throw new Error(
            `Screenshot is too large (${buffer.byteLength} bytes). Max ${MAX_SCREENSHOT_BYTES} bytes.`
          );
        }

        const filePath = `public/cases/${slug}/runtime-${Date.now()}-${i + 1}.png`;
        const base64Content = buffer.toString("base64");

        const updateResponse = await fetchGitHubWithRetry(
          `https://api.github.com/repos/${githubRepo}/contents/${filePath}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${githubToken}`,
              Accept: "application/vnd.github+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Import runtime screenshot ${slug} ${shot.route}`,
              content: base64Content,
              branch: githubBranch,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            (await safeReadGitHubMessage(updateResponse)) ||
              `GitHub upload failed with ${updateResponse.status}`
          );
        }

        imported.push({
          route: shot.route,
          pageUrl: shot.pageUrl,
          src: filePath.replace(/^public/, ""),
          bytes: buffer.byteLength,
        });
      } catch (error) {
        failed.push({
          route: shot.route,
          pageUrl: shot.pageUrl,
          screenshotUrl: shot.screenshotUrl,
          reason: error instanceof Error ? error.message : "Unknown import error",
        });
      }
    }

    return apiSuccess({
      imported,
      failed,
      slug,
    });
  } catch (error) {
    return apiError(
      500,
      "RUNTIME_IMPORT_FAILED",
      error instanceof Error ? error.message : "Failed to import runtime screenshots"
    );
  }
}

function normalizeScreenshots(value: unknown): Array<{
  route: string;
  pageUrl: string;
  screenshotUrl: string;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: Array<{ route: string; pageUrl: string; screenshotUrl: string }> = [];
  for (const row of value as RuntimeScreenshotInput[]) {
    const route = typeof row.route === "string" ? row.route.trim() : "";
    const pageUrl = typeof row.pageUrl === "string" ? row.pageUrl.trim() : "";
    const screenshotUrl =
      typeof row.screenshotUrl === "string" ? row.screenshotUrl.trim() : "";

    if (!route || !pageUrl || !screenshotUrl) {
      continue;
    }

    if (!isHttpUrl(pageUrl) || !isHttpUrl(screenshotUrl)) {
      continue;
    }

    result.push({ route, pageUrl, screenshotUrl });
  }
  return result.slice(0, 12);
}

function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]+$/i.test(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`Screenshot fetch failed with HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadGitHubMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message;
  } catch {
    return undefined;
  }
}

