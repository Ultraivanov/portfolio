import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { apiError, apiSuccess } from "@/lib/api-response";

const CONTENT_DIR = process.env.CMS_CONTENT_DIR || "content";

export async function GET() {
  try {
    const contentPath = join(process.cwd(), CONTENT_DIR);
    const files = await readdir(contentPath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const slug = file.replace(".json", "");
        const content = await readFile(join(contentPath, file), "utf-8");
        const data = JSON.parse(content);
        return { slug, ...data };
      })
    );

    return apiSuccess({ items });
  } catch (error) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return apiSuccess({ items: [] });
    }
    return apiError(
      500,
      "CONTENT_READ_FAILED",
      error instanceof Error ? error.message : "Failed to read content list"
    );
  }
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}
