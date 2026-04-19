import Link from "next/link";
import type { LegalPageContent } from "@/content/legal";
import LegalAccordion from "./LegalAccordion";
import styles from "./legal-page.module.css";

type LegalPageProps = {
  data: LegalPageContent;
};

export default function LegalPage({ data }: LegalPageProps) {
  return (
    <article className={styles.page}>
      <Link className={styles.back} href="/">
        <span className={styles.backIcon} aria-hidden="true" />
        <span className={styles.backLabel}>Menu</span>
      </Link>
      <header className={styles.header}>
        <p className={styles.kicker}>Legal</p>
        <h1 className={styles.title}>{data.title}</h1>
        <p className={styles.updated}>{data.updated}</p>
        <p className={styles.intro}>{data.intro}</p>
      </header>
      <LegalAccordion items={data.items} />
    </article>
  );
}
