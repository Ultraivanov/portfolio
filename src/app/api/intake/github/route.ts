import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildCaseDraftFromSignals,
  fetchGitHubSignals,
  parseGitHubRepoUrl,
  type IntakeFocus,
} from "@/lib/github-case-intake";
import { synthesizeCaseDraftWithLlm } from "@/lib/github-case-intake-llm";

type GitHubIntakePayload = {
  repoUrl?: unknown;
  focus?: unknown;
  runtimeBaseUrl?: unknown;
  screenshotLimit?: unknown;
  analysisMode?: unknown;
};

const ALLOWED_FOCUS: ReadonlySet<IntakeFocus> = new Set([
  "ux-driven",
  "behavioral-model",
  "agentic-flow",
]);
const ALLOWED_ANALYSIS_MODES = new Set(["llm", "heuristic"]);

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GitHubIntakePayload;
    const repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
    const focus = normalizeFocus(payload.focus);
    const runtimeBaseUrl =
      typeof payload.runtimeBaseUrl === "string" ? payload.runtimeBaseUrl.trim() : "";
    const screenshotLimit = normalizeScreenshotLimit(payload.screenshotLimit);
    const analysisMode = normalizeAnalysisMode(payload.analysisMode);

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

    const heuristic = buildCaseDraftFromSignals(signals, focus);

    const llmApiKey = process.env.OPENAI_API_KEY;
    const shouldUseLlm = analysisMode === "llm";
    if (shouldUseLlm && !llmApiKey) {
      return apiError(
        500,
        "LLM_CONFIG_ERROR",
        "OPENAI_API_KEY is required for LLM analysis mode."
      );
    }

    const llmResult =
      shouldUseLlm && llmApiKey
        ? await synthesizeCaseDraftWithLlm({
            signals,
            focus,
            fallbackDraft: heuristic.draft,
            repoUrl,
            apiKey: llmApiKey,
            model: process.env.GITHUB_INTAKE_LLM_MODEL,
          })
        : null;

    const draft = llmResult?.draft ?? heuristic.draft;
    const evidence = heuristic.evidence;

    return apiSuccess({
      draft,
      evidence,
      source: {
        owner: repoRef.owner,
        repo: repoRef.repo,
        focus,
        runtimeBaseUrl: runtimeBaseUrl || null,
        analysisMode,
      },
      routeCandidates: signals.routeCandidates,
      runtimeScreenshots: signals.runtimeScreenshots,
      llm: llmResult
        ? {
            model: llmResult.model,
            usage: llmResult.usage,
          }
        : null,
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

function normalizeAnalysisMode(value: unknown): "llm" | "heuristic" {
  if (typeof value === "string" && ALLOWED_ANALYSIS_MODES.has(value)) {
    return value as "llm" | "heuristic";
  }
  return "llm";
}
