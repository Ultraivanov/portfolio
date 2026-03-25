import Image from "next/image";
import type { Cover as CoverData } from "@/lib/content/cover";
import styles from "./cover.module.css";

type CoverProps = {
  data: CoverData;
};

export default function Cover({ data }: CoverProps) {
  return (
    <section className={styles.section}>
      <div className={styles.frame}>
        <Image
          src={data.src}
          alt={data.alt}
          width={4096}
          height={2381}
          sizes="(max-width: 768px) 100vw, 1160px"
          className={styles.image}
          priority
        />
      </div>
    </section>
  );
}
