/**
 * Parse cookie string into key-value pairs
 */
export const parseCookies = (cookieString: string): Record<string, string> => {
  return cookieString.split("; ").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
};

/**
 * Extract theme from cookies
 */
export const getThemeFromCookies = (
  cookieString: string
): "light" | "dark" | null => {
  const cookies = parseCookies(cookieString);
  const theme = cookies.theme;
  return theme === "light" || theme === "dark" ? theme : null;
};
