import Container from "./Container";
import styles from "./layout.module.css";
import { home } from "@/content/home";

export default function Footer() {
  const { cta } = home;
  const primaryLinks = cta.links.filter((link) => !link.muted);
  const legalLinks = cta.links.filter((link) => link.muted);
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
          <div className={styles.footerLinkGroup}>
            {primaryLinks.map((link) => (
              <a key={link.label} className={styles.footerLink} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div className={styles.footerLinkGroup}>
            {legalLinks.map((link) => (
              <a
                key={link.label}
                className={styles.footerLinkMuted}
                href={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
