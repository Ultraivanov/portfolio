import { NextRequest } from "next/server";
import { fetchGitHubWithRetry } from "@/lib/github-api";
import { logCmsAuditEvent, resolveCmsAuditWho } from "@/lib/cms-audit-log";
import { apiError, apiSuccess } from "@/lib/api-response";

type CleanupPayload = {
  path?: unknown;
};

type GitHubContentResponse = {
  sha?: string;
  content?: string;
  encoding?: string;
};

const CASE_UPLOAD_PATH_REGEX =
  /^public\/cases\/([a-z0-9-]+)\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const auditWho = resolveCmsAuditWho(
    request.headers?.get?.("x-cms-user") || request.headers?.get?.("authorization")
  );
  let auditPath = "";

  if (!githubToken) {
    logCmsAuditEvent({
      what: "upload-image-cleanup",
      who: auditWho,
      result: "error",
      details: { code: "CONFIG_ERROR" },
    });
    return apiError(500, "CONFIG_ERROR", "GitHub PAT not configured");
  }

  try {
    const payload = (await request.json()) as CleanupPayload;
    const path = typeof payload.path === "string" ? payload.path.trim() : "";
    auditPath = path;

    if (!path) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        result: "error",
        details: { code: "INVALID_REQUEST" },
      });
      return apiError(400, "INVALID_REQUEST", "Missing path");
    }

    const parsed = parseCaseUploadPath(path);
    if (!parsed) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "error",
        details: { code: "INVALID_PATH" },
      });
      return apiError(422, "INVALID_PATH", "Invalid upload path. Use public/cases/<slug>/<file-name>.");
    }

    const casePath = `src/content/cases/${parsed.slug}.json`;
    const referenceCheck = await getCaseReferenceCheck({
      githubRepo,
      githubBranch,
      githubToken,
      casePath,
      uploadPath: path,
    });

    if (referenceCheck.error) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "error",
        details: {
          code: "GITHUB_READ_FAILED",
          status: referenceCheck.error.status,
          stage: "case-reference",
        },
      });
      return apiError(
        referenceCheck.error.status,
        "GITHUB_READ_FAILED",
        referenceCheck.error.message
      );
    }

    if (referenceCheck.referenced) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "skipped",
        details: { reason: "referenced" },
      });
      return apiSuccess({
        success: true,
        skipped: true,
        reason: "referenced",
        path,
      });
    }

    const fileGetResponse = await fetchGitHubWithRetry(
      `https://api.github.com/repos/${githubRepo}/contents/${path}?ref=${githubBranch}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (fileGetResponse.status === 404) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "skipped",
        details: { reason: "not_found" },
      });
      return apiSuccess({
        success: true,
        skipped: true,
        reason: "not_found",
        path,
      });
    }

    if (!fileGetResponse.ok) {
      const error = await safeReadError(fileGetResponse);
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "error",
        details: {
          code: "GITHUB_READ_FAILED",
          status: fileGetResponse.status,
          stage: "target-file",
        },
      });
      return apiError(
        fileGetResponse.status,
        "GITHUB_READ_FAILED",
        error || "Failed to read cleanup target"
      );
    }

    const fileData = (await fileGetResponse.json()) as GitHubContentResponse;
    if (!fileData.sha) {
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: "error",
        details: { code: "INVALID_GITHUB_RESPONSE", stage: "target-file" },
      });
      return apiError(502, "INVALID_GITHUB_RESPONSE", "Cleanup target sha is missing");
    }

    const deleteResponse = await fetchGitHubWithRetry(
      `https://api.github.com/repos/${githubRepo}/contents/${path}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Cleanup orphan ${path} via CMS`,
          sha: fileData.sha,
          branch: githubBranch,
        }),
      }
    );

    if (!deleteResponse.ok) {
      const error = await safeReadError(deleteResponse);
      const code =
        deleteResponse.status === 409 ? "GITHUB_DELETE_CONFLICT" : "GITHUB_DELETE_FAILED";
      logCmsAuditEvent({
        what: "upload-image-cleanup",
        who: auditWho,
        path,
        result: deleteResponse.status === 409 ? "conflict" : "error",
        details: {
          code,
          status: deleteResponse.status,
        },
      });
      return apiError(
        deleteResponse.status,
        code,
        error || "Failed to cleanup uploaded image"
      );
    }

    const deletePayload = (await deleteResponse.json()) as {
      commit?: { sha?: string };
    };

    const commitSha =
      typeof deletePayload.commit?.sha === "string" ? deletePayload.commit.sha : null;

    logCmsAuditEvent({
      what: "upload-image-cleanup",
      who: auditWho,
      path,
      result: "success",
      commitSha,
    });

    return apiSuccess({
      success: true,
      deleted: true,
      path,
      commitSha,
    });
  } catch (error) {
    logCmsAuditEvent({
      what: "upload-image-cleanup",
      who: auditWho,
      path: auditPath,
      result: "error",
      details: { code: "INTERNAL_ERROR" },
    });
    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

function parseCaseUploadPath(path: string): { slug: string } | null {
  if (path.includes("\\") || path.includes("..")) {
    return null;
  }

  const match = path.match(CASE_UPLOAD_PATH_REGEX);
  if (!match) {
    return null;
  }

  return {
    slug: match[1] || "",
  };
}

type CaseReferenceCheckResult =
  | { referenced: boolean; error?: undefined }
  | { referenced: false; error: { status: number; message: string } };

async function getCaseReferenceCheck(input: {
  githubRepo: string;
  githubBranch: string;
  githubToken: string;
  casePath: string;
  uploadPath: string;
}): Promise<CaseReferenceCheckResult> {
  const caseResponse = await fetchGitHubWithRetry(
    `https://api.github.com/repos/${input.githubRepo}/contents/${input.casePath}?ref=${input.githubBranch}`,
    {
      headers: {
        Authorization: `Bearer ${input.githubToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (caseResponse.status === 404) {
    return { referenced: false };
  }

  if (!caseResponse.ok) {
    const message =
      (await safeReadError(caseResponse)) || "Failed to read case content for cleanup";
    return {
      referenced: false,
      error: {
        status: caseResponse.status,
        message,
      },
    };
  }

  const caseData = (await caseResponse.json()) as GitHubContentResponse;
  if (caseData.encoding !== "base64" || typeof caseData.content !== "string") {
    return {
      referenced: false,
      error: {
        status: 502,
        message: "Unexpected case content payload from GitHub",
      },
    };
  }

  const decoded = Buffer.from(caseData.content, "base64").toString("utf-8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    return {
      referenced: false,
      error: {
        status: 500,
        message: "Failed to parse case content during cleanup",
      },
    };
  }

  const candidates = buildPathCandidates(input.uploadPath);
  return {
    referenced: hasReferenceCandidate(parsed, candidates),
  };
}

function buildPathCandidates(path: string): Set<string> {
  const normalized = path.trim();
  const withoutPublicPrefix = normalized.replace(/^public/, "");
  const slashPrefixed = withoutPublicPrefix.startsWith("/")
    ? withoutPublicPrefix
    : `/${withoutPublicPrefix}`;
  const withoutLeadingSlash = slashPrefixed.replace(/^\//, "");

  return new Set([
    normalized,
    withoutPublicPrefix,
    slashPrefixed,
    withoutLeadingSlash,
  ]);
}

function hasReferenceCandidate(value: unknown, candidates: Set<string>): boolean {
  if (typeof value === "string") {
    return candidates.has(value.trim());
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasReferenceCandidate(item, candidates));
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      hasReferenceCandidate(item, candidates)
    );
  }

  return false;
}

async function safeReadError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}
