import { MetadataRoute } from "next";
import { CANONICAL_SITE_URL, INDEXABLE_PUBLIC_ROUTES, SITEMAP_LAST_MODIFIED } from "@/lib/seo";

const HIGH_PRIORITY_ROUTES = new Set([
  "/",
  "/pricing",
  "/calculator",
  "/resources",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PUBLIC_ROUTES.map((route) => ({
    url: `${CANONICAL_SITE_URL}${route === "/" ? "" : route}`,
    lastModified: SITEMAP_LAST_MODIFIED,
    changeFrequency: route.startsWith("/resources/") ? "monthly" : "weekly",
    priority: HIGH_PRIORITY_ROUTES.has(route) ? 1 : 0.8,
  }));
}
