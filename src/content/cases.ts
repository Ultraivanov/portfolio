import fs from "node:fs";
import path from "node:path";

export type CaseSectionContent =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; href: string }
  | { type: "media"; src: string; alt: string; caption?: string };

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

export const cases = caseFiles.map((file) => {
  const fullPath = path.join(casesDirectory, file);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return normalizeCase(JSON.parse(raw) as CaseStudyRaw);
});

export const getCaseBySlug = (slug: string) =>
  cases.find((item) => item.slug === slug);
