import styles from "./case-media.module.css";

type CaseMediaProps = {
  src: string;
  alt: string;
  caption?: string;
  variant?: "phone" | "desktop" | "diagram";
};

const isEmbedSource = (src: string) =>
  src.startsWith("https://www.figma.com/embed") ||
  src.startsWith("https://www.figma.com/proto");

export default function CaseMedia({
  src,
  alt,
  caption,
  variant,
}: CaseMediaProps) {
  const frameClasses = [styles.frame];
  const embedClasses = [styles.embed];

  if (variant === "phone") {
    frameClasses.push(styles.framePhone);
    embedClasses.push(styles.embedPhone);
  }
  if (variant === "desktop") {
    frameClasses.push(styles.frameDesktop);
    embedClasses.push(styles.embedDesktop);
  }
  if (variant === "diagram") {
    frameClasses.push(styles.frameDiagram);
    embedClasses.push(styles.embedDiagram);
  }

  const isEmbed = isEmbedSource(src);

  return (
    <figure className={styles.figure}>
      <div className={frameClasses.join(" ")}>
        {isEmbed ? (
          <div className={embedClasses.join(" ")}>
            <iframe
              title={alt}
              src={src}
              loading="lazy"
              allowFullScreen
            />
          </div>
        ) : (
          <img className={styles.image} src={src} alt={alt} />
        )}
      </div>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
