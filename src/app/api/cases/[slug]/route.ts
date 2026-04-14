import fs from "node:fs";
import path from "node:path";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Read directly from disk to avoid cache issues
  const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
  const filePath = path.join(casesDirectory, `${slug}.json`);

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const caseStudy = JSON.parse(raw);
    return apiSuccess({ item: caseStudy });
  } catch (error) {
    return apiError(
      404,
      "CASE_NOT_FOUND",
      error instanceof Error ? error.message : "Case not found"
    );
  }
}
