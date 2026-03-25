import Container from "./Container";
import styles from "./layout.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Container className={styles.footerInner}>
        <div className={styles.footerMeta}>Product Designer</div>
        <div className={styles.footerMeta}>Based in Tel Aviv</div>
        <div className={styles.footerMeta}>Open to global product teams</div>
      </Container>
    </footer>
  );
}
