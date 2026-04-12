import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const ASSETS_DIR = process.env.CMS_ASSETS_DIR || "public/assets";

export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return NextResponse.json(
      { error: "GitHub not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop();
    const path = `${ASSETS_DIR}/${Date.now()}.${ext}`;

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Content = Buffer.from(bytes).toString("base64");

    // Upload to GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64Content,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || "Failed to upload" },
        { status: response.status }
      );
    }

    const result = await response.json();
    const publicPath = path.replace(/^public/, "");

    return NextResponse.json({
      success: true,
      url: result.content?.download_url,
      path: publicPath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
