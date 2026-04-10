import Image from "next/image";
import styles from "./case-media.module.css";

type CaseMediaProps = {
  src: string;
  alt: string;
  caption?: string;
  variant?: "phone" | "desktop" | "diagram";
};

const isEmbedSource = (src: string) =>
  src.startsWith("https://www.figma.com/embed");

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
          <div className={styles.imageWrapper}>
            <Image 
              className={styles.image} 
              src={src} 
              alt={alt}
              width={2048}
              height={1536}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1160px"
              loading="lazy"
            />
          </div>
        )}
      </div>
      {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}
