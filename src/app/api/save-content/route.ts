import { NextRequest, NextResponse } from "next/server";
import { cmsErrorResponse } from "@/lib/cms/errors";
import { getRepositoryFileMeta, putRepositoryFile } from "@/lib/cms/github";
import { validateCaseContentPath, validateCaseStudyPayload } from "@/lib/cms/validation";

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return cmsErrorResponse(
      500,
      "github_not_configured",
      "GitHub PAT not configured",
    );
  }

  try {
    const payload = await request.json();
    const pathValidation = validateCaseContentPath(payload.path);
    if (!pathValidation.ok) {
      return cmsErrorResponse(400, "path_not_allowed", pathValidation.error, pathValidation.details);
    }

    const caseValidation = validateCaseStudyPayload(payload.content);
    if (!caseValidation.ok) {
      return cmsErrorResponse(400, "validation_error", caseValidation.error, caseValidation.details);
    }

    if (pathValidation.data.slug !== caseValidation.data.slug) {
      return cmsErrorResponse(400, "validation_error", "Path slug and payload slug mismatch", {
        pathSlug: pathValidation.data.slug,
        payloadSlug: caseValidation.data.slug,
      });
    }

    // Get current file SHA (if exists)
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

    // Update or create file
    const updateResponse = await putRepositoryFile({
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      path: pathValidation.data.path,
      token: GITHUB_TOKEN,
      message:
        typeof payload.message === "string" && payload.message.trim().length > 0
          ? payload.message
          : `Update ${pathValidation.data.path} via CMS`,
      base64Content: Buffer.from(
        JSON.stringify(caseValidation.data, null, 2),
      ).toString("base64"),
      sha,
    });

    if (!updateResponse.ok) {
      const code =
        updateResponse.status === 409 || updateResponse.status === 422
          ? "github_conflict"
          : updateResponse.status === 429
            ? "github_rate_limited"
            : "github_error";

      const status = updateResponse.status || 502;
      return cmsErrorResponse(status, code, updateResponse.message);
    }

    return NextResponse.json({
      success: true,
      slug: caseValidation.data.slug,
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
