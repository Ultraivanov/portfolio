import { notFound } from "next/navigation";
import CaseHero from "@/components/case/CaseHero";
import CaseCover from "@/components/case/CaseCover";
import CaseFacts from "@/components/case/CaseFacts";
import CaseMedia from "@/components/case/CaseMedia";
import CaseSection from "@/components/case/CaseSection";
import { cases, getCaseBySlug } from "@/content/cases";
import type { CaseSectionContent } from "@/content/cases";

type CasePageProps = {
  params: Promise<{ slug: string }>;
};

function renderBlock(block: CaseSectionContent, index: number) {
  switch (block.type) {
    case "paragraph":
      return <p key={index}>{block.text}</p>;
    case "list":
      return (
        <ul key={index}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case "link":
      return (
        <a key={index} className="text-link" href={block.href} target="_blank" rel="noreferrer">
          {block.label}
        </a>
      );
    case "media":
      return (
        <CaseMedia
          key={index}
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          variant={block.variant}
        />
      );
  }
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);

  if (!caseStudy) notFound();

  return (
    <article>
      <CaseHero title={caseStudy.title} subtitle={caseStudy.subtitle} />
      <CaseCover src={caseStudy.coverSrc} alt={caseStudy.coverAlt} />
      <CaseFacts items={caseStudy.facts} />
      {caseStudy.sections.map((section) => (
        <CaseSection key={section.title} title={section.title}>
          {section.blocks.map((block, index) => renderBlock(block, index))}
        </CaseSection>
      ))}
    </article>
  );
}

export const dynamicParams = false;

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}
