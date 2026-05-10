import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import styles from "./layout.module.css";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function Header() {
  return (
    <header className={styles.header}>
      <Container className={styles.headerInner}>
        <div className={styles.headerLeft}>
          <Link className={styles.headerLogo} href="/" aria-label="Home">
            <Image
              className={styles.headerLogoImageLight}
              src="/home/logo.svg"
              alt="Dima Ginzburg"
              width={32}
              height={18}
            />
            <Image
              className={styles.headerLogoImageDark}
              src="/home/logo-dark.svg"
              alt="Dima Ginzburg"
              width={32}
              height={18}
            />
          </Link>
          <nav className={styles.nav} aria-label="Primary">
            <Link className={styles.navLink} href="/work">
              works
            </Link>
            <a
              className={styles.navLink}
              href="https://github.com/Ultraivanov"
              target="_blank"
              rel="noreferrer"
            >
              github
            </a>
            <a
              className={styles.navLink}
              href="https://www.linkedin.com/in/dmitry-ginzburg-profit/"
              target="_blank"
              rel="noreferrer"
            >
              linkedin
            </a>
            <a
              className={styles.navLink}
              href="https://x.com/bo1d_design"
              target="_blank"
              rel="noreferrer"
            >
              twitter
            </a>
            <Link className={styles.navLink} href="/contact">
              connect
            </Link>
          </nav>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
