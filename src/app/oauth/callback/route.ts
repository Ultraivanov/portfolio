import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse("Missing OAuth client credentials", { status: 500 });
  }

  if (!code) {
    return new NextResponse("Missing OAuth code", { status: 400 });
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenPayload.access_token) {
    const errorMessage =
      tokenPayload.error_description || tokenPayload.error || "OAuth failed";
    const errorPayload = `authorization:github:error:${JSON.stringify({
      error: errorMessage,
      provider: "github",
    })}`;
    const targetOrigin = "*";
    const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body>
    <pre style="white-space: pre-wrap; font: 13px/1.5 monospace; color: #b00020;">
OAuth error: ${errorMessage}
You can close this window and retry login.
    </pre>
    <script>
      (function () {
        var message = ${JSON.stringify(errorPayload)};
        var targetOrigin = ${JSON.stringify(targetOrigin)};
        if (window.opener) {
          window.opener.postMessage(message, targetOrigin);
        }
      })();
    </script>
  </body>
</html>`;
    return new NextResponse(html, {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const message = `authorization:github:success:${JSON.stringify({
    token: tokenPayload.access_token,
    provider: "github",
  })}`;

  const targetOrigin = "*";

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        var targetOrigin = ${JSON.stringify(targetOrigin)};
        if (window.opener) {
          window.opener.postMessage(message, targetOrigin);
        }
        setTimeout(function () {
          window.close();
        }, 200);
      })();
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
