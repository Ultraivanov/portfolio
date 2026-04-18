import { NextRequest } from "next/server";
import { typografCase } from "@/lib/typograf";
import { validateContentByPath } from "@/lib/case-content-validation";
import { fetchGitHubWithRetry } from "@/lib/github-api";
import { apiError, apiSuccess } from "@/lib/api-response";

type SaveContentPayload = {
  path?: unknown;
  content?: unknown;
  message?: unknown;
  baseSha?: unknown;
};

type TypografCaseInput = {
  title?: string;
  subtitle?: string;
  facts?: Array<{ label: string; value: string | string[] }>;
  sections?: Array<{
    title: string;
    blocks: Array<{
      discriminant: string;
      value: Record<string, unknown>;
    }>;
  }>;
};

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";

  if (!githubToken) {
    return apiError(500, "CONFIG_ERROR", "GitHub PAT not configured");
  }

  try {
    const payload = (await request.json()) as SaveContentPayload;
    const path = typeof payload.path === "string" ? payload.path : "";
    const content = payload.content;
    const message = typeof payload.message === "string" ? payload.message : undefined;
    const baseSha = typeof payload.baseSha === "string" && payload.baseSha ? payload.baseSha : undefined;

    if (!path || !content) {
      return apiError(400, "INVALID_REQUEST", "Missing path or content");
    }

    const normalizedContent = normalizeCaseMediaFields(path, content);

    const validation = validateContentByPath(path, normalizedContent);
    if (!validation.ok) {
      return apiError(422, "VALIDATION_ERROR", validation.error);
    }

    // Apply typograf to all text content before saving
    const processedContent = typografCase(normalizedContent as TypografCaseInput);
    const serializedContent = JSON.stringify(processedContent, null, 2);
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
            sha,
          });
        }
      }

      if (baseSha && sha !== baseSha) {
        return apiError(
          409,
          "CONTENT_CONFLICT",
          "Content changed in repository since you loaded this draft. Reload latest version and retry save.",
          { path, currentSha: sha, baseSha }
        );
      }
    } else if (getResponse.status !== 404) {
      const error = await safeReadError(getResponse);
      return apiError(
        getResponse.status,
        "GITHUB_READ_FAILED",
        error || "Failed to read existing content from GitHub"
      );
    } else if (baseSha) {
      return apiError(
        409,
        "CONTENT_CONFLICT",
        "Content changed in repository since you loaded this draft. Reload latest version and retry save.",
        { path, currentSha: null, baseSha }
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
          message: message || `Update ${path} via CMS`,
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

    const updatePayload = (await updateResponse.json()) as {
      content?: {
        sha?: string;
      };
    };

    return apiSuccess({
      success: true,
      sha: updatePayload.content?.sha,
    });
  } catch (error) {
    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

async function safeReadError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}

function normalizeCaseMediaFields(path: string, content: unknown): unknown {
  if (!/^src\/content\/cases\/[a-z0-9-]+\.json$/i.test(path)) {
    return content;
  }

  if (!isRecord(content) || !Array.isArray(content.sections)) {
    return content;
  }

  const sections = content.sections.map((section) => {
    if (!isRecord(section) || !Array.isArray(section.blocks)) {
      return section;
    }

    const blocks = section.blocks
      .map((block) => {
        if (!isRecord(block) || block.discriminant !== "media" || !isRecord(block.value)) {
          return block;
        }

        const { caption, ...restValue } = block.value;
        const normalizedValue = { ...restValue };
        delete normalizedValue.variant;
        const src = typeof normalizedValue.src === "string" ? normalizedValue.src.trim() : "";
        const alt = typeof normalizedValue.alt === "string" ? normalizedValue.alt.trim() : "";
        const normalizedCaption = typeof caption === "string" ? caption.trim() : caption;
        const includeCaption =
          normalizedCaption !== undefined &&
          !(typeof normalizedCaption === "string" && normalizedCaption.length === 0);

        // Allow saving while editing by discarding untouched placeholder media blocks.
        if (!src && !alt && !includeCaption) {
          return null;
        }

        return {
          ...block,
          value: {
            ...normalizedValue,
            ...(src && !alt ? { alt: deriveAltFromPath(src) } : {}),
            ...(includeCaption ? { caption: normalizedCaption } : {}),
          },
        };
      })
      .filter((block): block is NonNullable<typeof block> => block !== null);

    return {
      ...section,
      blocks,
    };
  });

  return {
    ...content,
    sections,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function deriveAltFromPath(src: string): string {
  const cleanSrc = src.split("?")[0]?.split("#")[0] ?? src;
  const fileName = cleanSrc.split("/").pop() ?? "";
  const decodedName = safeDecodeURIComponent(fileName);
  const baseName = decodedName.replace(/\.[^/.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized || "Image";
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
