type FactValue = string | string[];

type CaseBlock =
  | { discriminant: "paragraph"; value: { text?: string } }
  | { discriminant: "list"; value: { items?: string[] } }
  | { discriminant: "link"; value: { label?: string; href?: string } }
  | { discriminant: "media"; value: { src?: string; alt?: string; caption?: string } };

type CaseSection = {
  title: string;
  blocks: CaseBlock[];
};

export type CaseDraftLike = {
  title: string;
  subtitle: string;
  facts: Array<{ label: string; value: FactValue; href?: string }>;
  sections: CaseSection[];
};

export const REQUIRED_CASE_SECTIONS = [
  "Context",
  "Problem",
  "Constraints",
  "Role",
  "Approach",
  "Solution",
  "Outcome",
] as const;

export type QualitySeverity = "critical" | "warning" | "info";

export type DraftQualityIssue = {
  id: string;
  severity: QualitySeverity;
  message: string;
  section?: string;
};

export type DraftQualityChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
  details?: string;
};

export type DraftQualityReport = {
  score: number;
  checklist: DraftQualityChecklistItem[];
  issues: DraftQualityIssue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
};

export function analyzeCaseDraftQuality(
  draft: CaseDraftLike,
  options?: { evidenceLinks?: string[] }
): DraftQualityReport {
  const sectionsByTitle = new Map(
    draft.sections.map((section) => [normalizeTitle(section.title), section])
  );
  const issues: DraftQualityIssue[] = [];
  const checklist: DraftQualityChecklistItem[] = [];

  for (const requiredSection of REQUIRED_CASE_SECTIONS) {
    const section = sectionsByTitle.get(normalizeTitle(requiredSection));
    const hasSection = Boolean(section);
    checklist.push({
      id: `required-section-${requiredSection.toLowerCase()}`,
      label: `Section "${requiredSection}" present`,
      passed: hasSection,
      details: hasSection ? undefined : `Missing required section "${requiredSection}"`,
    });

    if (!section) {
      issues.push({
        id: `missing-${requiredSection.toLowerCase()}`,
        severity: "critical",
        section: requiredSection,
        message: `Missing required section: ${requiredSection}.`,
      });
      continue;
    }

    if (!hasMeaningfulSectionContent(section)) {
      issues.push({
        id: `empty-${requiredSection.toLowerCase()}`,
        severity: "warning",
        section: requiredSection,
        message: `Section "${requiredSection}" has insufficient content.`,
      });
    }
  }

  const constraints = sectionsByTitle.get("constraints");
  if (constraints) {
    const constraintsSignal = extractConstraintSignal(constraints);
    checklist.push({
      id: "constraints-signal",
      label: "Constraints section has concrete constraints",
      passed: constraintsSignal,
      details: constraintsSignal
        ? undefined
        : "Add at least 2 explicit constraints or a concrete constraints paragraph.",
    });
    if (!constraintsSignal) {
      issues.push({
        id: "weak-constraints",
        severity: "warning",
        section: "Constraints",
        message: "Constraints look generic. Add concrete limits/tradeoffs.",
      });
    }
  }

  const outcome = sectionsByTitle.get("outcome");
  if (outcome) {
    const hasOutcomeMetric = hasMetricSignal(outcome);
    checklist.push({
      id: "outcome-metric",
      label: "Outcome section includes measurable signal",
      passed: hasOutcomeMetric,
      details: hasOutcomeMetric
        ? undefined
        : "Outcome should include measurable impact (number, %, latency, conversion, etc.).",
    });
    if (!hasOutcomeMetric) {
      issues.push({
        id: "weak-outcome-metric",
        severity: "warning",
        section: "Outcome",
        message: "Outcome has no measurable signal.",
      });
    }
  }

  const evidenceLinks = (options?.evidenceLinks || []).filter((href) => isHttpUrl(href));
  const hasEvidence = evidenceLinks.length > 0;
  checklist.push({
    id: "evidence-links",
    label: "Evidence links are available",
    passed: hasEvidence,
    details: hasEvidence ? `${evidenceLinks.length} link(s)` : "No evidence links detected.",
  });
  if (!hasEvidence) {
    issues.push({
      id: "missing-evidence-links",
      severity: "warning",
      message: "No evidence links attached to the draft.",
    });
  }

  const hasMetricWithNoEvidence =
    hasEvidence === false &&
    draft.sections.some((section) => hasMetricSignal(section));
  if (hasMetricWithNoEvidence) {
    issues.push({
      id: "metric-without-evidence",
      severity: "warning",
      message: "Draft contains quantitative claims without evidence links.",
    });
  }

  const passedCount = checklist.filter((item) => item.passed).length;
  const score = checklist.length === 0 ? 100 : Math.round((passedCount / checklist.length) * 100);

  return {
    score,
    checklist,
    issues,
    summary: {
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
    },
  };
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function hasMeaningfulSectionContent(section: CaseSection): boolean {
  return section.blocks.some((block) => {
    if (block.discriminant === "paragraph") {
      return Boolean(block.value.text && block.value.text.trim().length >= 30);
    }
    if (block.discriminant === "list") {
      return Boolean(block.value.items && block.value.items.filter(Boolean).length >= 1);
    }
    if (block.discriminant === "link") {
      return Boolean(block.value.href && isHttpUrl(block.value.href));
    }
    if (block.discriminant === "media") {
      return Boolean(block.value.src && block.value.alt);
    }
    return false;
  });
}

function extractConstraintSignal(section: CaseSection): boolean {
  for (const block of section.blocks) {
    if (block.discriminant === "list") {
      const count = (block.value.items || []).map((item) => item.trim()).filter(Boolean).length;
      if (count >= 2) return true;
    }
    if (block.discriminant === "paragraph") {
      const text = block.value.text?.trim() || "";
      if (text.length >= 80) return true;
    }
  }
  return false;
}

function hasMetricSignal(section: CaseSection): boolean {
  const texts: string[] = [];
  for (const block of section.blocks) {
    if (block.discriminant === "paragraph" && block.value.text) {
      texts.push(block.value.text);
    }
    if (block.discriminant === "list" && Array.isArray(block.value.items)) {
      texts.push(...block.value.items);
    }
  }

  return texts.some((text) =>
    /(\d+(\.\d+)?\s?%|\d+(\.\d+)?\s?(ms|s|sec|seconds|min|minutes|hours|users|sessions|tickets|errors|crashes|days|weeks|months|x))/i.test(
      text
    )
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
