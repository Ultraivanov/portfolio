import type { Metadata } from "next";
import Link from "next/link";
import { cases } from "@/content/cases";
import { buildPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import styles from "./work.module.css";

const WORK_TITLE = `Work — ${SITE_NAME}`;
const WORK_DESCRIPTION =
  "Product case studies focused on decisions, tradeoffs, and measurable outcomes.";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: WORK_TITLE,
    description: WORK_DESCRIPTION,
    path: "/work",
    keywords: ["product case studies", "ux case study", "product design outcomes"],
  }),
};

export default function WorkPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: cases.map((caseStudy, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/work/${caseStudy.slug}`,
      name: caseStudy.title,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <article className={styles.page}>
        <header className={styles.header}>
          <p className={styles.kicker}>Work</p>
          <h1 className={styles.title}>Case studies</h1>
          <p className={styles.subhead}>
            Product case studies focused on decisions, tradeoffs, and outcomes — not just screens.
          </p>
        </header>
        <div className={styles.list}>
          {cases.map((caseStudy) => (
            <Link key={caseStudy.slug} className={styles.row} href={`/work/${caseStudy.slug}`}>
              <span className={styles.rowTitle}>{caseStudy.title}</span>
              <span className={styles.rowSubtitle}>{caseStudy.subtitle}</span>
            </Link>
          ))}
        </div>
      </article>
    </>
  );
}
