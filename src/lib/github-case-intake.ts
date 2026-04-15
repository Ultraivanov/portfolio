import { fetchGitHubWithRetry } from "@/lib/github-api";

export type CaseBlock =
  | { discriminant: "paragraph"; value: { text: string } }
  | { discriminant: "list"; value: { items: string[] } }
  | { discriminant: "link"; value: { label: string; href: string } }
  | { discriminant: "media"; value: { src: string; alt: string; caption?: string } };

export type CaseDraft = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: Array<{ label: string; value: string | string[]; href?: string }>;
  sections: Array<{ title: string; blocks: CaseBlock[] }>;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
};

export type IntakeFocus = "behavioral-model" | "ux-driven" | "agentic-flow";

export type GitHubRepoRef = {
  owner: string;
  repo: string;
};

export type RuntimeScreenshot = {
  route: string;
  pageUrl: string;
  screenshotUrl: string;
  status: "planned";
};

type GitHubRepoInfo = {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  language: string | null;
};

type GitHubPullRequest = {
  title: string;
  body: string | null;
  html_url: string;
  merged_at: string | null;
};

type GitHubIssue = {
  title: string;
  body: string | null;
  html_url: string;
  pull_request?: unknown;
};

type GitHubBranch = {
  commit?: {
    sha?: string;
  };
};

type GitHubTreeEntry = {
  path?: string;
  type?: string;
};

type GitHubTreeResponse = {
  tree?: GitHubTreeEntry[];
};

export type GitHubSignals = {
  repo: GitHubRepoInfo;
  readme: string;
  mergedPulls: GitHubPullRequest[];
  closedIssues: GitHubIssue[];
  routeCandidates: string[];
  runtimeScreenshots: RuntimeScreenshot[];
};

