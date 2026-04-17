"use client";

import type { CSSProperties } from "react";
import type {
  DraftConsistencyReport,
  DraftIntakeConfidence,
  DraftQualityIssue,
} from "@/lib/case-draft-quality";
import type { StarterVariant } from "@/lib/case-starter";
import type { SectionEvidenceReport } from "@/lib/case-section-evidence";
import type { BlueprintCoverCandidate } from "@/lib/blueprint-cover-candidate";

export type IntakeFocus = "ux-driven" | "behavioral-model" | "agentic-flow";
export type AnalysisMode = "llm" | "heuristic";

type RuntimeScreenshotPlan = {
  route: string;
  pageUrl: string;
  screenshotUrl: string;
  status: "planned";
};

type LlmInfo = {
  model?: string;
  usage?: {
    totalTokens?: number;
  };
} | null | undefined;

type AiIntakePanelProps = {
  fieldStyle: CSSProperties;
  labelStyle: CSSProperties;
  inputStyle: CSSProperties;
  githubRepoUrl: string;
  onGitHubRepoUrlChange: (value: string) => void;
  githubFocus: IntakeFocus;
  onGitHubFocusChange: (value: IntakeFocus) => void;
  githubAnalysisMode: AnalysisMode;
  onGitHubAnalysisModeChange: (value: AnalysisMode) => void;
  githubRuntimeBaseUrl: string;
  onGitHubRuntimeBaseUrlChange: (value: string) => void;
  githubScreenshotLimit: number;
  onGitHubScreenshotLimitChange: (value: number) => void;
  generatingGitHubDraft: boolean;
  onGenerateGitHubDraft: () => void;
  githubLlmInfo: LlmInfo;
  hasGithubStarterDraft: boolean;
  githubStarterVariants: StarterVariant[];
  selectedStarterVariantId: string;
  onSelectStarterVariant: (id: string) => void;
  onApplyStarterDraft: () => void;
  githubCoverCandidate: BlueprintCoverCandidate | null;
  onApplyCandidateCover: () => void;
  githubConfidence: DraftIntakeConfidence | null;
  githubConsistency: DraftConsistencyReport | null;
  githubEvidenceBySection: SectionEvidenceReport | null;
  githubEvidence: string[];
  githubRouteCandidates: string[];
  githubRuntimeScreenshots: RuntimeScreenshotPlan[];
  importingRuntimeScreenshots: boolean;
  onImportRuntimeScreenshots: () => void;
};

