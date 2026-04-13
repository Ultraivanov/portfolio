import { NextRequest, NextResponse } from "next/server";
import { cmsErrorResponse } from "@/lib/cms/errors";
import { getRepositoryFileMeta, putRepositoryFile } from "@/lib/cms/github";
import { validateUploadPath } from "@/lib/cms/validation";

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return cmsErrorResponse(
      500,
      "github_not_configured",
      "GitHub PAT not configured",
    );
  }

  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");
    const rawPath = formData.get("path");

    if (!(rawFile instanceof File)) {
      return cmsErrorResponse(400, "validation_error", "Missing file");
    }

    if (rawFile.size > MAX_UPLOAD_SIZE_BYTES) {
      return cmsErrorResponse(400, "validation_error", "File size exceeds 10MB limit");
    }

    if (!rawFile.type.startsWith("image/")) {
      return cmsErrorResponse(400, "validation_error", "Only image uploads are allowed");
    }

    const pathValidation = validateUploadPath(rawPath);
    if (!pathValidation.ok) {
      return cmsErrorResponse(400, "path_not_allowed", pathValidation.error, pathValidation.details);
    }

    // Convert file to base64
    const bytes = await rawFile.arrayBuffer();
    const base64Content = Buffer.from(bytes).toString("base64");

    // Check if file exists
    const getResponse = await getRepositoryFileMeta({
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      path: pathValidation.data.path,
      token: GITHUB_TOKEN,
    });

    let sha: string | undefined;
    if (getResponse.ok) {
      sha = getResponse.data.sha;
    } else if (getResponse.status !== 404) {
      const code = getResponse.status === 429 ? "github_rate_limited" : "github_error";
      return cmsErrorResponse(getResponse.status || 502, code, getResponse.message);
    }

    // Upload to GitHub
    const updateResponse = await putRepositoryFile({
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      path: pathValidation.data.path,
      token: GITHUB_TOKEN,
      message: `Upload ${pathValidation.data.path} via CMS`,
      base64Content,
      sha,
    });

    if (!updateResponse.ok) {
      const code =
        updateResponse.status === 409 || updateResponse.status === 422
          ? "github_conflict"
          : updateResponse.status === 429
            ? "github_rate_limited"
            : "github_error";
      return cmsErrorResponse(updateResponse.status || 502, code, updateResponse.message);
    }

    const responseBody =
      typeof updateResponse.data === "object" && updateResponse.data !== null
        ? (updateResponse.data as {
            content?: { download_url?: string; url?: string };
          })
        : {};

    return NextResponse.json({
      success: true,
      url: responseBody.content?.download_url || responseBody.content?.url,
      path: pathValidation.data.path,
    });
  } catch (error) {
    return cmsErrorResponse(
      500,
      "internal_error",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
