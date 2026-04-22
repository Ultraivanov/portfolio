import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { cases } from "@/content/cases";
import { home } from "@/content/home";
import {
  buildPageMetadata,
  DEFAULT_KEYWORDS,
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
  ...buildPageMetadata({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: "/",
    keywords: DEFAULT_KEYWORDS,
  }),
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
    description: DEFAULT_DESCRIPTION,
    knowsAbout: DEFAULT_KEYWORDS.slice(1),
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
