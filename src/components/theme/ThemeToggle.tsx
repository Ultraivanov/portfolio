"use client";

import { usePathname } from "next/navigation";
import { useThemeMode } from "@/components/ClientProviders";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { toggleTheme } = useThemeMode();
  const pathname = usePathname();

  if (pathname?.startsWith("/keystatic")) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.toggleButton}
      onClick={() => toggleTheme()}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <svg
        className={styles.toggleIcon}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
        <path d="M12 9l4.65-4.65" />
        <path d="M12 14.3l7.37-7.37" />
        <path d="M12 19.6l8.85-8.85" />
      </svg>
    </button>
  );
}
