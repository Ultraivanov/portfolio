const DEFAULT_SITE_URL = "https://ginzburg.work";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function normalizeSiteUrl(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw) {
    return DEFAULT_SITE_URL;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return stripTrailingSlash(`${url.protocol}//${url.host}`);
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL);
}

export function toAbsoluteUrl(pathname: string): string {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPathname, getSiteUrl()).toString();
}

export const PUBLIC_STATIC_ROUTES = [
  "/",
  "/work",
  "/contact",
  "/cv",
  "/privacy",
  "/terms",
] as const;
