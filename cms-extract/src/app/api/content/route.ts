import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

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

    return NextResponse.json(items);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
