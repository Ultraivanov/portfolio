import { NextRequest } from "next/server";
import {
  DEFAULT_SVG_TARGET_BYTES,
  GITHUB_FILE_WARNING_BYTES,
  PLATFORM_MAX_FILE_BYTES,
  SvgUploadError,
  isSvgUpload,
  optimizeSvgForUpload,
  parseByteLimit,
} from "@/lib/svg-upload";
import { fetchGitHubWithRetry } from "@/lib/github-api";
import { logCmsAuditEvent, resolveCmsAuditWho } from "@/lib/cms-audit-log";
import { apiError, apiSuccess } from "@/lib/api-response";


export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const auditWho = resolveCmsAuditWho(request.headers?.get?.("authorization"));
  let auditPath = "";
  const svgTargetBytes = parseByteLimit(
    process.env.SVG_TARGET_MAX_BYTES,
    DEFAULT_SVG_TARGET_BYTES
  );

  if (!githubToken) {
    logCmsAuditEvent({
      what: "upload-image",
      who: auditWho,
      result: "error",
      details: { code: "CONFIG_ERROR" },
    });
    return apiError(500, "CONFIG_ERROR", "GitHub PAT not configured");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;
    auditPath = path;

    if (!file || !path) {
      logCmsAuditEvent({
        what: "upload-image",
        who: auditWho,
        path,
        result: "error",
        details: { code: "INVALID_REQUEST" },
      });
      return apiError(400, "INVALID_REQUEST", "Missing file or path");
    }

    // Convert file and normalize SVG uploads before saving to GitHub.
    const bytes = await file.arrayBuffer();
    let uploadBuffer = Buffer.from(bytes);
    const originalBytes = uploadBuffer.byteLength;
    let svgOptimization:
      | {
          optimized: boolean;
          originalBytes: number;
          optimizedBytes: number;
          usedAggressivePass: boolean;
        }
      | undefined;

    if (uploadBuffer.byteLength > PLATFORM_MAX_FILE_BYTES) {
      logCmsAuditEvent({
        what: "upload-image",
        who: auditWho,
        path,
        result: "error",
        details: { code: "FILE_TOO_LARGE", stage: "initial" },
      });
      return apiError(
        413,
        "FILE_TOO_LARGE",
        `File is too large (${uploadBuffer.byteLength} bytes). Max allowed is ${PLATFORM_MAX_FILE_BYTES} bytes.`
      );
    }

    if (isSvgUpload(file)) {
      try {
        const optimized = optimizeSvgForUpload(
          uploadBuffer.toString("utf-8"),
          svgTargetBytes
        );
        uploadBuffer = Buffer.from(optimized.content, "utf-8");
        svgOptimization = {
          optimized: optimized.optimizedBytes < optimized.originalBytes,
          originalBytes: optimized.originalBytes,
          optimizedBytes: optimized.optimizedBytes,
          usedAggressivePass: optimized.usedAggressivePass,
        };
      } catch (error) {
        if (error instanceof SvgUploadError) {
          logCmsAuditEvent({
            what: "upload-image",
            who: auditWho,
            path,
            result: "error",
            details: { code: "SVG_VALIDATION_ERROR", status: error.status },
          });
          return apiError(error.status, "SVG_VALIDATION_ERROR", error.message);
        }
        throw error;
      }
    }

    const finalBytes = uploadBuffer.byteLength;
    if (finalBytes > PLATFORM_MAX_FILE_BYTES) {
      logCmsAuditEvent({
        what: "upload-image",
        who: auditWho,
        path,
        result: "error",
        details: { code: "FILE_TOO_LARGE", stage: "processed" },
      });
      return apiError(
        413,
        "FILE_TOO_LARGE",
        `File is too large after processing (${finalBytes} bytes). Max allowed is ${PLATFORM_MAX_FILE_BYTES} bytes.`
      );
    }

    const base64Content = uploadBuffer.toString("base64");

    // Check if file exists
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
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // Upload to GitHub
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
          message: `Upload ${path} via CMS`,
          content: base64Content,
          branch: githubBranch,
          sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await safeReadError(updateResponse);
      if (updateResponse.status === 409) {
        logCmsAuditEvent({
          what: "upload-image",
          who: auditWho,
          path,
          result: "conflict",
          details: { code: "GITHUB_WRITE_FAILED", status: updateResponse.status },
        });
      } else {
        logCmsAuditEvent({
          what: "upload-image",
          who: auditWho,
          path,
          result: "error",
          details: { code: "GITHUB_WRITE_FAILED", status: updateResponse.status },
        });
      }
      return apiError(
        updateResponse.status,
        "GITHUB_WRITE_FAILED",
        error || "Failed to upload"
      );
    }

    const result = await updateResponse.json();
    const commitSha =
      typeof result?.commit?.sha === "string"
        ? result.commit.sha
        : null;

    logCmsAuditEvent({
      what: "upload-image",
      who: auditWho,
      path,
      result: "success",
      commitSha,
    });

    return apiSuccess({
      success: true,
      url: result.content?.download_url || result.content?.url,
      path: path,
      size: {
        beforeBytes: originalBytes,
        afterBytes: finalBytes,
      },
      svgOptimization,
      warning:
        finalBytes > GITHUB_FILE_WARNING_BYTES
          ? `File is larger than GitHub's 50 MiB warning threshold (${finalBytes} bytes).`
          : undefined,
    });
  } catch (error) {
    logCmsAuditEvent({
      what: "upload-image",
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

async function safeReadError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}
