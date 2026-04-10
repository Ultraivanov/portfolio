import { NextResponse } from "next/server";
import { formPost } from "@/lib/api";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  message: string;
  page?: string;
};

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Contacts";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

/**
 * Verify Turnstile captcha token
 */
const verifyCaptcha = async (token: string, remoteIp: string) => {
  const verifyPayload = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY!,
    response: token,
    remoteip: remoteIp,
  });

  const result = await formPost<{
    success: boolean;
    "error-codes"?: string[];
  }>(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    verifyPayload
  );

  return result.success;
};

/**
 * Save contact message to Airtable
 */
const saveToAirtable = async (payload: ContactPayload) => {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      AIRTABLE_TABLE_NAME
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: payload.name,
              Email: payload.email,
              Company: payload.company ?? "",
              Message: payload.message,
              Page: payload.page ?? "",
              SubmittedAt: new Date().toISOString(),
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Airtable error: ${details}`);
  }
};

export async function POST(request: Request) {
  try {
    // Validate configuration
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return NextResponse.json(
        { error: "Airtable is not configured." },
        { status: 500 }
      );
    }

    if (!TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Captcha is not configured." },
        { status: 500 }
      );
    }

    // Parse request
    const payload = (await request.json()) as ContactPayload & {
      captchaToken?: string;
    };
    const { name, email, message, company, page, captchaToken } = payload;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Captcha token missing." },
        { status: 400 }
      );
    }

    // Verify captcha
    const remoteIp = request.headers.get("x-forwarded-for") ?? "";
    const isCaptchaValid = await verifyCaptcha(captchaToken, remoteIp);

    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: "Captcha verification failed." },
        { status: 400 }
      );
    }

    // Save to Airtable
    await saveToAirtable({
      name,
      email,
      company,
      message,
      page,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
