import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";
import { featuredCases as featuredCaseStudies } from "@/content/cases";
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
  const orderHint = (home.pastProjects.featuredCases ?? [])
    .map(normalizeFeaturedCaseSlug)
    .filter((slug): slug is string => Boolean(slug));

  const caseMap = new Map(featuredCaseStudies.map((item) => [item.slug, item]));
  const seen = new Set<string>();
  const orderedFromHint = orderHint
    .map((slug) => caseMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => {
      if (!item) return false;
      seen.add(item.slug);
      return true;
    });
  const rest = featuredCaseStudies.filter((item) => !seen.has(item.slug));
  const featuredCases = [...orderedFromHint, ...rest];

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/avatar.png`,
    jobTitle: "AI Product Designer",
    description: DEFAULT_DESCRIPTION,
    knowsAbout: [
      "AI product design",
      "agentic flows",
      "AI systems",
      "interaction models",
      "end-to-end product design",
      "product strategy",
      "UX systems",
      "design systems",
      "prompt prototyping",
      "design automation",
      "agent workflows",
    ],
    hasOccupation: {
      "@type": "Occupation",
      name: "AI Product Designer",
      occupationalCategory: "27-1024.00",
      skills:
        "Product strategy, UX systems, Interaction design, AI-assisted UX, Prompt prototyping, Design automation, Agent workflows, Design systems",
    },
    workLocation: {
      "@type": "Place",
      name: "Tel Aviv, Israel",
    },
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
