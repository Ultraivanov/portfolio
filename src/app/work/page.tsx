import Link from "next/link";
import { cases } from "@/content/cases";
import styles from "./work.module.css";

export default function WorkPage() {
  return (
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
  );
}
