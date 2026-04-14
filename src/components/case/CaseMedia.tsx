import styles from "./case-media.module.css";

type CaseMediaProps = {
  src: string;
  alt: string;
  caption?: string;
};

export default function CaseMedia({ src, alt, caption }: CaseMediaProps) {
  return (
    <figure className={`${styles.figure} case-media-figure`}>
      <div className={styles.frame}>
        <img className={styles.image} src={src} alt={alt} />
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </div>
    </figure>
  );
}
