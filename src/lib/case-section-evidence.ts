import {
  REQUIRED_CASE_SECTIONS,
  type CaseDraftLike,
} from "@/lib/case-draft-quality";

export type EvidenceSourceType =
  | "repo"
  | "pull"
  | "issue"
  | "github-doc"
  | "runtime-page"
  | "runtime-screenshot"
  | "other";

export type SectionEvidenceItem = {
  section: (typeof REQUIRED_CASE_SECTIONS)[number];
  coverage: "present" | "missing";
  links: string[];
  sourceTypes: EvidenceSourceType[];
};

export type SectionEvidenceReport = {
  coveredSections: number;
  totalSections: number;
  sections: SectionEvidenceItem[];
  unassignedLinks: string[];
};

const SECTION_SOURCE_PRIORITY: Record<
  (typeof REQUIRED_CASE_SECTIONS)[number],
  EvidenceSourceType[]
> = {
  Context: ["repo", "github-doc", "runtime-page", "other"],
  Problem: ["issue", "pull", "github-doc"],
  Constraints: ["issue", "github-doc", "pull"],
  Role: ["repo", "github-doc", "other"],
  Approach: ["pull", "github-doc", "runtime-page"],
  Solution: ["pull", "runtime-page", "runtime-screenshot", "github-doc"],
  Outcome: ["pull", "issue", "github-doc", "runtime-page"],
};

const MAX_LINKS_PER_SECTION = 4;

export function buildEvidenceBySection(
  draft: CaseDraftLike,
  options?: { evidenceLinks?: string[] }
): SectionEvidenceReport {
  const globalEvidence = uniqueHttpLinks(options?.evidenceLinks || []);
  const directBySection = collectDirectSectionLinks(draft);
  const allEvidence = uniqueHttpLinks([
    ...globalEvidence,
    ...REQUIRED_CASE_SECTIONS.flatMap((section) => directBySection.get(section) || []),
  ]);

  const byType = new Map<EvidenceSourceType, string[]>();
  for (const link of allEvidence) {
    const type = classifyEvidenceLink(link);
    const existing = byType.get(type) || [];
    existing.push(link);
    byType.set(type, existing);
  }

  const sections: SectionEvidenceItem[] = REQUIRED_CASE_SECTIONS.map((sectionName) => {
    const chosen = selectSectionLinks(sectionName, {
      allEvidence,
      byType,
      directLinks: directBySection.get(sectionName) || [],
    });

    return {
      section: sectionName,
      coverage: chosen.length > 0 ? "present" : "missing",
      links: chosen,
      sourceTypes: uniqueSourceTypes(chosen.map((link) => classifyEvidenceLink(link))),
    };
  });

  const assigned = new Set(sections.flatMap((section) => section.links));
  const coveredSections = sections.filter((section) => section.coverage === "present").length;

  return {
    coveredSections,
    totalSections: sections.length,
    sections,
    unassignedLinks: allEvidence.filter((link) => !assigned.has(link)),
  };
}

function selectSectionLinks(
  sectionName: (typeof REQUIRED_CASE_SECTIONS)[number],
  input: {
    allEvidence: string[];
    byType: Map<EvidenceSourceType, string[]>;
    directLinks: string[];
  }
): string[] {
  const picked: string[] = [];

  const append = (link: string) => {
    if (!link || picked.includes(link)) {
      return;
    }
    picked.push(link);
  };

  for (const link of input.directLinks) {
    append(link);
    if (picked.length >= MAX_LINKS_PER_SECTION) {
      return picked;
    }
  }

  for (const sourceType of SECTION_SOURCE_PRIORITY[sectionName]) {
    for (const link of input.byType.get(sourceType) || []) {
      append(link);
      if (picked.length >= MAX_LINKS_PER_SECTION) {
        return picked;
      }
    }
  }

  for (const link of input.byType.get("repo") || []) {
    append(link);
    if (picked.length >= MAX_LINKS_PER_SECTION) {
      return picked;
    }
  }

  return picked;
}

function collectDirectSectionLinks(
  draft: CaseDraftLike
): Map<(typeof REQUIRED_CASE_SECTIONS)[number], string[]> {
  const bySection = new Map<(typeof REQUIRED_CASE_SECTIONS)[number], string[]>();

  for (const sectionName of REQUIRED_CASE_SECTIONS) {
    bySection.set(sectionName, []);
  }

  for (const section of draft.sections) {
    const sectionName = REQUIRED_CASE_SECTIONS.find(
      (required) => normalize(required) === normalize(section.title)
    );
    if (!sectionName) {
      continue;
    }

    const links = bySection.get(sectionName);
    if (!links) {
      continue;
    }

    for (const block of section.blocks) {
      if (block.discriminant !== "link") {
        continue;
      }
      if (typeof block.value.href !== "string") {
        continue;
      }
      const href = block.value.href.trim();
      if (isHttpUrl(href) && !links.includes(href)) {
        links.push(href);
      }
    }
  }

  return bySection;
}

function uniqueHttpLinks(links: string[]): string[] {
  const deduped = new Set<string>();
  for (const rawLink of links) {
    const link = rawLink.trim();
    if (!isHttpUrl(link)) {
      continue;
    }
    deduped.add(link);
  }
  return [...deduped.values()];
}

function uniqueSourceTypes(types: EvidenceSourceType[]): EvidenceSourceType[] {
  const unique = new Set<EvidenceSourceType>();
  for (const type of types) {
    unique.add(type);
  }
  return [...unique.values()];
}

function isHttpUrl(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function classifyEvidenceLink(href: string): EvidenceSourceType {
  try {
    const parsed = new URL(href);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (isImagePath(pathname) || hostname.includes("image.thum.io")) {
      return "runtime-screenshot";
    }

    if (hostname === "github.com") {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 2 && segments.length <= 2) {
        return "repo";
      }
      if (pathname.includes("/pull/")) {
        return "pull";
      }
      if (pathname.includes("/issues/")) {
        return "issue";
      }
      return "github-doc";
    }

    if (hostname.endsWith("githubusercontent.com")) {
      return "github-doc";
    }

    return "runtime-page";
  } catch {
    return "other";
  }
}

function isImagePath(pathname: string): boolean {
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(pathname);
}
