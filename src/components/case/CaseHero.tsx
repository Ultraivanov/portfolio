import styles from "./case-hero.module.css";

type CaseHeroProps = {
  title: string;
  subtitle: string;
  author: string;
  updatedLabel: string;
};

export default function CaseHero({ title, subtitle, author, updatedLabel }: CaseHeroProps) {
  return (
    <section className={styles.hero}>
      <p className={styles.kicker}>Case study</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <p className={styles.meta}>
        <span>By {author}</span>
        <span className={styles.separator} aria-hidden="true">
          •
        </span>
        <span>Updated {updatedLabel}</span>
      </p>
    </section>
  );
}
