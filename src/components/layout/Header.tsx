import Container from "./Container";
import styles from "./layout.module.css";
import ThemeToggle from "../theme/ThemeToggle";

export default function Header() {
  return (
    <header className={styles.header}>
      <Container className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <a className={styles.headerLogo} href="/" aria-label="Home">
            dg
          </a>
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
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
