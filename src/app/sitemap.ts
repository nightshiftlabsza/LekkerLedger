import { MetadataRoute } from "next";
import { CANONICAL_SITE_URL, SITEMAP_LAST_MODIFIED, SITEMAP_PUBLIC_ROUTES } from "@/lib/seo";

const HIGH_PRIORITY_ROUTES = new Set([
  "/",
  "/pricing",
  "/calculator",
  "/uif-calculator",
  "/ufiling-errors",
  "/resources/tools/domestic-worker-payslip",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  return SITEMAP_PUBLIC_ROUTES.map((route) => ({
    url: `${CANONICAL_SITE_URL}${route === "/" ? "" : route}`,
    lastModified: SITEMAP_LAST_MODIFIED,
    changeFrequency: route.startsWith("/resources/") ? "monthly" : "weekly",
    priority: HIGH_PRIORITY_ROUTES.has(route) ? 1 : 0.8,
  }));
}
