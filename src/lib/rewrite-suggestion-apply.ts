import type { DraftRewriteSuggestion } from "@/lib/case-draft-quality";

export type RewriteApplicableBlock = {
  discriminant: "paragraph" | "list" | "link" | "media";
  value: {
    text?: string;
    items?: string[];
    label?: string;
    href?: string;
    src?: string;
    alt?: string;
    caption?: string;
  };
};

export type RewriteApplicableSection = {
  title: string;
  blocks: RewriteApplicableBlock[];
};

export type RewriteApplyResult = {
  sections: RewriteApplicableSection[];
  appliedSectionTitle: string;
  createdSection: boolean;
};

export type RewriteApplyManyResult = {
  sections: RewriteApplicableSection[];
  applied: number;
  createdSections: number;
};

export function applyRewriteSuggestionToSections(
  sections: RewriteApplicableSection[],
  suggestion: DraftRewriteSuggestion
): RewriteApplyResult {
  const targetSectionTitle = suggestion.section.trim() || "Additional Notes";
  const targetSectionKey = normalizeSectionTitle(targetSectionTitle);
  const nextSections = sections.map((section) => ({
    ...section,
    blocks: [...section.blocks],
  }));
  const sectionIndex = nextSections.findIndex(
    (section) => normalizeSectionTitle(section.title) === targetSectionKey
  );
  let appliedSectionTitle = targetSectionTitle;
  let createdSection = false;

  if (sectionIndex >= 0) {
    appliedSectionTitle = nextSections[sectionIndex].title || targetSectionTitle;
    const blocks = [...nextSections[sectionIndex].blocks];
    const paragraphIndex = blocks.findIndex((block) => block.discriminant === "paragraph");

    if (paragraphIndex >= 0) {
      const paragraphBlock = blocks[paragraphIndex];
      blocks[paragraphIndex] = {
        ...paragraphBlock,
        value: {
          ...paragraphBlock.value,
          text: suggestion.suggestedRewrite,
        },
      };
    } else {
      blocks.unshift({
        discriminant: "paragraph",
        value: { text: suggestion.suggestedRewrite },
      });
    }

    nextSections[sectionIndex] = {
      ...nextSections[sectionIndex],
      blocks,
    };
  } else {
    nextSections.push({
      title: targetSectionTitle,
      blocks: [
        {
          discriminant: "paragraph",
          value: { text: suggestion.suggestedRewrite },
        },
      ],
    });
    createdSection = true;
  }

  return {
    sections: nextSections,
    appliedSectionTitle,
    createdSection,
  };
}

export function applyRewriteSuggestionsToSections(
  sections: RewriteApplicableSection[],
  suggestions: DraftRewriteSuggestion[]
): RewriteApplyManyResult {
  let nextSections = sections;
  let createdSections = 0;

  for (const suggestion of suggestions) {
    const result = applyRewriteSuggestionToSections(nextSections, suggestion);
    nextSections = result.sections;
    if (result.createdSection) {
      createdSections += 1;
    }
  }

  return {
    sections: nextSections,
    applied: suggestions.length,
    createdSections,
  };
}

function normalizeSectionTitle(value: string): string {
  return value.trim().toLowerCase();
}
