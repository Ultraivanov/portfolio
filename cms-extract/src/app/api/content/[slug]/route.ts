import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

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
    return NextResponse.json({ slug, ...data });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
