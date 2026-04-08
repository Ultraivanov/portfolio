type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

export const trackEvent = (name: string, params?: AnalyticsEventParams) => {
  if (typeof window === "undefined") return;
  const gtag = (window as typeof window & { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (!gtag) return;
  gtag("event", name, params ?? {});
};
