import { readFile } from "fs/promises";
import { join } from "path";
import { apiError, apiSuccess } from "@/lib/api-response";

const CONTENT_DIR = process.env.CMS_CONTENT_DIR || "content";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const content = await readFile(
      join(process.cwd(), CONTENT_DIR, `${slug}.json`),
      "utf-8"
    );
    const data = JSON.parse(content);
    return apiSuccess({ item: { slug, ...data } });
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return apiError(404, "CONTENT_NOT_FOUND", "Not found");
    }
    return apiError(
      500,
      "CONTENT_READ_FAILED",
      error instanceof Error ? error.message : "Failed to read content item"
    );
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