export default function AiIntakePanel({
  fieldStyle,
  labelStyle,
  inputStyle,
  githubRepoUrl,
  onGitHubRepoUrlChange,
  githubFocus,
  onGitHubFocusChange,
  githubAnalysisMode,
  onGitHubAnalysisModeChange,
  githubRuntimeBaseUrl,
  onGitHubRuntimeBaseUrlChange,
  githubScreenshotLimit,
  onGitHubScreenshotLimitChange,
  generatingGitHubDraft,
  onGenerateGitHubDraft,
  githubLlmInfo,
  hasGithubStarterDraft,
  githubStarterVariants,
  selectedStarterVariantId,
  onSelectStarterVariant,
  onApplyStarterDraft,
  githubCoverCandidate,
  onApplyCandidateCover,
  githubConfidence,
  githubConsistency,
  githubEvidenceBySection,
  githubEvidence,
  githubRouteCandidates,
  githubRuntimeScreenshots,
  importingRuntimeScreenshots,
  onImportRuntimeScreenshots,
}: AiIntakePanelProps) {
  return (
    <div
      style={{
        ...fieldStyle,
        padding: 12,
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-1)",
        background: "var(--color-bg-secondary)",
      }}
    >
      <label style={labelStyle}>AI Intake (GitHub)</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={githubRepoUrl}
          onChange={(e) => onGitHubRepoUrlChange(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 320 }}
          placeholder="https://github.com/owner/repo"
        />
        <select
          value={githubFocus}
          onChange={(e) => onGitHubFocusChange(e.target.value as IntakeFocus)}
          style={{ ...inputStyle, width: 200, flex: "0 0 200px" }}
        >
          <option value="ux-driven">UX-driven</option>
          <option value="behavioral-model">Behavioral model</option>
          <option value="agentic-flow">Agentic flow</option>
        </select>
        <select
          value={githubAnalysisMode}
          onChange={(e) => onGitHubAnalysisModeChange(e.target.value as AnalysisMode)}
          style={{ ...inputStyle, width: 170, flex: "0 0 170px" }}
        >
          <option value="llm">LLM analysis</option>
          <option value="heuristic">Heuristic</option>
        </select>
        <button
          onClick={onGenerateGitHubDraft}
          disabled={generatingGitHubDraft}
          style={{
            padding: "10px 14px",
            background: generatingGitHubDraft ? "#999" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-1)",
            cursor: generatingGitHubDraft ? "not-allowed" : "pointer",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {generatingGitHubDraft ? "Generating..." : "Generate Draft"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <input
          type="text"
          value={githubRuntimeBaseUrl}
          onChange={(e) => onGitHubRuntimeBaseUrlChange(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 320 }}
          placeholder="Runtime URL for screenshot crawl (optional), e.g. https://my-app.vercel.app"
        />
        <input
          type="number"
          min={1}
          max={12}
          value={githubScreenshotLimit}
          onChange={(e) =>
            onGitHubScreenshotLimitChange(
              Math.max(1, Math.min(12, Number.parseInt(e.target.value || "6", 10) || 6))
            )
          }
          style={{ ...inputStyle, width: 140, flex: "0 0 140px" }}
          placeholder="Shots"
        />
      </div>
      <p style={{ fontSize: 12, marginTop: 8, color: "var(--color-text-muted)" }}>
        Generates a draft from README + issues + merged PRs. LLM mode uses model synthesis;
        heuristic mode uses deterministic mapping. Runtime URL optionally enables route and screenshot planning.
      </p>
      {githubLlmInfo?.model ? (
        <p style={{ fontSize: 12, marginTop: 6, color: "var(--color-text-muted)" }}>
          LLM: {githubLlmInfo.model}
          {githubLlmInfo.usage?.totalTokens ? ` • tokens: ${githubLlmInfo.usage.totalTokens}` : ""}
        </p>
      ) : null}
      {hasGithubStarterDraft ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: "var(--radius-1)",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg)",
          }}
        >
          <p style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>
            Starter draft ready. Select title/subtitle variant, then apply to replace current form.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {githubStarterVariants.map((variant) => (
              <label
                key={variant.id}
                style={{
                  display: "block",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: "var(--radius-1)",
                  padding: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="starterVariant"
                  value={variant.id}
                  checked={selectedStarterVariantId === variant.id}
                  onChange={() => onSelectStarterVariant(variant.id)}
                  style={{ marginRight: 8 }}
                />
                <strong>{variant.title}</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>{variant.subtitle}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: "var(--color-text-muted)" }}>
                  {variant.reason}
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={onApplyStarterDraft}
            disabled={githubStarterVariants.length === 0}
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: githubStarterVariants.length === 0 ? "#999" : "#0f766e",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: githubStarterVariants.length === 0 ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            Apply Starter Draft
          </button>
        </div>
      ) : null}
      {githubCoverCandidate ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: "var(--radius-1)",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg)",
          }}
        >
          <p style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>
            Blueprint cover candidate ({githubCoverCandidate.focus})
          </p>
          <div style={{ marginBottom: 8 }}>
            <img
              src={githubCoverCandidate.previewUrl}
              alt={githubCoverCandidate.alt}
              style={{
                width: "100%",
                maxWidth: 520,
                borderRadius: "var(--radius-1)",
                border: "1px solid var(--color-border-subtle)",
              }}
            />
          </div>
          <p style={{ margin: "0 0 8px 0", fontSize: 12 }}>
            <strong>{githubCoverCandidate.title}</strong>
            {" • "}
            {githubCoverCandidate.subtitle}
          </p>
          <button
            onClick={onApplyCandidateCover}
            style={{
              padding: "8px 12px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Apply Candidate Cover
          </button>
        </div>
      ) : null}
      {githubConfidence ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: "var(--radius-1)",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg)",
          }}
        >
          <p style={{ fontSize: 12, marginTop: 0, marginBottom: 6 }}>
            Confidence:{" "}
            <strong style={{ color: confidenceLevelColor(githubConfidence.overallLevel) }}>
              {githubConfidence.overallScore}/100 ({githubConfidence.overallLevel})
            </strong>
            {" • "}
            checklist {githubConfidence.checklistPassed}/{githubConfidence.checklistTotal}
            {" • "}
            critical {githubConfidence.summary.critical}
            {" • "}
            warnings {githubConfidence.summary.warning}
          </p>
          <details>
            <summary style={{ cursor: "pointer", fontSize: 12 }}>
              Section confidence ({githubConfidence.sections.length})
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {githubConfidence.sections.map((section) => (
                <li key={section.section} style={{ marginBottom: 4 }}>
                  <strong>{section.section}</strong>: <span style={{ color: confidenceLevelColor(section.level) }}>
                    {section.score}/100 ({section.level})
                  </span>
                  {section.notes.length > 0 ? ` — ${section.notes.join(" ")}` : ""}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
      {githubConsistency ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: "var(--radius-1)",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg)",
          }}
        >
          <p style={{ fontSize: 12, marginTop: 0, marginBottom: 6 }}>
            Consistency:{" "}
            <strong style={{ color: consistencyOverallColor(githubConsistency.overall) }}>
              {githubConsistency.overall}
            </strong>
            {" • "}
            critical {githubConsistency.summary.critical}
            {" • "}
            warnings {githubConsistency.summary.warning}
            {" • "}
            checks:{" "}
            {githubConsistency.checks.sectionOrder ? "order✓" : "order✕"} /{" "}
            {githubConsistency.checks.tone ? "tone✓" : "tone✕"} /{" "}
            {githubConsistency.checks.verbosity ? "verbosity✓" : "verbosity✕"} /{" "}
            {githubConsistency.checks.evidence ? "evidence✓" : "evidence✕"}
          </p>
          {githubConsistency.findings.length > 0 ? (
            <details>
              <summary style={{ cursor: "pointer", fontSize: 12 }}>
                Top findings ({githubConsistency.findings.length})
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {githubConsistency.findings.map((finding) => (
                  <li key={finding.id} style={{ marginBottom: 4 }}>
                    <strong style={{ color: consistencySeverityColor(finding.severity) }}>
                      {finding.severity.toUpperCase()}
                    </strong>{" "}
                    [{finding.rule}] {finding.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p style={{ marginTop: 0, fontSize: 12 }}>No consistency findings.</p>
          )}
        </div>
      ) : null}
      {githubEvidenceBySection ? (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: "var(--radius-1)",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg)",
          }}
        >
          <p style={{ fontSize: 12, marginTop: 0, marginBottom: 6 }}>
            Section evidence coverage:{" "}
            <strong
              style={{
                color: evidenceCoverageColor(
                  githubEvidenceBySection.coveredSections,
                  githubEvidenceBySection.totalSections
                ),
              }}
            >
              {githubEvidenceBySection.coveredSections}/{githubEvidenceBySection.totalSections}
            </strong>
          </p>
          <details>
            <summary style={{ cursor: "pointer", fontSize: 12 }}>
              Coverage by section ({githubEvidenceBySection.sections.length})
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {githubEvidenceBySection.sections.map((section) => (
                <li key={section.section} style={{ marginBottom: 4 }}>
                  <strong>{section.section}</strong>: <span style={{ color: sectionEvidenceStatusColor(section.coverage) }}>
                    {section.coverage}
                  </span>
                  {section.links.length > 0
                    ? ` • ${section.links.length} link(s) • ${section.sourceTypes.join(", ")}`
                    : ""}
                </li>
              ))}
            </ul>
          </details>
          {githubEvidenceBySection.unassignedLinks.length > 0 ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", fontSize: 12 }}>
                Unassigned links ({githubEvidenceBySection.unassignedLinks.length})
              </summary>
              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                {githubEvidenceBySection.unassignedLinks.slice(0, 8).map((href) => (
                  <li key={href} style={{ marginBottom: 4, overflowWrap: "anywhere" }}>
                    <a href={href} target="_blank" rel="noreferrer">
                      {href}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
      {githubEvidence.length > 0 ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: 13 }}>
            Evidence links ({githubEvidence.length})
          </summary>
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {githubEvidence.slice(0, 8).map((href) => (
              <li key={href} style={{ marginBottom: 4, overflowWrap: "anywhere" }}>
                <a href={href} target="_blank" rel="noreferrer">
                  {href}
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {githubRouteCandidates.length > 0 ? (
        <details style={{ marginTop: 8 }}>
          <summary style={{ cursor: "pointer", fontSize: 13 }}>
            Route candidates ({githubRouteCandidates.length})
          </summary>
          <ul style={{ marginTop: 6, paddingLeft: 18 }}>
            {githubRouteCandidates.slice(0, 12).map((route) => (
              <li key={route} style={{ marginBottom: 4 }}>
                <code>{route}</code>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {githubRuntimeScreenshots.length > 0 ? (
        <div style={{ marginTop: 8 }}>
          <details>
            <summary style={{ cursor: "pointer", fontSize: 13 }}>
              Runtime screenshot plan ({githubRuntimeScreenshots.length})
            </summary>
            <ul style={{ marginTop: 6, paddingLeft: 18 }}>
              {githubRuntimeScreenshots.slice(0, 8).map((shot) => (
                <li key={`${shot.route}-${shot.pageUrl}`} style={{ marginBottom: 6 }}>
                  <div>
                    <code>{shot.route}</code>
                    {" -> "}
                    <a href={shot.pageUrl} target="_blank" rel="noreferrer">
                      page
                    </a>{" "}
                    /{" "}
                    <a href={shot.screenshotUrl} target="_blank" rel="noreferrer">
                      screenshot
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </details>
          <button
            onClick={onImportRuntimeScreenshots}
            disabled={importingRuntimeScreenshots}
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: importingRuntimeScreenshots ? "#999" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-1)",
              cursor: importingRuntimeScreenshots ? "not-allowed" : "pointer",
              fontSize: 13,
            }}
          >
            {importingRuntimeScreenshots
              ? "Importing Runtime Screenshots..."
              : "Import Runtime Screenshots"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function confidenceLevelColor(level: DraftIntakeConfidence["overallLevel"] | "missing"): string {
  switch (level) {
    case "strong":
      return "#16a34a";
    case "medium":
      return "#ca8a04";
    case "weak":
      return "#dc2626";
    case "missing":
      return "#7f1d1d";
    default:
      return "var(--color-text-primary)";
  }
}

function consistencyOverallColor(level: DraftConsistencyReport["overall"]): string {
  switch (level) {
    case "pass":
      return "#16a34a";
    case "warn":
      return "#ca8a04";
    case "fail":
      return "#dc2626";
    default:
      return "var(--color-text-primary)";
  }
}

function consistencySeverityColor(level: DraftQualityIssue["severity"]): string {
  switch (level) {
    case "critical":
      return "#dc2626";
    case "warning":
      return "#ca8a04";
    case "info":
      return "#2563eb";
    default:
      return "var(--color-text-primary)";
  }
}

function evidenceCoverageColor(covered: number, total: number): string {
  if (total <= 0) {
    return "var(--color-text-primary)";
  }

  const ratio = covered / total;
  if (ratio >= 0.85) {
    return "#16a34a";
  }
  if (ratio >= 0.5) {
    return "#ca8a04";
  }
  return "#dc2626";
}

function sectionEvidenceStatusColor(status: "present" | "missing"): string {
  return status === "present" ? "#16a34a" : "#dc2626";
}
