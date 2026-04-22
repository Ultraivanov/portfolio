import { type CaseDraftLike } from "@/lib/case-draft-quality";
import { buildEvidenceBySection } from "@/lib/case-section-evidence";

function createDraft(): CaseDraftLike {
  return {
    title: "Agent Workbench",
    subtitle: "Evidence-backed UX case",
    facts: [{ label: "role", value: "Product Designer" }],
    sections: [
      {
        title: "Context",
        blocks: [{ discriminant: "paragraph", value: { text: "Context text" } }],
      },
      {
        title: "Problem",
        blocks: [{ discriminant: "paragraph", value: { text: "Problem text" } }],
      },
      {
        title: "Constraints",
        blocks: [{ discriminant: "paragraph", value: { text: "Constraints text" } }],
      },
      {
        title: "Role",
        blocks: [{ discriminant: "paragraph", value: { text: "Role text" } }],
      },
      {
        title: "Approach",
        blocks: [{ discriminant: "paragraph", value: { text: "Approach text" } }],
      },
      {
        title: "Solution",
        blocks: [{ discriminant: "paragraph", value: { text: "Solution text" } }],
      },
      {
        title: "Outcome",
        blocks: [{ discriminant: "paragraph", value: { text: "Outcome text" } }],
      },
    ],
  };
}

describe("buildEvidenceBySection", () => {
  it("maps repository evidence to required sections with deterministic coverage", () => {
    const report = buildEvidenceBySection(createDraft(), {
      evidenceLinks: [
        "https://github.com/acme/agent-workbench",
        "https://github.com/acme/agent-workbench/pull/10",
        "https://github.com/acme/agent-workbench/issues/22",
        "https://acme.app/workbench",
      ],
    });

    expect(report.totalSections).toBe(7);
    expect(report.coveredSections).toBeGreaterThanOrEqual(5);

    const problem = report.sections.find((item) => item.section === "Problem");
    const approach = report.sections.find((item) => item.section === "Approach");
    const context = report.sections.find((item) => item.section === "Context");

    expect(problem?.links.some((link) => link.includes("/issues/22"))).toBe(true);
    expect(approach?.links.some((link) => link.includes("/pull/10"))).toBe(true);
    expect(context?.links.some((link) => link === "https://github.com/acme/agent-workbench")).toBe(
      true
    );
  });

  it("prioritizes direct section links from draft blocks", () => {
    const draft = createDraft();
    const solution = draft.sections.find((section) => section.title === "Solution");
    if (!solution) {
      throw new Error("Expected Solution section in test setup.");
    }

    solution.blocks = [
      {
        discriminant: "link",
        value: {
          label: "Design doc",
          href: "https://github.com/acme/agent-workbench/blob/main/docs/solution.md",
        },
      },
    ];

    const report = buildEvidenceBySection(draft, {
      evidenceLinks: ["https://github.com/acme/agent-workbench/pull/10"],
    });

    const solutionCoverage = report.sections.find((item) => item.section === "Solution");
    expect(solutionCoverage?.links[0]).toBe(
      "https://github.com/acme/agent-workbench/blob/main/docs/solution.md"
    );
  });

  it("returns missing coverage when no evidence links are available", () => {
    const report = buildEvidenceBySection(createDraft(), { evidenceLinks: [] });

    expect(report.coveredSections).toBe(0);
    expect(report.sections.every((item) => item.coverage === "missing")).toBe(true);
    expect(report.unassignedLinks).toHaveLength(0);
  });
});
