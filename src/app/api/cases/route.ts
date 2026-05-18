import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { fetchGitHubWithRetry } from "@/lib/github-api";
import { validateCaseContent } from "@/lib/case-content-validation";
import { logCmsAuditEvent, resolveCmsAuditWho } from "@/lib/cms-audit-log";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

type CreateCasePayload = {
  slug?: unknown;
  title?: unknown;
  subtitle?: unknown;
  coverSrc?: unknown;
  coverAlt?: unknown;
};

const SKELETON_SECTION_TITLES = [
  "Context",
  "Problem",
  "Constraints",
  "Role",
  "Approach",
  "Solution",
  "Outcome",
];

export async function GET() {
  try {
    // Read directly from disk to avoid cache issues
    const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
    const files = fs.readdirSync(casesDirectory).filter((f) => f.endsWith(".json"));

    const caseList = files.map((file) => {
      const raw = fs.readFileSync(path.join(casesDirectory, file), "utf-8");
      const data = JSON.parse(raw);
      const slug = file.replace(".json", "");
      return {
        slug: typeof data.slug === "string" ? data.slug : slug,
        title: data.title || slug,
        published: data.published === true,
        featured: data.featured === true,
      };
    });

    return apiSuccess({ items: caseList });
  } catch (error) {
    return apiError(
      500,
      "CASES_READ_FAILED",
      error instanceof Error ? error.message : "Failed to read cases"
    );
  }
}

export async function POST(request: NextRequest) {
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const auditWho = resolveCmsAuditWho(
    request.headers?.get?.("x-cms-user") || request.headers?.get?.("authorization")
  );

  if (!githubToken) {
    logCmsAuditEvent({
      what: "create-case",
      who: auditWho,
      result: "error",
      details: { code: "CONFIG_ERROR" },
    });
    return apiError(500, "CONFIG_ERROR", "GitHub PAT not configured");
  }

  let payload: CreateCasePayload;
  try {
    payload = (await request.json()) as CreateCasePayload;
  } catch {
    return apiError(400, "INVALID_REQUEST", "Invalid JSON body");
  }

  const slug = typeof payload.slug === "string" ? payload.slug.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const subtitle = typeof payload.subtitle === "string" && payload.subtitle.trim()
    ? payload.subtitle.trim()
    : "Short case summary.";
  const coverSrc = typeof payload.coverSrc === "string" && payload.coverSrc.trim()
    ? payload.coverSrc.trim()
    : `/cases/${slug}/cover.png`;
  const coverAlt = typeof payload.coverAlt === "string" && payload.coverAlt.trim()
    ? payload.coverAlt.trim()
    : `${title || slug} cover`;

  if (!SLUG_PATTERN.test(slug)) {
    return apiError(
      400,
      "INVALID_SLUG",
      "Slug must be 3-50 chars, lowercase letters/digits/hyphens only, no leading/trailing hyphen."
    );
  }

  if (!title) {
    return apiError(400, "INVALID_REQUEST", "Title is required");
  }

  const repoPath = `src/content/cases/${slug}.json`;

  // Local filesystem uniqueness check — fast path
  try {
    const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
    if (fs.existsSync(path.join(casesDirectory, `${slug}.json`))) {
      return apiError(409, "CASE_EXISTS", `Case with slug "${slug}" already exists.`);
    }
  } catch {
    // ignore, GitHub check below is authoritative
  }

  const skeleton = {
    slug,
    title,
    subtitle,
    published: false,
    featured: false,
    coverSrc,
    coverAlt,
    author: "Dima Ginzburg",
    lastUpdated: new Date().toISOString().slice(0, 10),
    facts: [
      { label: "Role", value: "Product Designer" },
      { label: "Scope", value: "TBD" },
    ],
    sections: SKELETON_SECTION_TITLES.map((sectionTitle) => ({
      title: sectionTitle,
      blocks: [
        {
          discriminant: "paragraph",
          value: { text: `TODO: ${sectionTitle.toLowerCase()} description.` },
        },
      ],
    })),
  };

  const validation = validateCaseContent(skeleton);
  if (!validation.ok) {
    return apiError(500, "VALIDATION_ERROR", validation.error);
  }

  const serialized = JSON.stringify(skeleton, null, 2);
  const encoded = Buffer.from(serialized).toString("base64");

  // Check GitHub for existing file
  const getResponse = await fetchGitHubWithRetry(
    `https://api.github.com/repos/${githubRepo}/contents/${repoPath}?ref=${githubBranch}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (getResponse.status === 200) {
    logCmsAuditEvent({
      what: "create-case",
      who: auditWho,
      path: repoPath,
      result: "error",
      details: { code: "CASE_EXISTS" },
    });
    return apiError(409, "CASE_EXISTS", `Case with slug "${slug}" already exists.`);
  }

  if (getResponse.status !== 404) {
    logCmsAuditEvent({
      what: "create-case",
      who: auditWho,
      path: repoPath,
      result: "error",
      details: { code: "GITHUB_READ_FAILED", status: getResponse.status },
    });
    return apiError(
      getResponse.status,
      "GITHUB_READ_FAILED",
      "Failed to verify slug availability on GitHub"
    );
  }

  const createResponse = await fetchGitHubWithRetry(
    `https://api.github.com/repos/${githubRepo}/contents/${repoPath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Create case ${slug} via CMS`,
        content: encoded,
        branch: githubBranch,
      }),
    }
  );

  if (!createResponse.ok) {
    let errorMessage = "Failed to create case";
    try {
      const body = (await createResponse.json()) as { message?: string };
      if (body.message) errorMessage = body.message;
    } catch {
      // noop
    }
    logCmsAuditEvent({
      what: "create-case",
      who: auditWho,
      path: repoPath,
      result: "error",
      details: { code: "GITHUB_WRITE_FAILED", status: createResponse.status },
    });
    return apiError(createResponse.status, "GITHUB_WRITE_FAILED", errorMessage);
  }

  const createPayload = (await createResponse.json()) as {
    content?: { sha?: string };
  };

  logCmsAuditEvent({
    what: "create-case",
    who: auditWho,
    path: repoPath,
    result: "success",
    commitSha: createPayload.content?.sha || null,
  });

  return apiSuccess({ slug, path: repoPath, sha: createPayload.content?.sha });
}
