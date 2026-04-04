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
        <div className={styles.footerMark}>
          <Image
            src="/home/footer-mark.png"
            alt="Fundrising design"
            width={97}
            height={36}
          />
        </div>
      </Container>
    </footer>
  );
}
