import {
  analyzeCaseDraftQuality,
  buildDraftIntakeConfidence,
  REQUIRED_CASE_SECTIONS,
  type CaseDraftLike,
} from "@/lib/case-draft-quality";

function createBaseDraft(): CaseDraftLike {
  return {
    title: "Test Case",
    subtitle: "Test subtitle",
    facts: [{ label: "role", value: "Product Designer" }],
    sections: [
      {
        title: "Context",
        blocks: [
          {
            discriminant: "paragraph",
            value: {
              text: "This product serves distributed teams and had measurable UX friction in key flows.",
            },
          },
        ],
      },
      {
        title: "Problem",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "Users were dropping off in onboarding due to unclear step transitions." },
          },
        ],
      },
      {
        title: "Constraints",
        blocks: [
          {
            discriminant: "list",
            value: { items: ["Legacy backend contracts", "Two-week release cadence"] },
          },
        ],
      },
      {
        title: "Role",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "I led product discovery, UX strategy, and alignment with engineering." },
          },
        ],
      },
      {
        title: "Approach",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "We combined repo telemetry, interviews, and hypothesis-driven iterations." },
          },
        ],
      },
      {
        title: "Solution",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "Introduced progressive disclosure and clearer system feedback states." },
          },
        ],
      },
      {
        title: "Outcome",
        blocks: [
          {
            discriminant: "paragraph",
            value: { text: "Activation improved by 17% and support tickets dropped by 22% in 4 weeks." },
          },
        ],
      },
    ],
  };
}

describe("analyzeCaseDraftQuality", () => {
  it("passes required sections and avoids critical issues for a complete draft", () => {
    const report = analyzeCaseDraftQuality(createBaseDraft(), {
      evidenceLinks: ["https://github.com/example/repo/pull/1"],
    });

    expect(report.summary.critical).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(
      report.checklist.find((item) => item.id === "evidence-links")?.passed
    ).toBe(true);
  });

  it("flags missing required sections as critical", () => {
    const draft = createBaseDraft();
    draft.sections = draft.sections.filter((section) => section.title !== "Outcome");

    const report = analyzeCaseDraftQuality(draft);

    expect(report.summary.critical).toBeGreaterThan(0);
    expect(report.issues.some((issue) => issue.id === "missing-outcome")).toBe(true);
    expect(
      report.checklist
        .filter((item) => item.id.startsWith("required-section-"))
        .map((item) => item.label)
    ).toHaveLength(REQUIRED_CASE_SECTIONS.length);
  });

  it("flags metric claims without evidence links", () => {
    const report = analyzeCaseDraftQuality(createBaseDraft(), {
      evidenceLinks: [],
    });

    expect(report.issues.some((issue) => issue.id === "metric-without-evidence")).toBe(true);
    expect(report.issues.some((issue) => issue.id === "missing-evidence-links")).toBe(true);
  });

  it("flags weak constraints when constraints are generic", () => {
    const draft = createBaseDraft();
    const constraints = draft.sections.find((section) => section.title === "Constraints");
    if (!constraints) {
      throw new Error("Expected constraints section in test setup.");
    }
    constraints.blocks = [
      {
        discriminant: "paragraph",
        value: { text: "There were some constraints." },
      },
    ];

    const report = analyzeCaseDraftQuality(draft, {
      evidenceLinks: ["https://github.com/example/repo/issues/2"],
    });

    expect(report.issues.some((issue) => issue.id === "weak-constraints")).toBe(true);
    expect(
      report.checklist.find((item) => item.id === "constraints-signal")?.passed
    ).toBe(false);
  });
});

describe("buildDraftIntakeConfidence", () => {
  it("returns section-level confidence for all required sections", () => {
    const confidence = buildDraftIntakeConfidence(createBaseDraft(), {
      evidenceLinks: ["https://github.com/example/repo/pull/1"],
    });

    expect(confidence.sections).toHaveLength(REQUIRED_CASE_SECTIONS.length);
    expect(confidence.overallScore).toBeGreaterThanOrEqual(70);
    expect(confidence.overallLevel).toBe("strong");
  });

  it("marks missing sections as missing level", () => {
    const draft = createBaseDraft();
    draft.sections = draft.sections.filter((section) => section.title !== "Outcome");

    const confidence = buildDraftIntakeConfidence(draft, {
      evidenceLinks: ["https://github.com/example/repo/issues/1"],
    });

    const outcome = confidence.sections.find((section) => section.section === "Outcome");
    expect(outcome?.level).toBe("missing");
    expect(outcome?.score).toBe(0);
    expect(confidence.summary.critical).toBeGreaterThan(0);
  });
});
