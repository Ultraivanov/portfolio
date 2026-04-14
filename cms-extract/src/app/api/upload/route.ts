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
import { apiError, apiSuccess } from "@/lib/api-response";


export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO;
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const assetsDir = process.env.CMS_ASSETS_DIR || "public/assets";
  const svgTargetBytes = parseByteLimit(
    process.env.SVG_TARGET_MAX_BYTES,
    DEFAULT_SVG_TARGET_BYTES
  );

  if (!githubToken || !githubRepo) {
    return apiError(500, "CONFIG_ERROR", "GitHub not configured");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return apiError(400, "INVALID_REQUEST", "Missing file");
    }

    const ext = file.name.split(".").pop();
    const path = `${assetsDir}/${Date.now()}.${ext}`;

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
          return apiError(error.status, "SVG_VALIDATION_ERROR", error.message);
        }
        throw error;
      }
    }

    const finalBytes = uploadBuffer.byteLength;
    if (finalBytes > PLATFORM_MAX_FILE_BYTES) {
      return apiError(
        413,
        "FILE_TOO_LARGE",
        `File is too large after processing (${finalBytes} bytes). Max allowed is ${PLATFORM_MAX_FILE_BYTES} bytes.`
      );
    }

    const base64Content = uploadBuffer.toString("base64");

    // Upload to GitHub
    const response = await fetchGitHubWithRetry(
      `https://api.github.com/repos/${githubRepo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64Content,
          branch: githubBranch,
        }),
      }
    );

    if (!response.ok) {
      const error = await safeReadError(response);
      return apiError(
        response.status,
        "GITHUB_WRITE_FAILED",
        error || "Failed to upload"
      );
    }

    const result = await response.json();
    const publicPath = path.replace(/^public/, "");

    return apiSuccess({
      success: true,
      url: result.content?.download_url,
      path: publicPath,
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
