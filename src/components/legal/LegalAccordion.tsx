import styles from "./legal-accordion.module.css";
import type { LegalItem } from "@/content/legal";

type LegalAccordionProps = {
  items: LegalItem[];
};

export default function LegalAccordion({ items }: LegalAccordionProps) {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.id} className={styles.item} open={item.open}>
          <summary className={styles.summary}>
            <span className={styles.number}>{item.id}</span>
            <span className={styles.title}>{item.title}</span>
            <span className={styles.icon} aria-hidden="true" />
          </summary>
          <div className={styles.body}>
            {item.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {item.bullets ? (
              <ul>
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