export function parseGitHubRepoUrl(value: string): GitHubRepoRef | null {
  const raw = value.trim();
  if (!raw) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  if (parsed.hostname !== "github.com") {
    return null;
  }

  const parts = parsed.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const owner = parts[0];
  const repo = parts[1]?.replace(/\.git$/i, "");

  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

export async function fetchGitHubSignals(params: {
  owner: string;
  repo: string;
  token?: string;
  runtimeBaseUrl?: string;
  screenshotLimit?: number;
  screenshotTemplate?: string;
}): Promise<GitHubSignals> {
  const { owner, repo, token } = params;
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  const repoResponse = await fetchGitHubWithRetry(`${base}`, {
    headers: buildHeaders(token),
  });

  if (!repoResponse.ok) {
    throw new Error(await readGitHubError(repoResponse, "Failed to load repository"));
  }

  const repoJson = (await repoResponse.json()) as GitHubRepoInfo;

  const readmeResponse = await fetchGitHubWithRetry(`${base}/readme`, {
    headers: {
      ...buildHeaders(token),
      Accept: "application/vnd.github.raw+json",
    },
  });

  const readme =
    readmeResponse.ok && readmeResponse.status !== 204
      ? await readmeResponse.text()
      : "";

  const pullsResponse = await fetchGitHubWithRetry(
    `${base}/pulls?state=closed&sort=updated&direction=desc&per_page=30`,
    {
      headers: buildHeaders(token),
    }
  );
  const pullsJson = pullsResponse.ok
    ? ((await pullsResponse.json()) as GitHubPullRequest[])
    : [];
  const mergedPulls = pullsJson.filter((pr) => Boolean(pr.merged_at)).slice(0, 12);

  const issuesResponse = await fetchGitHubWithRetry(
    `${base}/issues?state=closed&sort=updated&direction=desc&per_page=30`,
    {
      headers: buildHeaders(token),
    }
  );
  const issuesJson = issuesResponse.ok
    ? ((await issuesResponse.json()) as GitHubIssue[])
    : [];
  const closedIssues = issuesJson
    .filter((issue) => !issue.pull_request)
    .slice(0, 12);

  const routeCandidates = await fetchRepoRouteCandidates({
    owner,
    repo,
    defaultBranch: repoJson.default_branch,
    token,
  });

  const runtimeScreenshots = buildRuntimeScreenshots({
    runtimeBaseUrl: params.runtimeBaseUrl,
    routes: routeCandidates,
    limit: params.screenshotLimit ?? 6,
    screenshotTemplate:
      params.screenshotTemplate ||
      process.env.GITHUB_INTAKE_SCREENSHOT_TEMPLATE ||
      "https://image.thum.io/get/png/noanimate/width/1600/crop/900/{url}",
  });

  return {
    repo: repoJson,
    readme,
    mergedPulls,
    closedIssues,
    routeCandidates,
    runtimeScreenshots,
  };
}

export function buildCaseDraftFromSignals(
  signals: GitHubSignals,
  focus: IntakeFocus = "ux-driven"
): { draft: CaseDraft; evidence: string[] } {
  const {
    repo,
    readme,
    mergedPulls,
    closedIssues,
    routeCandidates,
    runtimeScreenshots,
  } = signals;
  const repoSlug = slugify(repo.name || repo.full_name.split("/").pop() || "case");
  const title = toCaseTitle(repo.name || repoSlug);
  const repoUrl = repo.html_url;

  const evidenceLinks: string[] = [repoUrl];
  for (const pr of mergedPulls.slice(0, 5)) {
    evidenceLinks.push(pr.html_url);
  }
  for (const issue of closedIssues.slice(0, 5)) {
    evidenceLinks.push(issue.html_url);
  }
  for (const screenshot of runtimeScreenshots) {
    evidenceLinks.push(screenshot.pageUrl);
    evidenceLinks.push(screenshot.screenshotUrl);
  }

  const textPool = [
    readme,
    ...mergedPulls.flatMap((pr) => [pr.title, pr.body ?? ""]),
    ...closedIssues.flatMap((issue) => [issue.title, issue.body ?? ""]),
  ];

  const problemItems = extractSignalItems(textPool, PROBLEM_KEYWORDS, 4);
  const constraintItems = extractSignalItems(textPool, CONSTRAINT_KEYWORDS, 4);
  const solutionItems = extractSignalItems(textPool, SOLUTION_KEYWORDS_BY_FOCUS[focus], 5);

  const subtitle = focusSubtitle(focus);
  const contextIntro =
    firstMeaningfulParagraph(readme) ||
    repo.description ||
    "Repository artifacts indicate an actively evolving product system with design-impacting decisions.";

  const sections: Array<{ title: string; blocks: CaseBlock[] }> = [
    {
      title: "Context",
      blocks: [
        {
          discriminant: "paragraph",
          value: {
            text: `Source analyzed: ${repo.full_name}.\n\n${contextIntro}`,
          },
        },
      ],
    },
    {
      title: "Problem",
      blocks: [
        {
          discriminant: "paragraph",
          value: {
            text:
              "Based on repository issues and pull requests, the product had friction points that affected clarity, flow quality, or decision confidence.",
          },
        },
        {
          discriminant: "list",
          value: {
            items:
              problemItems.length > 0
                ? problemItems
                : [
                    "Multiple user journeys and states needed better consistency.",
                    "Design intent was distributed across issues and PR discussions.",
                  ],
          },
        },
      ],
    },
    {
      title: "Constraints",
      blocks: [
        {
          discriminant: "list",
          value: {
            items:
              constraintItems.length > 0
                ? constraintItems
                : [
                    "Work had to fit existing architecture and release rhythm.",
                    "Changes needed to remain compatible with production UI patterns.",
                  ],
          },
        },
      ],
    },
    {
      title: "Role",
      blocks: [
        {
          discriminant: "paragraph",
          value: {
            text:
              "Design interpretation and system framing based on repository artifacts (README, docs, issues, and merged pull requests). Final narrative should be reviewed and refined by the case owner.",
          },
        },
      ],
    },
    {
      title: "Approach",
      blocks: [
        {
          discriminant: "list",
          value: {
            items: [
              "Mapped user-facing changes from merged pull requests.",
              "Grouped decisions by flow, interaction behavior, and system constraints.",
              `Framed the case through the selected angle: ${focus}.`,
              routeCandidates.length
                ? `Discovered ${routeCandidates.length} runtime route candidates from app router files.`
                : "No static app routes were automatically discovered in repository tree.",
            ],
          },
        },
      ],
    },
    {
      title: "Solution",
      blocks: [
        {
          discriminant: "list",
          value: {
            items:
              solutionItems.length > 0
                ? solutionItems
                : [
                    "Introduced clearer interaction logic across critical flows.",
                    "Aligned implementation details with consistent product behavior.",
                  ],
          },
        },
      ],
    },
  ];

  if (runtimeScreenshots.length > 0) {
    sections.push({
      title: "Visual Artifacts",
      blocks: runtimeScreenshots.flatMap((shot, index) => {
        const label = `Runtime route ${index + 1}: ${shot.route}`;
        return [
          {
            discriminant: "media",
            value: {
              src: shot.screenshotUrl,
              alt: `${title} runtime screenshot ${shot.route}`,
              caption: `${label} (planned capture)`,
            },
          } as CaseBlock,
          {
            discriminant: "link",
            value: {
              label: `Open route ${shot.route}`,
              href: shot.pageUrl,
            },
          } as CaseBlock,
        ];
      }),
    });
  }

  sections.push({
    title: "Outcome",
    blocks: [
      {
        discriminant: "list",
        value: {
          items: [
            `Repository stars: ${repo.stargazers_count}`,
            `Repository forks: ${repo.forks_count}`,
            `Open issues at analysis time: ${repo.open_issues_count}`,
            `${mergedPulls.length} merged PRs were used as implementation evidence.`,
          ],
        },
      },
      {
        discriminant: "link",
        value: {
          label: "Primary source repository",
          href: repoUrl,
        },
      },
    ],
  });

  const draft: CaseDraft = {
    slug: repoSlug,
    title,
    subtitle,
    coverSrc: "/cases/example/cover.png",
    coverAlt: `${title} case cover`,
    facts: [
      {
        label: "domain",
        value: "AI-enabled digital product",
      },
      {
        label: "role",
        value: "Product/UX design analysis from repository evidence",
      },
      {
        label: "repository",
        value: repo.full_name,
        href: repoUrl,
      },
      {
        label: "scope",
        value: [
          "README/docs interpretation",
          `${mergedPulls.length} merged PRs reviewed`,
          `${closedIssues.length} closed issues reviewed`,
          `${routeCandidates.length} app routes discovered`,
        ],
      },
    ],
    sections,
    seo: {
      metaTitle: `${title} | Case Study`,
      metaDescription: subtitle,
    },
  };

  return {
    draft,
    evidence: Array.from(new Set(evidenceLinks)),
  };
}

export function extractNextAppRoutesFromPaths(paths: string[]): string[] {
  const routes = new Set<string>();

  for (const inputPath of paths) {
    const path = inputPath.replace(/\\/g, "/");
    let relative: string | null = null;

    if (path.startsWith("src/app/")) {
      relative = path.slice("src/app/".length);
    } else if (path.startsWith("app/")) {
      relative = path.slice("app/".length);
    }

    if (!relative) {
      continue;
    }

    if (!/(^|\/)page\.(t|j)sx?$/.test(relative)) {
      continue;
    }

    if (relative.startsWith("api/") || relative.includes("/api/")) {
      continue;
    }

    const routePart = relative.replace(/(^|\/)page\.(t|j)sx?$/, "");
    const rawSegments = routePart.split("/").filter(Boolean);

    if (rawSegments.some((segment) => segment.startsWith("[") || segment.startsWith("@"))) {
      continue;
    }

    const segments = rawSegments.filter(
      (segment) => !(segment.startsWith("(") && segment.endsWith(")"))
    );

    const route = segments.length > 0 ? `/${segments.join("/")}` : "/";
    routes.add(route);
  }

  const priority = ["/", "/work", "/contact", "/pricing", "/docs", "/dashboard"];

  return Array.from(routes).sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);

    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;

    return a.localeCompare(b);
  });
}

