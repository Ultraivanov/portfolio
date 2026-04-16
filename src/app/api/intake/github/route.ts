import { apiError, apiSuccess } from "@/lib/api-response";
import {
  buildCaseDraftFromSignals,
  fetchGitHubSignals,
  parseGitHubRepoUrl,
  type IntakeFocus,
} from "@/lib/github-case-intake";
import {
  applyImportedArtifactsToDraft,
  executeExtractorCommands,
} from "@/lib/github-case-extractor";
import { synthesizeCaseDraftWithLlm } from "@/lib/github-case-intake-llm";
import { buildDraftIntakeConfidence } from "@/lib/case-draft-quality";

type GitHubIntakePayload = {
  repoUrl?: unknown;
  focus?: unknown;
  runtimeBaseUrl?: unknown;
  screenshotLimit?: unknown;
  analysisMode?: unknown;
  runExtractor?: unknown;
};

const ALLOWED_FOCUS: ReadonlySet<IntakeFocus> = new Set([
  "ux-driven",
  "behavioral-model",
  "agentic-flow",
]);
const ALLOWED_ANALYSIS_MODES = new Set(["llm", "heuristic"]);
const DEFAULT_UPLOAD_REPO = "Ultraivanov/portfolio";
const DEFAULT_UPLOAD_BRANCH = "main";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GitHubIntakePayload;
    const repoUrl = typeof payload.repoUrl === "string" ? payload.repoUrl.trim() : "";
    const focus = normalizeFocus(payload.focus);
    const runtimeBaseUrl =
      typeof payload.runtimeBaseUrl === "string" ? payload.runtimeBaseUrl.trim() : "";
    const screenshotLimit = normalizeScreenshotLimit(payload.screenshotLimit);
    const analysisMode = normalizeAnalysisMode(payload.analysisMode);
    const runExtractor = normalizeRunExtractor(payload.runExtractor);

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

    let draft = llmResult?.draft ?? heuristic.draft;
    const evidence = heuristic.evidence;
    const extractor = {
      requested: shouldUseLlm && runExtractor,
      executed: false,
      commandCount: llmResult?.commands.length ?? 0,
      imported: [] as Awaited<ReturnType<typeof executeExtractorCommands>>["imported"],
      failed: [] as Awaited<ReturnType<typeof executeExtractorCommands>>["failed"],
      skippedReason: null as string | null,
    };

    if (extractor.requested) {
      const commands = llmResult?.commands ?? [];
      if (commands.length === 0) {
        extractor.skippedReason = "LLM returned no extractor commands.";
      } else if (!isSafeSlug(draft.slug)) {
        extractor.skippedReason = "Draft slug is not safe for repository upload path.";
      } else {
        const githubToken = process.env.GITHUB_PAT;
        const githubRepo = process.env.GITHUB_REPO || DEFAULT_UPLOAD_REPO;
        const githubBranch = process.env.GITHUB_BRANCH || DEFAULT_UPLOAD_BRANCH;

        if (!githubToken) {
          extractor.skippedReason = "GITHUB_PAT is required to execute extractor commands.";
        } else {
          const extraction = await executeExtractorCommands({
            slug: draft.slug,
            commands,
            githubToken,
            githubRepo,
            githubBranch,
          });
          extractor.executed = true;
          extractor.imported = extraction.imported;
          extractor.failed = extraction.failed;
          draft = applyImportedArtifactsToDraft(draft, extraction.imported);
        }
      }
    }

    const confidence = buildDraftIntakeConfidence(draft, { evidenceLinks: evidence });

    return apiSuccess({
      draft,
      evidence,
      confidence,
      source: {
        owner: repoRef.owner,
        repo: repoRef.repo,
        focus,
        runtimeBaseUrl: runtimeBaseUrl || null,
        analysisMode,
        runExtractor,
      },
      routeCandidates: signals.routeCandidates,
      runtimeScreenshots: signals.runtimeScreenshots,
      extractor,
      llm: llmResult
        ? {
            model: llmResult.model,
            usage: llmResult.usage,
            commandCount: llmResult.commands.length,
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

function normalizeRunExtractor(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return true;
}

function isSafeSlug(value: string): boolean {
  return /^[a-z0-9-]+$/i.test(value);
}
