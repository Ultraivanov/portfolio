import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildCaseDraftFromSignals,
  fetchGitHubSignals,
  parseGitHubRepoUrl,
  type IntakeFocus,
} from "@/lib/github-case-intake";

type GitHubIntakePayload = {
  repoUrl?: unknown;
  focus?: unknown;
  runtimeBaseUrl?: unknown;
  screenshotLimit?: unknown;
};

const ALLOWED_FOCUS: ReadonlySet<IntakeFocus> = new Set([
  "ux-driven",
  "behavioral-model",
  "agentic-flow",
]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GitHubIntakePayload;
    const repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
    const focus = normalizeFocus(payload.focus);
    const runtimeBaseUrl =
      typeof payload.runtimeBaseUrl === "string" ? payload.runtimeBaseUrl.trim() : "";
    const screenshotLimit = normalizeScreenshotLimit(payload.screenshotLimit);

    if (!repoUrl) {
      return apiError(400, "INVALID_REQUEST", "repoUrl is required.");
    }

    const repoRef = parseGitHubRepoUrl(repoUrl);
    if (!repoRef) {
      return apiError(
        400,
        "INVALID_REPO_URL",
        "Provide a valid GitHub repository URL like https://github.com/owner/repo."
      );
    }

    const signals = await fetchGitHubSignals({
      owner: repoRef.owner,
      repo: repoRef.repo,
      token: process.env.GITHUB_PAT,
      runtimeBaseUrl: runtimeBaseUrl || undefined,
      screenshotLimit,
      screenshotTemplate: process.env.GITHUB_INTAKE_SCREENSHOT_TEMPLATE,
    });

    const { draft, evidence } = buildCaseDraftFromSignals(signals, focus);

    return apiSuccess({
      draft,
      evidence,
      source: {
        owner: repoRef.owner,
        repo: repoRef.repo,
        focus,
        runtimeBaseUrl: runtimeBaseUrl || null,
      },
      routeCandidates: signals.routeCandidates,
      runtimeScreenshots: signals.runtimeScreenshots,
    });
  } catch (error) {
    return apiError(
      500,
      "GITHUB_INTAKE_FAILED",
      error instanceof Error ? error.message : "Failed to generate draft from GitHub"
    );
  }
}

function normalizeFocus(value: unknown): IntakeFocus {
  if (typeof value === "string" && ALLOWED_FOCUS.has(value as IntakeFocus)) {
    return value as IntakeFocus;
  }
  return "ux-driven";
}

function normalizeScreenshotLimit(value: unknown): number {
  if (typeof value !== "number") {
    return 6;
  }
  if (!Number.isFinite(value)) {
    return 6;
  }
  return Math.max(1, Math.min(12, Math.round(value)));
}
