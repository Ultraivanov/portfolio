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
                const normalized =
                  "discriminant" in block
                    ? ({ type: block.discriminant, ...block.value } as const)
                    : block;
                if (normalized.type === "paragraph" && "text" in normalized) {
                  return (
                    <p key={`${normalized.type}-${index}`}>
                      {normalized.text}
                    </p>
                  );
                }
                if (normalized.type === "list" && "items" in normalized) {
                  return (
                    <ul key={`${normalized.type}-${index}`}>
                      {normalized.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (
                  normalized.type === "link" &&
                  "href" in normalized &&
                  "label" in normalized
                ) {
                  return (
                    <a
                      key={`${normalized.type}-${index}`}
                      className="text-link"
                      href={normalized.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {normalized.label}
                    </a>
                  );
                }
                if (
                  normalized.type === "media" &&
                  "src" in normalized &&
                  "alt" in normalized
                ) {
                  return (
                    <CaseMedia
                      key={`${normalized.type}-${index}`}
                      src={normalized.src}
                      alt={normalized.alt}
                      caption={normalized.caption}
                      variant={
                        "variant" in normalized
                          ? (normalized.variant as "phone" | "desktop" | "diagram" | undefined)
                          : undefined
                      }
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
