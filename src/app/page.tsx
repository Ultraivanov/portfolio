import CaseList from "@/components/case-list/CaseList";
import Cover from "@/components/cover/Cover";
import Hero from "@/components/hero/Hero";
import IntroColumns from "@/components/hero/IntroColumns";
import ValueProps from "@/components/value-props/ValueProps";
import { cover } from "@/lib/content/cover";
import { hero } from "@/lib/content/hero";
import { intro } from "@/lib/content/intro";
import { pastProjects } from "@/lib/content/pastProjects";
import { valueProps } from "@/lib/content/valueProps";

export default function Home() {
  return (
    <section>
      <Hero data={hero} />
      <IntroColumns data={intro} />
      <Cover data={cover} />
      <ValueProps items={valueProps} />
      <CaseList data={pastProjects} />
      <div id="work" />
      <div id="contact" />
    </section>
  );
}
