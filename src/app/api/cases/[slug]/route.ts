import { NextResponse } from "next/server";
import { getCaseBySlug } from "@/content/cases";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);

  if (!caseStudy) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  return NextResponse.json(caseStudy);
}
