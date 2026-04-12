import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

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
    return NextResponse.json(caseStudy);
  } catch {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
}
