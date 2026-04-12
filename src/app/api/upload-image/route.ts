import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || "Ultraivanov/portfolio";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

export async function POST(request: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: "GitHub PAT not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: "Missing file or path" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Content = Buffer.from(bytes).toString("base64");

    // Check if file exists
    const getResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    let sha: string | undefined;
    if (getResponse.status === 200) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    }

    // Upload to GitHub
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${path} via CMS`,
          content: base64Content,
          branch: GITHUB_BRANCH,
          sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to upload" },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();

    return NextResponse.json({
      success: true,
      url: result.content?.download_url || result.content?.url,
      path: path,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
