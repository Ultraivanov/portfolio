import HomePage from "@/components/home/HomePage";
import { cases } from "@/content/cases";
import { home } from "@/content/home";

export default function Home() {
  const featured = home.pastProjects.featuredCases ?? [];
  const caseMap = new Map(cases.map((item) => [item.slug, item]));

  const featuredItems = featured
    .map((slug) => caseMap.get(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      title: item.title,
      subtitle: item.subtitle,
      imageSrc: item.coverSrc,
      imageAlt: item.coverAlt,
      href: `/work/${item.slug}`,
    }));

  const pastProjects =
    featuredItems.length > 0
      ? {
          ...home.pastProjects,
          items: featuredItems,
        }
      : home.pastProjects;

  return (
    <section>
      <HomePage data={{ ...home, pastProjects }} />
      <div id="work" />
      <div id="contact" />
    </section>
  );
}
