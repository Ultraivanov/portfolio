"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@gravity-ui/uikit";

type ThemeMode = "dark" | "light";
type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within ClientProviders");
  }
  return context;
};

type ClientProvidersProps = {
  children: ReactNode;
};

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const preferred = window.matchMedia?.("(prefers-color-scheme: light)")
      .matches
      ? "light"
      : "dark";
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      setTheme(preferred);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () =>
        setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
