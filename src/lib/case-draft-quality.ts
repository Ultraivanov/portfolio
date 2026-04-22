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

export type IntakeConfidenceLevel = "strong" | "medium" | "weak" | "missing";

export type DraftSectionConfidence = {
  section: (typeof REQUIRED_CASE_SECTIONS)[number];
  score: number;
  level: IntakeConfidenceLevel;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  notes: string[];
};

export type DraftIntakeConfidence = {
  overallScore: number;
  overallLevel: Exclude<IntakeConfidenceLevel, "missing">;
  checklistPassed: number;
  checklistTotal: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  sections: DraftSectionConfidence[];
  topIssues: DraftQualityIssue[];
};

export type DraftRewritePriority = "critical" | "warning";

export type DraftRewriteSuggestion = {
  id: string;
  issueId: string;
  section: string;
  priority: DraftRewritePriority;
  confidence: number;
  rationale: string;
  before: string;
  suggestedRewrite: string;
};

export type DraftConsistencyRule =
  | "section-order"
  | "tone"
  | "verbosity"
  | "evidence";

export type DraftConsistencyFinding = {
  id: string;
  severity: QualitySeverity;
  rule: DraftConsistencyRule;
  message: string;
  section?: string;
};

export type DraftConsistencyReport = {
  overall: "pass" | "warn" | "fail";
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
  checks: {
    sectionOrder: boolean;
    tone: boolean;
    verbosity: boolean;
    evidence: boolean;
  };
  findings: DraftConsistencyFinding[];
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

export function buildDraftIntakeConfidence(
  draft: CaseDraftLike,
  options?: { evidenceLinks?: string[] }
): DraftIntakeConfidence {
  const quality = analyzeCaseDraftQuality(draft, options);
  const checklistPassed = quality.checklist.filter((item) => item.passed).length;
  const checklistTotal = quality.checklist.length;
  const checklistMap = new Map(quality.checklist.map((item) => [item.id, item]));

  const sections = REQUIRED_CASE_SECTIONS.map((sectionName) => {
    const sectionIssues = quality.issues.filter(
      (issue) => normalizeTitle(issue.section || "") === normalizeTitle(sectionName)
    );
    const hasMissingIssue = sectionIssues.some((issue) => issue.id === `missing-${sectionName.toLowerCase()}`);

    if (hasMissingIssue) {
      return {
        section: sectionName,
        score: 0,
        level: "missing",
        summary: {
          critical: sectionIssues.filter((issue) => issue.severity === "critical").length,
          warning: sectionIssues.filter((issue) => issue.severity === "warning").length,
          info: sectionIssues.filter((issue) => issue.severity === "info").length,
        },
        notes: sectionIssues.map((issue) => issue.message).slice(0, 2),
      } satisfies DraftSectionConfidence;
    }

    const summary = {
      critical: sectionIssues.filter((issue) => issue.severity === "critical").length,
      warning: sectionIssues.filter((issue) => issue.severity === "warning").length,
      info: sectionIssues.filter((issue) => issue.severity === "info").length,
    };

    let score = 78;
    score -= summary.critical * 35;
    score -= summary.warning * 18;
    score -= summary.info * 8;

    if (sectionName === "Outcome") {
      if (checklistMap.get("outcome-metric")?.passed) {
        score += 12;
      } else {
        score -= 10;
      }
    }
    if (sectionName === "Constraints") {
      if (checklistMap.get("constraints-signal")?.passed) {
        score += 8;
      } else {
        score -= 10;
      }
    }

    score = clampScore(score);
    return {
      section: sectionName,
      score,
      level: scoreToLevel(score),
      summary,
      notes: sectionIssues.map((issue) => issue.message).slice(0, 2),
    } satisfies DraftSectionConfidence;
  });

  const averageSectionScore =
    sections.length === 0
      ? 0
      : Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length);
  const issuePenalty = quality.summary.critical * 12 + quality.summary.warning * 4;
  const overallScore = clampScore(
    Math.round(averageSectionScore * 0.6 + quality.score * 0.4 - issuePenalty)
  );

  return {
    overallScore,
    overallLevel: scoreToOverallLevel(overallScore),
    checklistPassed,
    checklistTotal,
    summary: quality.summary,
    sections,
    topIssues: quality.issues
      .slice()
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
      .slice(0, 6),
  };
}

