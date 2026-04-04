import Link from "next/link";
import type { PastProjects } from "@/content/home";
import styles from "./case-list.module.css";

type CaseListProps = {
  data: PastProjects;
};

export default function CaseList({ data }: CaseListProps) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>{data.label}</div>
      <div className={styles.list}>
        {data.items.map((item) => (
          <div key={`${item.title}-${item.year}`} className={styles.rowWrap}>
            {item.href || item.caseSlug ? (
              <Link
                className={styles.row}
                href={item.href ?? `/work/${item.caseSlug}`}
              >
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.meta}>{item.detail}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.meta}>{item.year}</span>
                </span>
                <span className={styles.icon} aria-hidden="true" />
              </Link>
            ) : (
              <div className={styles.row} aria-disabled="true">
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.meta}>{item.detail}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.meta}>{item.year}</span>
                </span>
                <span className={styles.icon} aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
