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

export type GitHubSignals = {
  repo: GitHubRepoInfo;
  readme: string;
  mergedPulls: GitHubPullRequest[];
  closedIssues: GitHubIssue[];
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

  return {
    repo: repoJson,
    readme,
    mergedPulls,
    closedIssues,
  };
}

export function buildCaseDraftFromSignals(
  signals: GitHubSignals,
  focus: IntakeFocus = "ux-driven"
): { draft: CaseDraft; evidence: string[] } {
  const { repo, readme, mergedPulls, closedIssues } = signals;
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

  const textPool = [
    readme,
    ...mergedPulls.flatMap((pr) => [pr.title, pr.body ?? ""]),
    ...closedIssues.flatMap((issue) => [issue.title, issue.body ?? ""]),
  ];

  const problemItems = extractSignalItems(textPool, PROBLEM_KEYWORDS, 4);
  const constraintItems = extractSignalItems(textPool, CONSTRAINT_KEYWORDS, 4);
  const solutionItems = extractSignalItems(textPool, SOLUTION_KEYWORDS_BY_FOCUS[focus], 5);

  const subtitle = focusSubtitle(focus);
  const contextIntro = firstMeaningfulParagraph(readme) ||
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
    {
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
    },
  ];

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
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("![")) // remove headings/images
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

