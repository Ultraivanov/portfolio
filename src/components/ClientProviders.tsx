"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useRef } from "react";
import { ThemeProvider } from "@gravity-ui/uikit";
import { usePathname } from "next/navigation";
import { jsonPost } from "@/lib/api";
import { getThemeFromCookies } from "@/lib/cookies";

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
  initialTheme?: ThemeMode;
};

/**
 * Get the initial theme from available sources
 */
const getInitialTheme = (initialTheme: ThemeMode): ThemeMode => {
  if (typeof window === "undefined") return initialTheme;

  // Check cookie first
  const themeFromCookie = getThemeFromCookies(document.cookie);
  if (themeFromCookie) return themeFromCookie;

  // Then localStorage
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;

  // Finally, check system preference
  const media = window.matchMedia?.("(prefers-color-scheme: light)");
  return media?.matches ? "light" : "dark";
};

/**
 * Check if theme is set to auto (not explicitly configured)
 */
const isThemeAuto = (): boolean => {
  if (typeof window === "undefined") return true;

  const themeFromCookie = getThemeFromCookies(document.cookie);
  if (themeFromCookie) return false;

  const stored = window.localStorage.getItem("theme");
  return !(stored === "light" || stored === "dark");
};

export default function ClientProviders({ children, initialTheme = "dark" }: ClientProvidersProps) {
  const pathname = usePathname();
  const isKeystatic = pathname?.startsWith("/keystatic");
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme(initialTheme));
  const [isAuto, setIsAuto] = useState(() => {
    if (isKeystatic) return true;
    return isThemeAuto();
  });
  
  // Use a ref to track the last saved theme to avoid infinite loops
  const lastSavedTheme = useRef<ThemeMode | null>(null);

  const saveTheme = async (newTheme: ThemeMode) => {
    if (lastSavedTheme.current === newTheme) return;
    
    window.localStorage.setItem("theme", newTheme);
    try {
      lastSavedTheme.current = newTheme;
      await jsonPost("/api/theme", { theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    // Only save if it's different from what we started with
    if (theme !== initialTheme) {
      saveTheme(theme);
    }

    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const applyTheme = () => {
      if (isAuto) {
        const nextTheme = media?.matches ? "light" : "dark";
        if (nextTheme !== theme) {
          setTheme(nextTheme);
        }
      }
    };

    if (isKeystatic) {
      applyTheme();
    }

    const handler = () => {
      if (isAuto) {
        applyTheme();
      }
    };

    if (media?.addEventListener) {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
    if (media?.addListener) {
      media.addListener(handler);
      return () => media.removeListener(handler);
    }
    return undefined;
  }, [theme, isAuto, isKeystatic, initialTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setIsAuto(false);
        setTheme(next);
        saveTheme(next);
      },
      toggleTheme: () => {
        const next = theme === "dark" ? "light" : "dark";
        setIsAuto(false);
        setTheme(next);
        saveTheme(next);
      },
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
