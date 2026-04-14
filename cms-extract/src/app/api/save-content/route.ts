import { NextRequest } from "next/server";
import { fetchGitHubWithRetry } from "@/lib/github-api";
import { apiError, apiSuccess } from "@/lib/api-response";

type SaveContentPayload = {
  path?: unknown;
  content?: unknown;
  message?: unknown;
};

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO;
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const contentDir = process.env.CMS_CONTENT_DIR || "content";

  if (!githubToken || !githubRepo) {
    return apiError(500, "CONFIG_ERROR", "GitHub not configured");
  }

  try {
    const payload = (await request.json()) as SaveContentPayload;
    const path = typeof payload.path === "string" ? payload.path : "";
    const content = payload.content;
    const message = typeof payload.message === "string" ? payload.message : undefined;

    if (!path || !content) {
      return apiError(400, "INVALID_REQUEST", "Missing path or content");
    }

    if (!new RegExp(`^${escapeRegex(contentDir)}\\/[a-z0-9-]+\\.json$`, "i").test(path)) {
      return apiError(
        400,
        "INVALID_PATH",
        `Invalid path. Expected ${contentDir}/<slug>.json`
      );
    }

    if (typeof content !== "object" || content === null || Array.isArray(content)) {
      return apiError(422, "VALIDATION_ERROR", "Content must be a JSON object");
    }

    const serializedContent = JSON.stringify(content, null, 2);
    const encodedContent = Buffer.from(serializedContent).toString("base64");

    // Get current file SHA (if exists)
    const getResponse = await fetchGitHubWithRetry(
      `https://api.github.com/repos/${githubRepo}/contents/${path}?ref=${githubBranch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    let sha: string | undefined;
    if (getResponse.status === 200) {
      const fileData = (await getResponse.json()) as {
        sha?: string;
        content?: string;
        encoding?: string;
      };
      sha = fileData.sha;

      if (fileData.encoding === "base64" && typeof fileData.content === "string") {
        const currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");
        if (currentContent === serializedContent) {
          return apiSuccess({
            success: true,
            skipped: true,
            reason: "unchanged",
          });
        }
      }
    } else if (getResponse.status !== 404) {
      const error = await safeReadError(getResponse);
      return apiError(
        getResponse.status,
        "GITHUB_READ_FAILED",
        error || "Failed to read existing content from GitHub"
      );
    }

    // Update or create file
    const updateResponse = await fetchGitHubWithRetry(
      `https://api.github.com/repos/${githubRepo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message || `Update ${path}`,
          content: encodedContent,
          branch: githubBranch,
          sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await safeReadError(updateResponse);
      if (updateResponse.status === 409) {
        return apiError(
          409,
          "CONTENT_CONFLICT",
          error || "Content was updated in the repository. Reload the latest version and retry.",
          { path }
        );
      }
      return apiError(
        updateResponse.status,
        "GITHUB_WRITE_FAILED",
        error || "Failed to save"
      );
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function safeReadError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}
