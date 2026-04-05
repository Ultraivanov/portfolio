import Container from "./Container";
import styles from "./layout.module.css";
import { home } from "@/content/home";

export default function Footer() {
  const { cta } = home;
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerCta}>
        <div className={styles.footerCtaMain}>
          <h2 className={styles.footerCtaTitle}>
            <span>{cta.titleLine1}</span>{" "}
            <span className={styles.footerCtaHighlight}>{cta.highlight}</span>{" "}
            <span>{cta.titleLine2}</span>
          </h2>
          <p className={styles.footerCtaDescription}>{cta.description}</p>
        </div>
        <div className={styles.footerLinks}>
          {cta.links.map((link) => (
            <a
              key={link.label}
              className={
                link.muted ? styles.footerLinkMuted : styles.footerLink
              }
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>
      </Container>
    </footer>
  );
}
