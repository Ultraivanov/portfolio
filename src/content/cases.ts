import fs from "node:fs";
import path from "node:path";

// Canonical block types — single source of truth, no dual formats
export type CaseSectionContent =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; href: string }
  | {
      type: "media";
      src: string;
      alt: string;
      caption?: string;
      variant?: "phone" | "desktop" | "diagram";
    };

export type CaseSection = {
  title: string;
  blocks: CaseSectionContent[];
};

export type CaseStudy = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: { label: string; value: string | string[]; href?: string }[];
  sections: CaseSection[];
};

// Raw formats from JSON (Keystatic discriminant/value or flat type/*)
type RawBlock =
  | { discriminant: "paragraph"; value: { text: string } }
  | { discriminant: "list"; value: { items: string[] } }
  | { discriminant: "link"; value: { label: string; href: string } }
  | { discriminant: "media"; value: { src: string; alt: string; caption?: string; variant?: string } }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; href: string }
  | { type: "media"; src: string; alt: string; caption?: string; variant?: string };

type RawSection = {
  title: string;
  blocks?: RawBlock[];
};

type RawSlug = string | { name: string; slug: string };

type CaseStudyRaw = {
  slug: RawSlug;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: { label: string; value: string | string[]; href?: string }[];
  sections: RawSection[];
};

const normalizeBlock = (raw: RawBlock): CaseSectionContent | null => {
  if ("discriminant" in raw) {
    switch (raw.discriminant) {
      case "paragraph":
        return { type: "paragraph", text: raw.value.text };
      case "list":
        return { type: "list", items: raw.value.items };
      case "link":
        return { type: "link", label: raw.value.label, href: raw.value.href };
      case "media":
        return {
          type: "media",
          src: raw.value.src,
          alt: raw.value.alt,
          caption: raw.value.caption,
          variant: raw.value.variant as CaseSectionContent extends { type: "media"; variant?: infer V } ? V : never,
        };
    }
  }
  if ("type" in raw) {
    switch (raw.type) {
      case "paragraph":
        return { type: "paragraph", text: raw.text };
      case "list":
        return { type: "list", items: raw.items };
      case "link":
        return { type: "link", label: raw.label, href: raw.href };
      case "media":
        return {
          type: "media",
          src: raw.src,
          alt: raw.alt,
          caption: raw.caption,
          variant: raw.variant as CaseSectionContent extends { type: "media"; variant?: infer V } ? V : never,
        };
    }
  }
  return null;
};

const normalizeCase = (raw: CaseStudyRaw): CaseStudy => ({
  slug: typeof raw.slug === "string" ? raw.slug : raw.slug.slug,
  title: raw.title,
  subtitle: raw.subtitle,
  coverSrc: raw.coverSrc,
  coverAlt: raw.coverAlt,
  facts: raw.facts,
  sections: (raw.sections ?? []).map((s) => ({
    title: s.title,
    blocks: (s.blocks ?? []).map(normalizeBlock).filter((b): b is CaseSectionContent => b !== null),
  })),
});

const casesDirectory = path.join(process.cwd(), "src", "content", "cases");

const allCases: CaseStudy[] = fs
  .readdirSync(casesDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const fullPath = path.join(casesDirectory, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as CaseStudyRaw;
    return normalizeCase(raw);
  });

const preferredOrder = [
  "travel-booking-platform",
  "railway-booking-flow",
  "megamod",
  "my-perfect-greek-vacation",
  "design-system-runtime",
];

export const cases: CaseStudy[] = allCases.sort((a, b) => {
  const ia = preferredOrder.indexOf(a.slug);
  const ib = preferredOrder.indexOf(b.slug);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.slug.localeCompare(b.slug);
});

// Returns undefined if slug not found — callers must handle this explicitly
export const getCaseBySlug = (slug: string): CaseStudy | undefined =>
  cases.find((item) => item.slug === slug);
