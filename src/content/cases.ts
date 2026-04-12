import fs from "node:fs";
import path from "node:path";

export type CaseSectionContent =
  | { discriminant: "paragraph"; value: { text: string } }
  | { discriminant: "list"; value: { items: string[] } }
  | { discriminant: "link"; value: { label: string; href: string } }
  | {
      discriminant: "media";
      value: {
        src: string;
        alt: string;
        caption?: string;
        variant?: "phone" | "desktop" | "diagram";
      };
    };

export type CaseSectionBlock = {
  title: string;
  blocks?: CaseSectionContent[];
};

export type CaseSlug = string | { name: string; slug: string };

export type CaseStudy = {
  slug: string;
  title: string;
  subtitle: string;
  coverSrc: string;
  coverAlt: string;
  facts: { label: string; value: string | string[]; href?: string }[];
  sections: CaseSectionBlock[];
};

const casesDirectory = path.join(process.cwd(), "src", "content", "cases");

const caseFiles = fs
  .readdirSync(casesDirectory)
  .filter((file) => file.endsWith(".json"));

type CaseStudyRaw = Omit<CaseStudy, "slug"> & { slug: CaseSlug };

const normalizeSlug = (slug: CaseSlug) =>
  typeof slug === "string" ? slug : slug.slug;

const normalizeCase = (raw: CaseStudyRaw): CaseStudy => ({
  ...raw,
  slug: normalizeSlug(raw.slug),
});

const allCases = caseFiles.map((file) => {
  const fullPath = path.join(casesDirectory, file);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return normalizeCase(JSON.parse(raw) as CaseStudyRaw);
});

// Define preferred order of cases
const preferredOrder = [
  "travel-booking-platform",
  "railway-booking-flow",
  "megamod",
  "my-perfect-greek-vacation",
  "design-system-runtime",
];

export const cases = allCases.sort((a, b) => {
  const indexA = preferredOrder.indexOf(a.slug);
  const indexB = preferredOrder.indexOf(b.slug);
  
  // If both are in preferred order, sort by preferred order
  if (indexA !== -1 && indexB !== -1) {
    return indexA - indexB;
  }
  
  // If only one is in preferred order, it comes first
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  
  // Otherwise, keep alphabetical order
  return a.slug.localeCompare(b.slug);
});

export const getCaseBySlug = (slug: string) =>
  cases.find((item) => item.slug === slug);
