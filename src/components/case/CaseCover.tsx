import Image from "next/image";
import styles from "./case-cover.module.css";

type CaseCoverProps = {
  src: string;
  alt: string;
};

export default function CaseCover({ src, alt }: CaseCoverProps) {
  return (
    <section className={styles.section}>
      <div className={styles.frame}>
        <Image
          src={src}
          alt={alt}
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
