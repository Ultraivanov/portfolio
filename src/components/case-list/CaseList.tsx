import type { PastProjects } from "@/lib/content/pastProjects";
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
          <button
            key={`${item.title}-${item.year}`}
            className={styles.row}
            type="button"
            aria-label={`Open ${item.title} case`}
          >
            <span className={styles.text}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.separator}>•</span>
              <span className={styles.meta}>{item.detail}</span>
              <span className={styles.separator}>•</span>
              <span className={styles.meta}>{item.year}</span>
            </span>
            <span className={styles.icon} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
