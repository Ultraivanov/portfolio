import type { MetadataRoute } from "next";
import { cases } from "@/content/cases";
import { SITE_URL } from "@/lib/seo";

const now = new Date();

const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    url: `${SITE_URL}/work`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/contact`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/cv`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/privacy`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    url: `${SITE_URL}/terms`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.2,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const caseRoutes: MetadataRoute.Sitemap = cases.map((caseStudy) => ({
    url: `${SITE_URL}/work/${caseStudy.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...caseRoutes];
}