export function buildDraftConsistencyReport(
  draft: CaseDraftLike,
  options?: { evidenceLinks?: string[] }
): DraftConsistencyReport {
  const findings: DraftConsistencyFinding[] = [];
  const textSignals = collectSectionTexts(draft.sections);
  const evidenceLinks = collectEvidenceLinks(draft, options?.evidenceLinks || []);

  const orderCheck = evaluateSectionOrder(draft.sections);
  if (!orderCheck.passed) {
    findings.push({
      id: "section-order",
      severity: "warning",
      rule: "section-order",
      message: orderCheck.message,
    });
  }

  const duplicateSectionTitles = findDuplicateRequiredSectionTitles(draft.sections);
  for (const title of duplicateSectionTitles) {
    findings.push({
      id: `duplicate-section-${normalizeTitle(title)}`,
      severity: "warning",
      rule: "section-order",
      section: title,
      message: `Section "${title}" appears more than once.`,
    });
  }

  for (const signal of textSignals) {
    if (containsPromotionalTone(signal.text)) {
      findings.push({
        id: `tone-${normalizeTitle(signal.section)}-${hashSnippet(signal.text)}`,
        severity: "warning",
        rule: "tone",
        section: signal.section,
        message: `Section "${signal.section}" contains marketing-style language. Prefer evidence-grounded wording.`,
      });
      break;
    }
  }

  for (const signal of textSignals) {
    if (signal.text.length > 560) {
      findings.push({
        id: `verbosity-${normalizeTitle(signal.section)}-${hashSnippet(signal.text)}`,
        severity: "warning",
        rule: "verbosity",
        section: signal.section,
        message: `Section "${signal.section}" has an overly long paragraph (${signal.text.length} chars).`,
      });
    }
  }

  const hasMetricClaims = draft.sections.some((section) => hasMetricSignal(section));
  const hasNonNumericClaims = textSignals.some((signal) => CLAIM_WORDS_REGEX.test(signal.text));
  const hasEvidence = evidenceLinks.length > 0;

  if (hasMetricClaims && !hasEvidence) {
    findings.push({
      id: "evidence-metric-claim-missing",
      severity: "critical",
      rule: "evidence",
      message: "Draft includes quantitative claims without evidence links.",
    });
  } else if (hasNonNumericClaims && !hasEvidence) {
    findings.push({
      id: "evidence-claim-missing",
      severity: "warning",
      rule: "evidence",
      message: "Draft includes outcome claims without supporting evidence links.",
    });
  }

  const summary = {
    critical: findings.filter((item) => item.severity === "critical").length,
    warning: findings.filter((item) => item.severity === "warning").length,
    info: findings.filter((item) => item.severity === "info").length,
  };

  return {
    overall: summary.critical > 0 ? "fail" : summary.warning > 0 ? "warn" : "pass",
    summary,
    checks: {
      sectionOrder: !findings.some((item) => item.rule === "section-order"),
      tone: !findings.some((item) => item.rule === "tone"),
      verbosity: !findings.some((item) => item.rule === "verbosity"),
      evidence: !findings.some((item) => item.rule === "evidence"),
    },
    findings: findings
      .slice()
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
      .slice(0, 8),
  };
}

