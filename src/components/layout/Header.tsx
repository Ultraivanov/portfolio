import Container from "./Container";
import styles from "./layout.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <Container className={styles.headerInner}>
        <nav className={styles.nav} aria-label="Primary">
          <a className={styles.navLink} href="/work">
            works
          </a>
          <a
            className={styles.navLink}
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
          >
            linkedin
          </a>
          <a className={styles.navLink} href="/contact">
            connect
          </a>
        </nav>
      </Container>
    </header>
  );
}
