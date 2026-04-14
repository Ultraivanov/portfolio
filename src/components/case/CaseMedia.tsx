import styles from "./case-media.module.css";

type CaseMediaProps = {
  src: string;
  alt: string;
  caption?: string;
};

const isEmbedSource = (src: string) =>
  src.startsWith("https://www.figma.com/embed") ||
  src.startsWith("https://www.figma.com/proto");

export default function CaseMedia({ src, alt, caption }: CaseMediaProps) {
  const isEmbed = isEmbedSource(src);

  return (
    <figure className={`${styles.figure} case-media-figure`}>
      <div className={styles.frame}>
        {isEmbed ? (
          <div className={styles.embed}>
            <iframe title={alt} src={src} loading="lazy" allowFullScreen />
          </div>
        ) : (
          <img className={styles.image} src={src} alt={alt} />
        )}
      </div>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
