import type { DraftRewriteSuggestion } from "@/lib/case-draft-quality";
import {
  applyRewriteSuggestionToSections,
  applyRewriteSuggestionsToSections,
  type RewriteApplicableSection,
} from "@/lib/rewrite-suggestion-apply";

function createSuggestion(
  id: string,
  section: string,
  suggestedRewrite: string
): DraftRewriteSuggestion {
  return {
    id,
    issueId: `${id}-issue`,
    section,
    priority: "warning",
    confidence: 80,
    rationale: "Test rationale",
    before: "Before text",
    suggestedRewrite,
  };
}

describe("applyRewriteSuggestionToSections", () => {
  it("updates the first paragraph block in an existing section", () => {
    const sections: RewriteApplicableSection[] = [
      {
        title: "Outcome",
        blocks: [
          { discriminant: "paragraph", value: { text: "Old outcome text" } },
          { discriminant: "list", value: { items: ["A", "B"] } },
        ],
      },
    ];

    const result = applyRewriteSuggestionToSections(
      sections,
      createSuggestion("s1", "Outcome", "New outcome rewrite")
    );

    expect(result.createdSection).toBe(false);
    expect(result.appliedSectionTitle).toBe("Outcome");
    expect(result.sections[0].blocks[0].discriminant).toBe("paragraph");
    expect(result.sections[0].blocks[0].value.text).toBe("New outcome rewrite");
  });

  it("prepends paragraph block when target section has no paragraph blocks", () => {
    const sections: RewriteApplicableSection[] = [
      {
        title: "Constraints",
        blocks: [{ discriminant: "list", value: { items: ["Constraint A"] } }],
      },
    ];

    const result = applyRewriteSuggestionToSections(
      sections,
      createSuggestion("s2", "Constraints", "Constraints rewrite paragraph")
    );

    expect(result.createdSection).toBe(false);
    expect(result.sections[0].blocks[0].discriminant).toBe("paragraph");
    expect(result.sections[0].blocks[0].value.text).toBe("Constraints rewrite paragraph");
  });

  it("creates a new section when target section is missing", () => {
    const sections: RewriteApplicableSection[] = [
      { title: "Context", blocks: [{ discriminant: "paragraph", value: { text: "Context" } }] },
    ];

    const result = applyRewriteSuggestionToSections(
      sections,
      createSuggestion("s3", "Outcome", "Outcome rewrite")
    );

    expect(result.createdSection).toBe(true);
    expect(result.appliedSectionTitle).toBe("Outcome");
    expect(result.sections).toHaveLength(2);
    expect(result.sections[1].title).toBe("Outcome");
    expect(result.sections[1].blocks[0].value.text).toBe("Outcome rewrite");
  });
});

describe("applyRewriteSuggestionsToSections", () => {
  it("applies suggestions in order and reports created section count", () => {
    const sections: RewriteApplicableSection[] = [
      {
        title: "Context",
        blocks: [{ discriminant: "paragraph", value: { text: "Old context" } }],
      },
      {
        title: "Constraints",
        blocks: [{ discriminant: "list", value: { items: ["A"] } }],
      },
    ];

    const suggestions: DraftRewriteSuggestion[] = [
      createSuggestion("s4", "Context", "New context rewrite"),
      createSuggestion("s5", "Outcome", "Outcome rewrite"),
      createSuggestion("s6", "Constraints", "Constraints rewrite"),
    ];

    const result = applyRewriteSuggestionsToSections(sections, suggestions);

    expect(result.applied).toBe(3);
    expect(result.createdSections).toBe(1);
    expect(result.sections.map((section) => section.title)).toEqual([
      "Context",
      "Constraints",
      "Outcome",
    ]);
    expect(result.sections[0].blocks[0].value.text).toBe("New context rewrite");
    expect(result.sections[1].blocks[0].value.text).toBe("Constraints rewrite");
    expect(result.sections[2].blocks[0].value.text).toBe("Outcome rewrite");
  });
});
