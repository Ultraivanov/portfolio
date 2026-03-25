import { Button } from "@gravity-ui/uikit";
import type { Hero as HeroData } from "@/lib/content/hero";
import styles from "./hero.module.css";

type HeroProps = {
  data: HeroData;
};

export default function Hero({ data }: HeroProps) {
  return (
    <section className={styles.hero}>
      <p className={styles.role}>{data.role}</p>
      <h1 className={styles.title}>{data.title}</h1>
      <p className={styles.headline}>{data.headline}</p>
      <p className={styles.subhead}>{data.subhead}</p>
      <div className={styles.ctaRow}>
        <Button size="m" view="outlined" className={styles.primary}>
          {data.primaryCTA}
        </Button>
        <Button size="m" view="flat" className={styles.secondary}>
          {data.secondaryCTA}
        </Button>
      </div>
    </section>
  );
}
