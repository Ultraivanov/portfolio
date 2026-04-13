import { NextResponse } from "next/server";

export type CmsErrorCode =
  | "validation_error"
  | "path_not_allowed"
  | "github_not_configured"
  | "github_conflict"
  | "github_rate_limited"
  | "github_error"
  | "internal_error";

type ErrorPayload = {
  error: string;
  code: CmsErrorCode;
  details?: Record<string, unknown>;
};

export const cmsErrorResponse = (
  status: number,
  code: CmsErrorCode,
  error: string,
  details?: Record<string, unknown>,
) => NextResponse.json<ErrorPayload>({ error, code, details }, { status });
