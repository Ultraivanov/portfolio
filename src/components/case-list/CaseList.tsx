import Link from "next/link";
import type { PastProjects } from "@/content/home";
import styles from "./case-list.module.css";

type CaseListProps = {
  data: PastProjects;
};

export default function CaseList({ data }: CaseListProps) {
  const maxItems =
    typeof data.maxItems === "number" && data.maxItems > 0
      ? Math.min(data.maxItems, data.items.length)
      : data.items.length;

  const items = data.items.slice(0, maxItems);

  return (
    <section className={styles.section}>
      <div className={styles.label}>{data.label}</div>
      <div className={styles.list}>
        {items.map((item) => (
          <div key={`${item.title}-${item.year}`} className={styles.rowWrap}>
            {item.href || item.caseSlug ? (
              <Link
                className={styles.row}
                href={item.href ?? `/work/${item.caseSlug}`}
              >
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  {item.subtitle ? (
                    <>
                      <span className={styles.separator}>•</span>
                      <span className={styles.meta}>{item.subtitle}</span>
                    </>
                  ) : null}
                </span>
                <span className={styles.icon} aria-hidden="true" />
              </Link>
            ) : (
              <div className={styles.row} aria-disabled="true">
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  {item.subtitle ? (
                    <>
                      <span className={styles.separator}>•</span>
                      <span className={styles.meta}>{item.subtitle}</span>
                    </>
                  ) : null}
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
