import type { MetadataRoute } from "next";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/perf-test"],
    },
    sitemap: toAbsoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
