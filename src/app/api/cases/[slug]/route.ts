import { NextResponse } from "next/server";
import { isCaseSlug, readCaseBySlug } from "@/lib/content/case-files";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!isCaseSlug(slug)) {
    return NextResponse.json({ error: "Invalid case slug" }, { status: 400 });
  }

  try {
    const caseStudy = await readCaseBySlug(slug);
    return NextResponse.json(caseStudy);
  } catch {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
}
