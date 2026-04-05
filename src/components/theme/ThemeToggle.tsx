"use client";

import { Switch } from "@gravity-ui/uikit";
import { usePathname } from "next/navigation";
import { useThemeMode } from "@/components/ClientProviders";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeMode();
  const isDark = theme === "dark";
  const pathname = usePathname();

  if (pathname?.startsWith("/keystatic")) {
    return null;
  }

  return (
    <Switch
      size="s"
      checked={isDark}
      onUpdate={() => undefined}
      aria-disabled="true"
      className={styles.switch}
      aria-label="Theme follows system"
      title="Theme follows system"
    />
  );
}