export function buildDraftRewriteSuggestions(
  draft: CaseDraftLike,
  options?: { evidenceLinks?: string[] }
): DraftRewriteSuggestion[] {
  const quality = analyzeCaseDraftQuality(draft, options);
  const sectionsByTitle = new Map(
    draft.sections.map((section) => [normalizeTitle(section.title), section])
  );
  const bySection = new Map<string, DraftRewriteSuggestion>();
  const sortedIssues = quality.issues
    .slice()
    .sort(
      (a, b) =>
        severityRank(a.severity) - severityRank(b.severity) ||
        a.id.localeCompare(b.id)
    );

  for (const issue of sortedIssues) {
    const section = sectionsByTitle.get(normalizeTitle(issue.section || ""));
    const suggestion = mapIssueToRewriteSuggestion(issue, section);
    if (!suggestion) {
      continue;
    }
    const key = normalizeTitle(suggestion.section);
    const existing = bySection.get(key);
    if (!existing) {
      bySection.set(key, suggestion);
      continue;
    }
    if (rewritePriorityRank(suggestion.priority) < rewritePriorityRank(existing.priority)) {
      bySection.set(key, suggestion);
    }
  }

  return [...bySection.values()]
    .sort(
      (a, b) =>
        rewritePriorityRank(a.priority) - rewritePriorityRank(b.priority) ||
        b.confidence - a.confidence ||
        a.section.localeCompare(b.section)
    )
    .slice(0, 6);
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function mapIssueToRewriteSuggestion(
  issue: DraftQualityIssue,
  section: CaseSection | undefined
): DraftRewriteSuggestion | null {
  if (issue.id === "metric-without-evidence") {
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: "Evidence",
      priority: "warning",
      confidence: 86,
      rationale: issue.message,
      before: "Quantitative claims are present, but proof links are missing.",
      suggestedRewrite:
        "Add 2-3 links that prove each metric claim (PR/issue, dashboard snapshot, release note), and reference each link directly in Outcome or Solution blocks.",
    };
  }

  if (issue.id === "missing-evidence-links") {
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: "Evidence",
      priority: "warning",
      confidence: 72,
      rationale: issue.message,
      before: "No evidence links are attached to this draft.",
      suggestedRewrite:
        "Attach supporting links (repo, merged PRs, issues, docs) and anchor them to claims in Context, Solution, and Outcome sections.",
    };
  }

  if (issue.id.startsWith("missing-")) {
    const sectionName = issue.section || fallbackSectionFromIssueId(issue.id);
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: sectionName || "Section",
      priority: "critical",
      confidence: 94,
      rationale: issue.message,
      before: "Section is missing.",
      suggestedRewrite: buildMissingSectionRewrite(sectionName || "Section"),
    };
  }

  if (issue.id.startsWith("empty-")) {
    const sectionName = issue.section || "Section";
    const before = extractSectionSignal(section) || "Content is too short or generic.";
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: sectionName,
      priority: "warning",
      confidence: 76,
      rationale: issue.message,
      before,
      suggestedRewrite: buildWeakSectionRewrite(sectionName),
    };
  }

  if (issue.id === "weak-constraints") {
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: "Constraints",
      priority: "warning",
      confidence: 88,
      rationale: issue.message,
      before:
        extractSectionSignal(section) || "Constraints are generic and not decision-driving.",
      suggestedRewrite:
        "Constraints: (1) Legacy API contract prevents [change], (2) Delivery deadline limits scope to [subset], (3) Team capacity allows [N] implementation slices this sprint.",
    };
  }

  if (issue.id === "weak-outcome-metric") {
    return {
      id: `rewrite-${issue.id}`,
      issueId: issue.id,
      section: "Outcome",
      priority: "warning",
      confidence: 90,
      rationale: issue.message,
      before:
        extractSectionSignal(section) || "Outcome has no measurable impact signal.",
      suggestedRewrite:
        "Outcome: After release, [primary metric] changed from [baseline] to [result] in [timeframe], and [secondary metric] moved by [delta]. Evidence: [link or source].",
    };
  }

  return null;
}

function fallbackSectionFromIssueId(issueId: string): string {
  return issueId
    .replace(/^missing-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMissingSectionRewrite(sectionName: string): string {
  switch (normalizeTitle(sectionName)) {
    case "context":
      return "Context: [target users] use [product/surface] for [goal]. Current baseline shows [pain signal], observed in [where/when].";
    case "problem":
      return "Problem: Users fail at [step], causing [business/user impact]. Root cause: [specific friction or ambiguity].";
    case "constraints":
      return "Constraints: [technical constraint], [time/resource constraint], [organizational dependency]. Each constraint changed decisions in scope or UX.";
    case "role":
      return "Role: I owned [discovery/design/validation], partnered with [functions], and made decisions on [scope/system/quality bar].";
    case "approach":
      return "Approach: We ran [research or analysis], formed [key hypotheses], prioritized [experiments], and iterated based on [evidence loop].";
    case "solution":
      return "Solution: Introduced [key flow/system changes], clarified [states/interactions], and aligned implementation through [handoff/spec process].";
    case "outcome":
      return "Outcome: [primary metric] changed by [delta] over [timeframe]. Secondary effects: [quality/support/conversion signal], validated by [evidence link].";
    default:
      return `Rewrite ${sectionName}: state the specific problem, decision logic, and measurable result in 2-3 concise sentences.`;
  }
}

function buildWeakSectionRewrite(sectionName: string): string {
  switch (normalizeTitle(sectionName)) {
    case "constraints":
      return "Rewrite Constraints with explicit limits: what could not be changed, why, and how each limit shaped product or technical choices.";
    case "outcome":
      return "Rewrite Outcome with measurable deltas: baseline -> result, timeframe, and at least one evidence link for each key claim.";
    default:
      return `Rewrite ${sectionName}: replace generic statements with concrete context, decisions, and observable impact.`;
  }
}

function extractSectionSignal(section: CaseSection | undefined): string {
  if (!section) {
    return "";
  }
  const chunks: string[] = [];
  for (const block of section.blocks) {
    if (block.discriminant === "paragraph" && typeof block.value.text === "string") {
      const text = block.value.text.trim();
      if (text) {
        chunks.push(text);
      }
    }
    if (block.discriminant === "list" && Array.isArray(block.value.items)) {
      for (const item of block.value.items) {
        const text = item.trim();
        if (text) {
          chunks.push(text);
        }
      }
    }
    if (chunks.length >= 2) {
      break;
    }
  }
  const combined = chunks.join(" ").replace(/\s+/g, " ").trim();
  if (!combined) {
    return "";
  }
  return combined.length > 180 ? `${combined.slice(0, 177)}...` : combined;
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

const CLAIM_WORDS_REGEX =
  /\b(improved|increase(?:d)?|reduced?|decreased?|boosted?|grew|drop(?:ped)?|faster|higher|lower)\b/i;

const PROMOTIONAL_PHRASES = [
  "best-in-class",
  "world-class",
  "game-changing",
  "revolutionary",
  "seamless experience",
  "cutting-edge",
];

function collectSectionTexts(
  sections: CaseSection[]
): Array<{ section: string; text: string }> {
  const signals: Array<{ section: string; text: string }> = [];
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.discriminant === "paragraph" && typeof block.value.text === "string") {
        const text = block.value.text.trim();
        if (text) {
          signals.push({ section: section.title, text });
        }
      }
      if (block.discriminant === "list" && Array.isArray(block.value.items)) {
        for (const item of block.value.items) {
          const text = item.trim();
          if (text) {
            signals.push({ section: section.title, text });
          }
        }
      }
    }
  }
  return signals;
}

