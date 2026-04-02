import Container from "./Container";
import styles from "./layout.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerInner}>
        <div className={styles.footerMeta}>Product Designer</div>
        <div className={styles.footerMeta}>Based in Tel Aviv</div>
        <div className={styles.footerLinks}>
          <a className={styles.footerLink} href="/privacy">
            Privacy Policy
          </a>
          <a className={styles.footerLink} href="/terms">
            Terms of Use
          </a>
        </div>
      </Container>
    </footer>
  );
}
