import { NextResponse } from "next/server";

export type ApiErrorPayload = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const payload: ApiErrorPayload = {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
  return NextResponse.json(payload, { status });
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200
) {
  return NextResponse.json(
    {
      ok: true,
      ...data,
    },
    { status }
  );
}

export function extractErrorMessage(payload: unknown): string | undefined {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const err = record.error;
    if (typeof err === "object" && err !== null) {
      const message = (err as Record<string, unknown>).message;
      if (typeof message === "string") {
        return message;
      }
    }
  }
  return undefined;
}
