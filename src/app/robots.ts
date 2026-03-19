import { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/open-app",
          "/rules",
          "/dashboard",
          "/payroll",
          "/billing",
          "/compliance",
        ],
      },
    ],
    sitemap: `${CANONICAL_SITE_URL}/sitemap.xml`,
  };
}
