import styles from "./case-hero.module.css";

type CaseHeroProps = {
  title: string;
  subtitle: string;
};

export default function CaseHero({ title, subtitle }: CaseHeroProps) {
  return (
    <section className={styles.hero}>
      <p className={styles.kicker}>Case study</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </section>
  );
}
