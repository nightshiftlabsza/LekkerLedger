import { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Marketing utility pages
          "/open-app",
          "/rules",
          // Authenticated app routes
          "/dashboard",
          "/payroll",
          "/billing",
          "/compliance",
          "/employees",
          "/upgrade",
          "/settings",
          "/contracts",
          "/documents",
          "/leave",
          "/tools",
          "/ufiling",
          "/wizard",
          "/preview",
          // Auth flows
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${CANONICAL_SITE_URL}/sitemap.xml`,
  };
}
