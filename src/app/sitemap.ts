import type { MetadataRoute } from "next";
import { cases } from "@/content/cases";
import { PUBLIC_STATIC_ROUTES, toAbsoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map((route) => ({
    url: toAbsoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/work" ? 0.9 : 0.7,
  }));

  const caseEntries: MetadataRoute.Sitemap = cases.map((item) => ({
    url: toAbsoluteUrl(`/work/${item.slug}`),
    lastModified: new Date(`${item.lastUpdated}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...caseEntries];
}
