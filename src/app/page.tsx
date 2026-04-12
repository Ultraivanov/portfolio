import HomePage from "@/components/home/HomePage";
import { cases } from "@/content/cases";
import { home } from "@/content/home";

// Static generation with 1 hour revalidation
export const revalidate = 3600;
export const dynamic = "force-static";

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

  return (
    <section>
      <HomePage data={home} featuredCases={featuredCases} />
      <div id="work" />
      <div id="contact" />
    </section>
  );
}