function evaluateSectionOrder(sections: CaseSection[]): { passed: boolean; message: string } {
  const indexByTitle = new Map<string, number>();
  for (let i = 0; i < sections.length; i += 1) {
    const key = normalizeTitle(sections[i].title);
    if (!indexByTitle.has(key)) {
      indexByTitle.set(key, i);
    }
  }

  let previous = -1;
  for (const expected of REQUIRED_CASE_SECTIONS) {
    const idx = indexByTitle.get(normalizeTitle(expected));
    if (idx === undefined) continue;
    if (idx < previous) {
      return {
        passed: false,
        message: `Required sections are out of order. Expected "${expected}" after previous required sections.`,
      };
    }
    previous = idx;
  }
  return { passed: true, message: "Required sections are in expected order." };
}

function findDuplicateRequiredSectionTitles(sections: CaseSection[]): string[] {
  const counts = new Map<string, number>();
  for (const section of sections) {
    const key = normalizeTitle(section.title);
    if (!REQUIRED_CASE_SECTIONS.map(normalizeTitle).includes(key)) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const duplicates: string[] = [];
  for (const required of REQUIRED_CASE_SECTIONS) {
    const key = normalizeTitle(required);
    if ((counts.get(key) || 0) > 1) {
      duplicates.push(required);
    }
  }
  return duplicates;
}

function containsPromotionalTone(text: string): boolean {
  if (PROMOTIONAL_PHRASES.some((phrase) => text.toLowerCase().includes(phrase))) {
    return true;
  }
  if ((text.match(/!/g) || []).length >= 2) {
    return true;
  }
  return false;
}

function collectEvidenceLinks(draft: CaseDraftLike, inputLinks: string[]): string[] {
  const links = new Set<string>();
  for (const href of inputLinks) {
    if (isHttpUrl(href)) {
      links.add(href);
    }
  }
  for (const section of draft.sections) {
    for (const block of section.blocks) {
      if (block.discriminant === "link" && typeof block.value.href === "string") {
        if (isHttpUrl(block.value.href)) {
          links.add(block.value.href);
        }
      }
    }
  }
  return [...links];
}

function hashSnippet(value: string): string {
  return value.trim().toLowerCase().slice(0, 24).replace(/[^a-z0-9]+/g, "-");
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function scoreToLevel(score: number): IntakeConfidenceLevel {
  if (score <= 0) return "missing";
  if (score >= 80) return "strong";
  if (score >= 55) return "medium";
  return "weak";
}

function scoreToOverallLevel(score: number): Exclude<IntakeConfidenceLevel, "missing"> {
  if (score >= 75) return "strong";
  if (score >= 50) return "medium";
  return "weak";
}

function severityRank(severity: QualitySeverity): number {
  switch (severity) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
    default:
      return 3;
  }
}

function rewritePriorityRank(priority: DraftRewritePriority): number {
  return priority === "critical" ? 0 : 1;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}
