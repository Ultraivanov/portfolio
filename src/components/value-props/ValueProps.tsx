import type { ValueItem } from "@/content/home";
import styles from "./value-props.module.css";

type ValuePropsSectionProps = {
  items: ValueItem[];
};

export default function ValueProps({ items }: ValuePropsSectionProps) {
  return (
    <section className={styles.section} aria-label="Value proposition">
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.title} className={styles.item}>
            <h3 className={styles.title}>{item.title}</h3>
            <p className={styles.description}>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
