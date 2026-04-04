import CaseHero from "@/components/case/CaseHero";
import CaseCover from "@/components/case/CaseCover";
import CaseFacts from "@/components/case/CaseFacts";
import CaseMedia from "@/components/case/CaseMedia";
import CaseSection from "@/components/case/CaseSection";
import { cases, getCaseBySlug } from "@/content/cases";

type CasePageProps = {
  params: { slug: string };
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
            ? section.blocks.map((block, index) => {
                if (block.type === "paragraph") {
                  return <p key={`${block.type}-${index}`}>{block.text}</p>;
                }
                if (block.type === "list") {
                  return (
                    <ul key={`${block.type}-${index}`}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "link") {
                  return (
                    <a
                      key={`${block.type}-${index}`}
                      className="text-link"
                      href={block.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {block.label}
                    </a>
                  );
                }
                if (block.type === "media") {
                  return (
                    <CaseMedia
                      key={`${block.type}-${index}`}
                      src={block.src}
                      alt={block.alt}
                      caption={block.caption}
                    />
                  );
                }
                return null;
              })
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
