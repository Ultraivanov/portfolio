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
    const { path, content, message } = await request.json();

    if (!path || !content) {
      return NextResponse.json(
        { error: "Missing path or content" },
        { status: 400 }
      );
    }

    // Get current file SHA (if exists)
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

    // Update or create file
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
          message: message || `Update ${path} via CMS`,
          content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
          branch: GITHUB_BRANCH,
          sha,
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      return NextResponse.json(
        { error: error.message || "Failed to save" },
        { status: updateResponse.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
