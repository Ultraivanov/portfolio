import Image from "next/image";
import Container from "./Container";
import styles from "./layout.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerInner}>
        <p className={styles.footerMeta}>Based in Tel Aviv</p>
        <a className={styles.footerLink} href="/privacy">
          Privacy Policy
        </a>
        <a className={styles.footerLink} href="/terms">
          Terms of Use
        </a>
      </Container>
    </footer>
  );
}
