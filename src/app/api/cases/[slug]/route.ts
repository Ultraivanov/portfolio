import fs from "node:fs";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api-response";
import { fetchGitHubWithRetry } from "@/lib/github-api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
  const githubBranch = process.env.GITHUB_BRANCH || "main";
  const contentPath = `src/content/cases/${slug}.json`;

  try {
    if (githubToken) {
      const githubResponse = await fetchGitHubWithRetry(
        `https://api.github.com/repos/${githubRepo}/contents/${contentPath}?ref=${githubBranch}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github+json",
          },
        }
      );

      if (githubResponse.status === 200) {
        const body = (await githubResponse.json()) as {
          content?: string;
          encoding?: string;
          sha?: string;
        };

        if (body.encoding === "base64" && typeof body.content === "string") {
          const raw = Buffer.from(body.content, "base64").toString("utf-8");
          const caseStudy = JSON.parse(raw);
          return apiSuccess({ item: caseStudy, sha: body.sha });
        }
      }
    }

    // Read from disk as fallback.
    const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
    const filePath = path.join(casesDirectory, `${slug}.json`);
    const raw = fs.readFileSync(filePath, "utf-8");
    const caseStudy = JSON.parse(raw);
    return apiSuccess({ item: caseStudy, sha: null });
  } catch (error) {
    return apiError(
      404,
      "CASE_NOT_FOUND",
      error instanceof Error ? error.message : "Case not found"
    );
  }
}
