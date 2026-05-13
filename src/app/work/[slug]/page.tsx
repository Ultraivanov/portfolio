import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CaseHero from "@/components/case/CaseHero";
import CaseCover from "@/components/case/CaseCover";
import CaseFacts from "@/components/case/CaseFacts";
import CaseMedia from "@/components/case/CaseMedia";
import CaseSection from "@/components/case/CaseSection";
import { cases, getCaseBySlug } from "@/content/cases";
import { buildPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

type CasePageProps = {
  params: Promise<{ slug: string }>;
};

const formatUpdatedDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

export async function generateMetadata({ params }: CasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);

  if (!caseStudy) {
    return {
      title: `Case Not Found — ${SITE_NAME}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${caseStudy.title} — ${SITE_NAME}`;
  const description = caseStudy.subtitle;
  const casePath = `/work/${caseStudy.slug}`;

  const metadata = buildPageMetadata({
    title,
    description,
    type: "article",
    path: casePath,
    ogImage: caseStudy.coverSrc,
    ogImageAlt: caseStudy.coverAlt,
    keywords: ["product case study", caseStudy.title.toLowerCase()],
  });

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      type: "article",
      authors: [caseStudy.author],
      modifiedTime: new Date(`${caseStudy.lastUpdated}T00:00:00Z`).toISOString(),
    },
    alternates: {
      canonical: casePath,
    },
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  const caseStudy = getCaseBySlug(slug);
  if (!caseStudy) {
    notFound();
  }

  const caseJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: caseStudy.title,
    description: caseStudy.subtitle,
    url: `${SITE_URL}/work/${caseStudy.slug}`,
    image: `${SITE_URL}${caseStudy.coverSrc}`,
    author: {
      "@type": "Person",
      name: caseStudy.author,
    },
    datePublished: caseStudy.lastUpdated,
    dateModified: caseStudy.lastUpdated,
    inLanguage: "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseJsonLd) }}
      />
      <article>
        <CaseHero
          title={caseStudy.title}
          subtitle={caseStudy.subtitle}
          author={caseStudy.author}
          updatedLabel={formatUpdatedDate(caseStudy.lastUpdated)}
        />
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
                    const paragraphs = normalized.text
                      .split(/\n\n+/)
                      .filter((s: string) => s.trim());
                    return paragraphs.map((para: string, pIdx: number) => (
                      <p key={`${normalized.type}-${index}-${pIdx}`}>
                        {para.split("\n").map((line: string, lIdx: number, arr: string[]) => (
                          <span key={lIdx}>
                            {line}
                            {lIdx < arr.length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    ));
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
                      />
                    );
                  }
                  return null;
                })
              : null}
          </CaseSection>
        ))}
      </article>
    </>
  );
}

export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}
