import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://ginzburg.work";

export const SITE_NAME = "Dima Ginzburg";
export const DEFAULT_TITLE = "Dima Ginzburg — Product Designer";
export const DEFAULT_DESCRIPTION =
  "I turn messy product problems into clear structure, usable flows, and credible interfaces.";
export const DEFAULT_OG_IMAGE = "/og.png";
export const DEFAULT_PREVIEW_ALT = "Dima Ginzburg portfolio preview";
export const TWITTER_HANDLE = "@bo1d_design";

export const SAME_AS_LINKS = [
  "https://www.linkedin.com/in/dmitry-ginzburg-profit/",
  "https://github.com/Ultraivanov",
  "https://x.com/bo1d_design",
];

export const DEFAULT_KEYWORDS = [
  "product designer",
  "agentic flows",
  "AI systems",
  "interaction models",
  "end-to-end design",
  "product UX",
  "design systems",
];

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

export const SITE_URL = getSiteUrl();

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

type PageType = "website" | "article" | "profile";

type BuildPageMetadataArgs = {
  title: string;
  description: string;
  path: string;
  type?: PageType;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
};

export const buildPageMetadata = ({
  title,
  description,
  path,
  type = "website",
  keywords,
  ogImage,
  ogImageAlt,
}: BuildPageMetadataArgs): Metadata => {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const image = toAbsoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);
  const imageAlt = ogImageAlt ?? DEFAULT_PREVIEW_ALT;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  };
};
