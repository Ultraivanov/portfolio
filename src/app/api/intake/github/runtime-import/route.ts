import { apiError, apiSuccess } from "@/lib/api-response";
import {
  executeExtractorCommands,
  normalizeExtractorCommands,
  type ExtractorCommand,
} from "@/lib/github-case-extractor";

type RuntimeImportPayload = {
  slug?: unknown;
  screenshots?: unknown;
  commands?: unknown;
};

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
    const commands = normalizeRuntimeImportCommands(payload);

    if (!slug || !isSafeSlug(slug)) {
      return apiError(400, "INVALID_REQUEST", "slug must be a safe non-empty string.");
    }

    if (commands.length === 0) {
      return apiError(
        400,
        "INVALID_REQUEST",
        "Provide at least one extractor command or screenshot input."
      );
    }

    const result = await executeExtractorCommands({
      slug,
      commands,
      githubToken,
      githubRepo,
      githubBranch,
    });

    return apiSuccess({
      imported: result.imported,
      failed: result.failed,
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

function normalizeRuntimeImportCommands(payload: RuntimeImportPayload): ExtractorCommand[] {
  const direct = normalizeExtractorCommands(payload.commands);
  if (direct.length > 0) {
    return direct;
  }

  if (!Array.isArray(payload.screenshots)) {
    return [];
  }

  return normalizeExtractorCommands(
    payload.screenshots.map((row) => {
      if (typeof row !== "object" || row === null) {
        return null;
      }
      const record = row as Record<string, unknown>;
      return {
        type: "import_runtime_screenshot",
        route: record.route,
        pageUrl: record.pageUrl,
        screenshotUrl: record.screenshotUrl,
      };
    })
  );
}

function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]+$/i.test(value);
}

