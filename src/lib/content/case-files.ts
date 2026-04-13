import fs from "node:fs/promises";
import path from "node:path";

const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
const CASE_SLUG_PATTERN = /^[a-z0-9-]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isCaseSlug = (slug: string) => CASE_SLUG_PATTERN.test(slug);

export const readCaseSummaries = async () => {
  const files = await fs.readdir(casesDirectory);
  const caseFiles = files.filter((file) => file.endsWith(".json"));

  const summaries = await Promise.all(
    caseFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(casesDirectory, file), "utf-8");
      const data = JSON.parse(raw) as unknown;
      const fallbackSlug = file.replace(".json", "");
      const slug =
        isRecord(data) && typeof data.slug === "string" ? data.slug : fallbackSlug;
      const title =
        isRecord(data) && typeof data.title === "string" ? data.title : fallbackSlug;
      return { slug, title };
    }),
  );

  return summaries;
};

export const readCaseBySlug = async (slug: string) => {
  const filePath = path.join(casesDirectory, `${slug}.json`);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
};
