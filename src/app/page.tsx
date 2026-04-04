import CaseList from "@/components/case-list/CaseList";
import Cover from "@/components/cover/Cover";
import Hero from "@/components/hero/Hero";
import IntroColumns from "@/components/hero/IntroColumns";
import ValueProps from "@/components/value-props/ValueProps";
import { cover } from "@/content/cover";
import { home } from "@/content/home";
import { pastProjects } from "@/content/pastProjects";

export default function Home() {
  return (
    <section>
      <Hero data={home.hero} />
      <IntroColumns data={home.intro} />
      <Cover data={cover} />
      <ValueProps items={home.valueProps} />
      <CaseList data={pastProjects} />
      <div id="work" />
      <div id="contact" />
    </section>
  );
}
