import CaseHero from "@/components/case/CaseHero";
import CaseCover from "@/components/case/CaseCover";
import CaseFacts from "@/components/case/CaseFacts";
import CaseMedia from "@/components/case/CaseMedia";
import CaseSection from "@/components/case/CaseSection";
import { cases, getCaseBySlug } from "@/content/cases";
import {
  normalizeBlockContent,
  isParagraphBlock,
  isListBlock,
  isLinkBlock,
  isMediaBlock,
  NormalizedCaseSectionContent,
} from "@/lib/content";

type CasePageProps = {
  params: { slug: string };
};

/**
 * Render a single block based on its type
 */
const renderBlock = (block: NormalizedCaseSectionContent, index: number) => {
  const blockKey = `block-${index}`;

  if (isParagraphBlock(block)) {
    return (
      <p key={blockKey}>{block.text}</p>
    );
  }

  if (isListBlock(block)) {
    return (
      <ul key={blockKey}>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (isLinkBlock(block)) {
    return (
      <a
        key={blockKey}
        className="text-link"
        href={block.href}
        target="_blank"
        rel="noreferrer"
      >
        {block.label}
      </a>
    );
  }

  if (isMediaBlock(block)) {
    return (
      <CaseMedia
        key={blockKey}
        src={block.src}
        alt={block.alt}
        caption={block.caption}
        variant={block.variant}
      />
    );
  }

  return null;
};

export default function CasePage({ params }: CasePageProps) {
  const { slug } = params;
  const caseStudy = getCaseBySlug(slug) ?? cases[0];

  return (
    <article>
      <CaseHero title={caseStudy.title} subtitle={caseStudy.subtitle} />
      <CaseCover src={caseStudy.coverSrc} alt={caseStudy.coverAlt} />
      <CaseFacts items={caseStudy.facts} />
      {caseStudy.sections.map((section) => (
        <CaseSection key={section.title} title={section.title}>
          {section.blocks?.length
            ? section.blocks.map((block, index) => renderBlock(normalizeBlockContent(block), index))
            : null}
        </CaseSection>
      ))}
    </article>
  );
}

export const dynamicParams = true;

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}
