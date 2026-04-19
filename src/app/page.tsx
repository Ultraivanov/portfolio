import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { cases } from "@/content/cases";
import { home } from "@/content/home";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SAME_AS_LINKS,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

// Static generation with 1 hour revalidation
export const revalidate = 3600;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

const normalizeFeaturedCaseSlug = (value: string | { slug?: string | null }) =>
  typeof value === "string" ? value : value.slug ?? null;

export default function Home() {
  const featured = home.pastProjects.featuredCases ?? [];
  const caseMap = new Map(cases.map((item) => [item.slug, item]));

  const featuredCases = featured
    .map(normalizeFeaturedCaseSlug)
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => caseMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "Product Designer",
    sameAs: SAME_AS_LINKS,
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <section>
        <HomePage data={home} featuredCases={featuredCases} />
        <div id="work" />
        <div id="contact" />
      </section>
    </>
  );
}
