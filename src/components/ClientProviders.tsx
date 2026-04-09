"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@gravity-ui/uikit";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const isKeystatic = pathname?.startsWith("/keystatic");
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    return media?.matches ? "light" : "dark";
  });
  const isAuto = useMemo(() => {
    if (isKeystatic) return true;
    const stored = window.localStorage.getItem("theme");
    return !(stored === "light" || stored === "dark");
  }, [isKeystatic]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const applyTheme = () => {
      if (isAuto) {
        setTheme(media?.matches ? "light" : "dark");
      }
    };

    if (isKeystatic) {
      applyTheme();
    }

    if (media?.addEventListener) {
      const handler = () => {
        if (isAuto) {
          applyTheme();
        }
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    if (media?.addListener) {
      const handler = () => {
        if (isAuto) {
          applyTheme();
        }
      };
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
    return undefined;
  }, [isAuto, isKeystatic]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setIsAuto(false);
        window.localStorage.setItem("theme", next);
        setTheme(next);
      },
      toggleTheme: () =>
        setTheme((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          setIsAuto(false);
          window.localStorage.setItem("theme", next);
          return next;
        }),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
