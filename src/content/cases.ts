import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

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
  author: string;
  lastUpdated: string;
  coverSrc: string;
  coverAlt: string;
  facts: { label: string; value: string | string[]; href?: string }[];
  sections: CaseSectionBlock[];
  published?: boolean;
  featured?: boolean;
};

const casesDirectory = path.join(process.cwd(), "src", "content", "cases");

const caseFiles = fs
  .readdirSync(casesDirectory)
  .filter((file) => file.endsWith(".json"));

type CaseStudyRaw = Omit<CaseStudy, "slug" | "author" | "lastUpdated"> & { slug: CaseSlug };
type CaseMeta = Pick<CaseStudy, "author" | "lastUpdated">;

const normalizeSlug = (slug: CaseSlug) =>
  typeof slug === "string" ? slug : slug.slug;

const DEFAULT_CASE_AUTHOR = "Dima Ginzburg";

// Optional per-case overrides. Keep only exceptions here.
const CASE_META_BY_SLUG: Record<string, Partial<CaseMeta>> = {};

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getLastGitUpdatedDate(filePath: string): string | null {
  try {
    const output = execSync(`git log -1 --format=%cs -- "${filePath}"`, {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    return /^\d{4}-\d{2}-\d{2}$/.test(output) ? output : null;
  } catch {
    return null;
  }
}

function resolveCaseMeta(slug: string, filePath: string): CaseMeta {
  const override = CASE_META_BY_SLUG[slug];

  return {
    author: override?.author ?? DEFAULT_CASE_AUTHOR,
    lastUpdated: override?.lastUpdated ?? getLastGitUpdatedDate(filePath) ?? getTodayIsoDate(),
  };
}

const normalizeCase = (raw: CaseStudyRaw, filePath: string): CaseStudy => {
  const slug = normalizeSlug(raw.slug);
  const meta = resolveCaseMeta(slug, filePath);

  return {
    ...raw,
    ...meta,
    slug,
  };
};

const loadedCases = caseFiles.map((file) => {
  const fullPath = path.join(casesDirectory, file);
  const raw = fs.readFileSync(fullPath, "utf-8");
  return normalizeCase(JSON.parse(raw) as CaseStudyRaw, fullPath);
});

// Define preferred order of cases
const preferredOrder = [
  "happy-numbers-design-system",
  "travel-booking-platform",
  "railway-booking-flow",
  "megamod",
  "my-perfect-greek-vacation",
  "design-system-runtime",
];

const orderCases = (items: CaseStudy[]) =>
  [...items].sort((a, b) => {
    const indexA = preferredOrder.indexOf(a.slug);
    const indexB = preferredOrder.indexOf(b.slug);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.slug.localeCompare(b.slug);
  });

const isPublished = (item: CaseStudy) => item.published === true;

// All cases (including drafts). Use for CMS only.
export const allCases = orderCases(loadedCases);

// Published cases only. Use on all public-facing pages.
export const cases = allCases.filter(isPublished);

// Featured & published cases — for homepage featured list.
export const featuredCases = cases.filter((item) => item.featured === true);

export const getCaseBySlug = (slug: string) =>
  cases.find((item) => item.slug === slug);
