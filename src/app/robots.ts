import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const DISALLOWED_PATHS = ["/admin", "/admin/*", "/perf-test"];

const SEARCH_BOTS = ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"] as const;
const USER_FETCH_BOTS = ["ChatGPT-User", "Claude-User"] as const;
const TRAINING_BOTS = ["GPTBot", "ClaudeBot"] as const;

export default function robots(): MetadataRoute.Robots {
  const scopedRules: MetadataRoute.Robots["rules"] = [
    ...SEARCH_BOTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOWED_PATHS,
    })),
    ...USER_FETCH_BOTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOWED_PATHS,
    })),
    ...TRAINING_BOTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow: DISALLOWED_PATHS,
    })),
  ];

  return {
    rules: [
      ...scopedRules,
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