function buildRuntimeScreenshots(params: {
  runtimeBaseUrl?: string;
  routes: string[];
  limit: number;
  screenshotTemplate: string;
}): RuntimeScreenshot[] {
  const base = (params.runtimeBaseUrl || "").trim();
  if (!base) {
    return [];
  }

  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    return [];
  }

  return params.routes.slice(0, Math.max(1, params.limit)).map((route) => {
    const pageUrl = new URL(route, withTrailingSlash(parsed.toString())).toString();
    const screenshotUrl = params.screenshotTemplate.replace(
      /\{url\}/g,
      encodeURIComponent(pageUrl)
    );

    return {
      route,
      pageUrl,
      screenshotUrl,
      status: "planned",
    };
  });
}

async function fetchRepoRouteCandidates(params: {
  owner: string;
  repo: string;
  defaultBranch: string;
  token?: string;
}): Promise<string[]> {
  const { owner, repo, defaultBranch, token } = params;
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  const branchResponse = await fetchGitHubWithRetry(`${base}/branches/${defaultBranch}`, {
    headers: buildHeaders(token),
  });

  if (!branchResponse.ok) {
    return [];
  }

  const branchJson = (await branchResponse.json()) as GitHubBranch;
  const commitSha = branchJson.commit?.sha;
  if (!commitSha) {
    return [];
  }

  const treeResponse = await fetchGitHubWithRetry(
    `${base}/git/trees/${commitSha}?recursive=1`,
    {
      headers: buildHeaders(token),
    }
  );

  if (!treeResponse.ok) {
    return [];
  }

  const treeJson = (await treeResponse.json()) as GitHubTreeResponse;
  const filePaths = (treeJson.tree || [])
    .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
    .map((entry) => entry.path as string);

  return extractNextAppRoutesFromPaths(filePaths).slice(0, 12);
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function readGitHubError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message || fallback;
  } catch {
    return fallback;
  }
}

