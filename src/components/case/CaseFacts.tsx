import styles from "./case-facts.module.css";

type CaseFact = {
  label: string;
  value: string | string[];
  href?: string;
};

type CaseFactsProps = {
  items: CaseFact[];
};

export default function CaseFacts({ items }: CaseFactsProps) {
  return (
    <section className={styles.facts}>
      {items.map((item) => (
        <div key={item.label} className={styles.row}>
          <div className={styles.label}>{item.label}</div>
          <div className={styles.value}>
            {item.href ? (
              <a className={styles.link} href={item.href} target="_blank" rel="noreferrer">
                {item.value}
              </a>
            ) : Array.isArray(item.value) ? (
              item.value.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p>{item.value}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
