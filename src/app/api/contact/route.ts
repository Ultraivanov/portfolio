import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
      return NextResponse.json(
        { error: "Airtable is not configured." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as ContactPayload & {
      captchaToken?: string;
    };
    const { name, email, message, company, page } = payload;
    const captchaToken = payload.captchaToken;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    if (!TURNSTILE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Captcha is not configured." },
        { status: 500 },
      );
    }

    if (!captchaToken) {
      return NextResponse.json(
        { error: "Captcha token missing." },
        { status: 400 },
      );
    }

    const verifyPayload = new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: captchaToken,
      remoteip: request.headers.get("x-forwarded-for") ?? "",
    });

    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: verifyPayload.toString(),
      },
    );

    const verifyResult = (await verifyResponse.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: "Captcha verification failed." },
        { status: 400 },
      );
    }

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
        AIRTABLE_TABLE_NAME,
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
                Name: name,
                Email: email,
                Company: company ?? "",
                Message: message,
                Page: page ?? "",
                SubmittedAt: new Date().toISOString(),
              },
            },
          ],
        }),
      },
    );

    if (!airtableResponse.ok) {
      const details = await airtableResponse.text();
      return NextResponse.json(
        { error: "Failed to store message.", details },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
