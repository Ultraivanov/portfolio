import { NextResponse } from "next/server";

export const runtime = "nodejs";

const htmlShell = (body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CMS Login</title>
    <style>
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: #0a090b;
        color: #f5f2ee;
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        padding: 32px;
      }
      .card {
        width: 100%;
        max-width: 420px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 24px;
        border-radius: 12px;
        background: #141215;
      }
      h1 {
        font-size: 18px;
        margin: 0 0 16px;
        letter-spacing: 0.02em;
      }
      label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        display: block;
        margin-bottom: 8px;
        color: rgba(245, 242, 238, 0.7);
      }
      input {
        width: 100%;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: transparent;
        color: inherit;
        font-size: 16px;
      }
      button {
        margin-top: 16px;
        width: 100%;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: transparent;
        color: inherit;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        cursor: pointer;
      }
      p {
        margin: 12px 0 0;
        font-size: 13px;
        color: rgba(245, 242, 238, 0.7);
      }
      code {
        display: block;
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        font-size: 12px;
        color: rgba(245, 242, 238, 0.85);
        white-space: pre-wrap;
        word-break: break-word;
      }
      .error {
        margin-top: 12px;
        color: #ff9da6;
      }
    </style>
  </head>
  <body>
    <div class="card">
      ${body}
    </div>
  </body>
</html>`;

export function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "github";
  const body = `
      <h1>CMS Access</h1>
      <form method="post">
        <input type="hidden" name="provider" value="${provider}" />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Continue</button>
      </form>
      <p>Single-user access for content edits.</p>
  `;
  return new NextResponse(htmlShell(body), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const provider =
    String(formData.get("provider") || "") ||
    url.searchParams.get("provider") ||
    "github";

  const expected = process.env.CMS_PASSWORD;
  const token = process.env.CMS_GITHUB_TOKEN;

  if (!expected || !token) {
    return new NextResponse("Missing CMS_PASSWORD or CMS_GITHUB_TOKEN", {
      status: 500,
    });
  }

  if (password !== expected) {
    const body = `
      <h1>CMS Access</h1>
      <form method="post">
        <input type="hidden" name="provider" value="${provider}" />
        <label for="password">Password</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required />
        <button type="submit">Continue</button>
      </form>
      <p class="error">Wrong password. Try again.</p>
    `;
    return new NextResponse(htmlShell(body), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const message = `authorization:${provider}:success:${JSON.stringify({
    token,
    provider,
  })}`;

  const targetOrigin = url.origin;
  const redirectUrl = `${targetOrigin}/admin/#/?cms_token=${encodeURIComponent(
    token,
  )}&provider=${encodeURIComponent(provider)}`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /></head>
  <body>
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a090b; color: #f5f2ee; min-height: 100vh; padding: 32px;">
      <div style="max-width: 520px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 24px; background:#141215;">
        <h1 style="font-size:18px; margin:0 0 12px;">Login completed</h1>
        <p style="margin:0 0 16px; color: rgba(245,242,238,0.7);">If the CMS didn’t switch, click the button below to resend the token.</p>
        <button id="resend" type="button" style="padding:12px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.25); background:transparent; color:inherit; font-size:14px; text-transform:uppercase; letter-spacing:0.12em; cursor:pointer;">Send login to CMS</button>
        <a id="continue" href="${redirectUrl}" style="display:inline-flex;margin-top:12px;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.25);color:#f5f2ee;text-decoration:none;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;">Open CMS directly</a>
        <code>provider: ${provider}\norigin: ${targetOrigin}</code>
      </div>
    </div>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        var targetOrigin = ${JSON.stringify(targetOrigin)};
        var redirectUrl = ${JSON.stringify(redirectUrl)};
        function send() {
          if (window.opener) {
            window.opener.postMessage(message, targetOrigin);
          } else {
            console.warn("CMS login: window.opener is not available.");
          }
        }
        send();
        var btn = document.getElementById("resend");
        if (btn) btn.addEventListener("click", send);
        if (!window.opener) {
          // In the same tab — redirect to admin with token hash.
          setTimeout(function () {
            window.location.href = redirectUrl;
          }, 300);
        }
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
