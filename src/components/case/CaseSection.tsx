import type { ReactNode } from "react";
import styles from "./case-section.module.css";

type CaseSectionProps = {
  title: string;
  children: ReactNode;
};

export default function CaseSection({ title, children }: CaseSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.label}>
        <h2 className={styles.title}>{title}</h2>
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
