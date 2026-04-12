import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  // Read directly from disk to avoid cache issues
  const casesDirectory = path.join(process.cwd(), "src", "content", "cases");
  const files = fs.readdirSync(casesDirectory).filter((f) => f.endsWith(".json"));

  const caseList = files.map((file) => {
    const raw = fs.readFileSync(path.join(casesDirectory, file), "utf-8");
    const data = JSON.parse(raw);
    const slug = file.replace(".json", "");
    return {
      slug: typeof data.slug === "string" ? data.slug : slug,
      title: data.title || slug,
    };
  });

  return NextResponse.json(caseList);
}
