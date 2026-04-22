import type { IntakeFocus } from "@/lib/github-case-intake";

export type StarterVariant = {
  id: string;
  title: string;
  subtitle: string;
  reason: string;
};

export type StarterDraftLike = {
  title?: string;
  subtitle?: string;
  sections?: Array<{
    title: string;
    blocks: Array<{
      discriminant: "paragraph" | "list" | "link" | "media";
      value: {
        text?: string;
        items?: string[];
        [key: string]: unknown;
      };
    }>;
  }>;
};

const FOCUS_LABEL: Record<IntakeFocus, string> = {
  "ux-driven": "UX flow clarity",
  "behavioral-model": "behavioral decision model",
  "agentic-flow": "agentic runtime flow",
};

export function buildStarterVariants(params: {
  draft: StarterDraftLike;
  repoFullName?: string;
  focus?: IntakeFocus;
  limit?: number;
}): StarterVariant[] {
  const baseTitle = normalizeTitle(params.draft.title, params.repoFullName);
  const baseSubtitle = normalizeSubtitle(
    params.draft.subtitle,
    "Structured case draft grounded in repository evidence."
  );
  const repoLabel = normalizeRepoLabel(params.repoFullName);
  const focusLabel = params.focus ? FOCUS_LABEL[params.focus] : "product delivery";

  const outcomeSignal = readSectionSignal(params.draft.sections, "Outcome");
  const approachSignal = readSectionSignal(params.draft.sections, "Approach");

  const candidates: StarterVariant[] = [
    {
      id: "baseline",
      title: baseTitle,
      subtitle: baseSubtitle,
      reason: "Preserves the generated draft wording.",
    },
    {
      id: "focus",
      title: clamp(`${baseTitle}: ${toTitleSuffix(focusLabel)}`, 88),
      subtitle: clamp(
        `Case from ${repoLabel} with explicit context, constraints, solution, and outcome mapping.`,
        180
      ),
      reason: "Highlights the selected intake focus.",
    },
    {
      id: "evidence",
      title: clamp(`${baseTitle}: Evidence-backed case`, 88),
      subtitle: clamp(
        outcomeSignal
          ? `Outcome signal: ${outcomeSignal}`
          : approachSignal
            ? `Approach signal: ${approachSignal}`
            : "Evidence sourced from README, merged PRs, and closed issues.",
        180
      ),
      reason: "Makes evidence grounding explicit for quick review.",
    },
  ];

  const unique: StarterVariant[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const title = normalizeTitle(candidate.title, params.repoFullName);
    const subtitle = normalizeSubtitle(
      candidate.subtitle,
      "Structured case draft grounded in repository evidence."
    );
    const key = `${title.toLowerCase()}::${subtitle.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push({
      ...candidate,
      title,
      subtitle,
    });
  }

  const limit =
    typeof params.limit === "number" && Number.isFinite(params.limit)
      ? Math.max(1, Math.floor(params.limit))
      : 3;
  return unique.slice(0, limit);
}

function normalizeTitle(value: string | undefined, repoFullName: string | undefined): string {
  const trimmed = (value || "").trim();
  if (trimmed.length > 0) {
    return clamp(trimmed, 88);
  }

  const repoName = normalizeRepoLabel(repoFullName);
  return clamp(toStartCase(repoName), 88);
}

function normalizeSubtitle(value: string | undefined, fallback: string): string {
  const trimmed = (value || "").trim();
  if (trimmed.length > 0) {
    return clamp(trimmed, 180);
  }
  return clamp(fallback, 180);
}

function normalizeRepoLabel(repoFullName: string | undefined): string {
  const raw = (repoFullName || "repository").trim();
  if (!raw) {
    return "repository";
  }

  const repoName = raw.includes("/") ? raw.split("/").pop() || raw : raw;
  return repoName.replace(/[-_]+/g, " ").trim() || "repository";
}

function toStartCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toTitleSuffix(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Product workflow";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function readSectionSignal(
  sections: StarterDraftLike["sections"],
  sectionTitle: string
): string | null {
  if (!sections || sections.length === 0) {
    return null;
  }

  const section = sections.find(
    (item) => normalizeKey(item.title) === normalizeKey(sectionTitle)
  );

  if (!section) {
    return null;
  }

  for (const block of section.blocks) {
    if (block.discriminant === "paragraph") {
      const text = cleanSignal(block.value.text);
      if (text) {
        return text;
      }
    }

    if (block.discriminant === "list") {
      const first = Array.isArray(block.value.items) ? block.value.items[0] : "";
      const text = cleanSignal(first);
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function cleanSignal(value: string | undefined): string | null {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  return clamp(normalized, 140);
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function clamp(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max - 3).trimEnd()}...`;
}