function firstMeaningfulParagraph(markdown: string): string {
  const cleaned = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!["))
    .join("\n");

  const paragraph = cleaned.split(/\n{2,}/).find((chunk) => chunk.trim().length > 60);
  if (!paragraph) return "";
  return paragraph.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").trim();
}

function extractSignalItems(
  texts: string[],
  keywords: readonly string[],
  limit: number
): string[] {
  const rows = texts
    .flatMap((text) => splitToCandidateLines(text))
    .map((line) => normalizeSentence(line))
    .filter((line) => line.length >= 28 && line.length <= 180)
    .filter((line) => containsKeyword(line, keywords));

  return Array.from(new Set(rows)).slice(0, limit);
}

function splitToCandidateLines(text: string): string[] {
  return text
    .split(/\n|\. |; |\u2022|- /g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeSentence(value: string): string {
  return value
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^[-*]\s*/, "")
    .trim();
}

function containsKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((word) => lower.includes(word));
}

function focusSubtitle(focus: IntakeFocus): string {
  if (focus === "behavioral-model") {
    return "Behavioral model case draft generated from repository artifacts";
  }
  if (focus === "agentic-flow") {
    return "Agentic flow case draft generated from repository artifacts";
  }
  return "UX-driven case draft generated from repository artifacts";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "generated-case";
}

function toCaseTitle(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

const PROBLEM_KEYWORDS = [
  "problem",
  "issue",
  "bug",
  "friction",
  "confus",
  "broken",
  "error",
  "fail",
] as const;

const CONSTRAINT_KEYWORDS = [
  "constraint",
  "limit",
  "tradeoff",
  "compatib",
  "legacy",
  "performance",
  "security",
  "policy",
] as const;

const SOLUTION_KEYWORDS_BY_FOCUS: Record<IntakeFocus, readonly string[]> = {
  "ux-driven": [
    "ux",
    "user",
    "flow",
    "navigation",
    "onboarding",
    "interaction",
    "accessibility",
    "layout",
  ],
  "behavioral-model": [
    "state",
    "decision",
    "validation",
    "eligibility",
    "rule",
    "policy",
    "logic",
    "constraint",
  ],
  "agentic-flow": [
    "agent",
    "ai",
    "llm",
    "tool",
    "workflow",
    "orchestrat",
    "prompt",
    "assistant",
  ],
};
