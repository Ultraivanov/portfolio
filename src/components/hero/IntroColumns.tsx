import Image from "next/image";
import type { Intro } from "@/lib/content/intro";
import styles from "./intro-columns.module.css";

type IntroColumnsProps = {
  data: Intro;
};

export default function IntroColumns({ data }: IntroColumnsProps) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.identityRow}>
        <div className={styles.avatar}>
          <Image src={data.avatarSrc} alt={data.name} fill sizes="48px" />
        </div>
        <div className={styles.identityText}>
          <a className={styles.name} href="https://www.linkedin.com" target="_blank" rel="noreferrer">
            {data.name}
          </a>
          <p className={styles.role}>{data.role}</p>
        </div>
      </div>
      <div className={styles.columns}>
        {data.highlights.map((item) => (
          <p key={item} className={styles.columnText}>
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
