"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Container from "./Container";
import Footer from "./Footer";
import Header from "./Header";
import styles from "./layout.module.css";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const isKeystatic = pathname?.startsWith("/keystatic");

  if (isKeystatic) {
    return <div className={styles.page}>{children}</div>;
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Container>{children}</Container>
      </main>
      <Footer />
    </div>
  );
}
