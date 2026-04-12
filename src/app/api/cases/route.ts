import { NextResponse } from "next/server";
import { cases } from "@/content/cases";

export async function GET() {
  // Return minimal case data for admin UI
  const caseList = cases.map((c) => ({
    slug: c.slug,
    title: c.title,
  }));

  return NextResponse.json(caseList);
}

export async function GET_CASE(slug: string) {
  const caseStudy = cases.find((c) => c.slug === slug);
  if (!caseStudy) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }
  return NextResponse.json(caseStudy);
}
