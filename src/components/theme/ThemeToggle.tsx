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
      onUpdate={(checked) => setTheme(checked ? "dark" : "light")}
      className={styles.switch}
      aria-label="Toggle theme"
      title="Toggle theme"
    />
  );
}
