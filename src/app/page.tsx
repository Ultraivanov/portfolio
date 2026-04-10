import HomePage from "@/components/home/HomePage";
import { cases } from "@/content/cases";
import { home } from "@/content/home";

export default function Home() {
  const featured = home.pastProjects.featuredCases ?? [];
  const caseMap = new Map(cases.map((item) => [item.slug, item]));

  const featuredCases = featured
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
