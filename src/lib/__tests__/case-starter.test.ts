import { buildStarterVariants, type StarterDraftLike } from "@/lib/case-starter";

function createDraft(): StarterDraftLike {
  return {
    title: "Relationship Simulator",
    subtitle: "Designing a deterministic AI onboarding experience.",
    sections: [
      {
        title: "Approach",
        blocks: [
          {
            discriminant: "paragraph",
            value: {
              text: "Mapped key failure modes from support issues and merged PR decisions.",
            },
          },
        ],
      },
      {
        title: "Outcome",
        blocks: [
          {
            discriminant: "paragraph",
            value: {
              text: "Activation improved by 17% and first-session churn dropped in two releases.",
            },
          },
        ],
      },
    ],
  };
}

describe("buildStarterVariants", () => {
  it("returns deterministic starter variants with baseline first", () => {
    const first = buildStarterVariants({
      draft: createDraft(),
      repoFullName: "Ultraivanov/portfolio",
      focus: "ux-driven",
    });
    const second = buildStarterVariants({
      draft: createDraft(),
      repoFullName: "Ultraivanov/portfolio",
      focus: "ux-driven",
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(first[0].id).toBe("baseline");
    expect(first[0].title).toBe("Relationship Simulator");
    expect(first[0].subtitle).toBe("Designing a deterministic AI onboarding experience.");
  });

  it("builds safe fallback title/subtitle when draft is sparse", () => {
    const variants = buildStarterVariants({
      draft: { title: "", subtitle: "", sections: [] },
      repoFullName: "Ultraivanov/my-product-case",
      focus: "agentic-flow",
    });

    expect(variants.length).toBeGreaterThanOrEqual(1);
    expect(variants[0].title).toBe("My Product Case");
    expect(variants[0].subtitle.length).toBeGreaterThan(0);
    expect(variants.every((variant) => variant.title.trim().length > 0)).toBe(true);
    expect(variants.every((variant) => variant.subtitle.trim().length > 0)).toBe(true);
  });

  it("respects explicit limit", () => {
    const variants = buildStarterVariants({
      draft: createDraft(),
      repoFullName: "Ultraivanov/portfolio",
      focus: "behavioral-model",
      limit: 2,
    });

    expect(variants).toHaveLength(2);
  });
});
