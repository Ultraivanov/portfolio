import type { Metadata } from "next";

export const SITE_URL = "https://ginzburg.work";
export const SITE_NAME = "Dima Ginzburg";

export const DEFAULT_TITLE = "Dima Ginzburg — Product Designer";
export const DEFAULT_DESCRIPTION =
  "I turn messy product problems into clear structure, usable flows, and credible interfaces.";

export const DEFAULT_OG_IMAGE = "/og-whatsapp.png";
export const DEFAULT_TWITTER_IMAGE = "/og.png";
export const DEFAULT_PREVIEW_ALT = "Dima Ginzburg portfolio preview";

export const SAME_AS_LINKS = [
  "https://www.linkedin.com/in/dmitry-ginzburg-profit/",
  "https://github.com/Ultraivanov",
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

type PageType = "website" | "article" | "profile";

type BuildPageMetadataArgs = {
  title: string;
  description: string;
  path: string;
  type?: PageType;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  twitterImage?: string;
};

export const buildPageMetadata = ({
  title,
  description,
  path,
  type = "website",
  keywords,
  ogImage,
  ogImageAlt,
  twitterImage,
}: BuildPageMetadataArgs): Metadata => {
  const openGraphImage = ogImage ?? DEFAULT_OG_IMAGE;
  const twitterPreview = twitterImage ?? (ogImage ? ogImage : DEFAULT_TWITTER_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      images: [{ url: openGraphImage, alt: ogImageAlt ?? DEFAULT_PREVIEW_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterPreview],
    },
  };
};
