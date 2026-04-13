import { NextResponse } from "next/server";
import { readCaseSummaries } from "@/lib/content/case-files";

export async function GET() {
  try {
    const caseList = await readCaseSummaries();
    return NextResponse.json(caseList);
  } catch {
    return NextResponse.json(
      { error: "Failed to read case summaries" },
      { status: 500 },
    );
  }
}
