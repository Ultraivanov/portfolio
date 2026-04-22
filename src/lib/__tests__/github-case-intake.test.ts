import {
  buildCaseDraftFromSignals,
  extractNextAppRoutesFromPaths,
  parseGitHubRepoUrl,
  type GitHubSignals,
} from "@/lib/github-case-intake";

describe("parseGitHubRepoUrl", () => {
  it("parses standard repository URLs", () => {
    expect(parseGitHubRepoUrl("https://github.com/vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("parses URLs with extra path and strips .git suffix", () => {
    expect(
      parseGitHubRepoUrl("https://github.com/Ultraivanov/portfolio.git/issues/12")
    ).toEqual({
      owner: "Ultraivanov",
      repo: "portfolio",
    });
  });

  it("returns null for unsupported hosts", () => {
    expect(parseGitHubRepoUrl("https://gitlab.com/group/repo")).toBeNull();
  });
});

describe("buildCaseDraftFromSignals", () => {
  const signals: GitHubSignals = {
    repo: {
      name: "agent-workbench",
      full_name: "acme/agent-workbench",
      description: "Orchestrated agent workflows for support operations",
      html_url: "https://github.com/acme/agent-workbench",
      stargazers_count: 42,
      forks_count: 7,
      open_issues_count: 3,
      default_branch: "main",
      language: "TypeScript",
    },
    readme:
      "Agent Workbench\n\nThis system improves user flow and reduces onboarding friction for support teams.",
    mergedPulls: [
      {
        title: "Improve onboarding flow and validation states",
        body: "Added clearer UX for empty states and error handling.",
        html_url: "https://github.com/acme/agent-workbench/pull/101",
        merged_at: "2026-04-10T00:00:00Z",
      },
    ],
    closedIssues: [
      {
        title: "Confusing navigation in onboarding",
        body: "Users fail to complete setup.",
        html_url: "https://github.com/acme/agent-workbench/issues/89",
      },
    ],
    routeCandidates: ["/", "/work", "/contact"],
    runtimeScreenshots: [],
  };

  it("produces a valid draft with expected structural sections", () => {
    const { draft, evidence } = buildCaseDraftFromSignals(signals, "ux-driven");

    expect(draft.slug).toBe("agent-workbench");
    expect(draft.title).toBe("Agent Workbench");
    expect(draft.sections.map((section) => section.title)).toEqual([
      "Context",
      "Problem",
      "Constraints",
      "Role",
      "Approach",
      "Solution",
      "Outcome",
    ]);
    expect(draft.facts.length).toBeGreaterThan(0);
    expect(evidence).toContain("https://github.com/acme/agent-workbench");
  });

  it("switches subtitle based on selected focus", () => {
    const { draft } = buildCaseDraftFromSignals(signals, "agentic-flow");
    expect(draft.subtitle.toLowerCase()).toContain("agentic flow");
  });

  it("adds visual artifacts section when runtime screenshots are provided", () => {
    const withScreenshots: GitHubSignals = {
      ...signals,
      runtimeScreenshots: [
        {
          route: "/",
          pageUrl: "https://example.com/",
          screenshotUrl:
            "https://image.thum.io/get/png/noanimate/width/1600/crop/900/https%3A%2F%2Fexample.com%2F",
          status: "planned",
        },
      ],
    };

    const { draft } = buildCaseDraftFromSignals(withScreenshots, "ux-driven");
    expect(draft.sections.some((section) => section.title === "Visual Artifacts")).toBe(true);
  });
});

describe("extractNextAppRoutesFromPaths", () => {
  it("extracts static routes from Next app-router paths", () => {
    const routes = extractNextAppRoutesFromPaths([
      "src/app/page.tsx",
      "src/app/work/page.tsx",
      "src/app/work/[slug]/page.tsx",
      "src/app/(marketing)/pricing/page.tsx",
      "src/app/api/intake/github/route.ts",
      "app/contact/page.jsx",
    ]);

    expect(routes).toEqual(["/", "/work", "/contact", "/pricing"]);
  });
});
