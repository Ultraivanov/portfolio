import fs from "node:fs";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET() {
  try {
    // Read directly from disk to avoid cache issues
    const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
    const files = fs.readdirSync(casesDirectory).filter((f) => f.endsWith(".json"));

    const caseList = files.map((file) => {
      const raw = fs.readFileSync(path.join(casesDirectory, file), "utf-8");
      const data = JSON.parse(raw);
      const slug = file.replace(".json", "");
      return {
        slug: typeof data.slug === "string" ? data.slug : slug,
        title: data.title || slug,
        published: data.published !== false,
        featured: data.featured === true,
      };
    });

    return apiSuccess({ items: caseList });
  } catch (error) {
    return apiError(
      500,
      "CASES_READ_FAILED",
      error instanceof Error ? error.message : "Failed to read cases"
    );
  }
}
