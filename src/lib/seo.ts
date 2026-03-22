export const CANONICAL_SITE_URL = "https://lekkerledger.co.za";
export const ROOT_METADATA_BASE = new URL(CANONICAL_SITE_URL);
export const SITEMAP_LAST_MODIFIED = new Date("2026-03-22T00:00:00.000Z");

export const INDEXABLE_PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/calculator",
  "/uif-calculator",
  "/trust",
  "/ufiling-errors",
  "/resources",
  "/resources/guides",
  "/resources/guides/4-hour-minimum-pay-rule",
  "/resources/guides/ccma-and-disciplinary-procedures",
  "/resources/guides/coida-and-roe-compliance",
  "/resources/guides/domestic-worker-minimum-wage-2026",
  "/resources/guides/uif-for-domestic-workers",
  "/resources/tools",
  "/resources/tools/domestic-worker-payslip",
  "/resources/checklists",
  "/resources/checklists/household-employer-monthly",
  "/examples",
  "/storage",
  "/support",
  "/onboarding",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refunds",
] as const;

/** Shared OG + Twitter metadata for a page. Spread into the page's metadata export. */
export function pageOG(title: string, description: string, path: string) {
  return {
    openGraph: {
      title,
      description,
      url: `${CANONICAL_SITE_URL}${path}`,
      siteName: "LekkerLedger",
      locale: "en_ZA",
      type: "website" as const,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "LekkerLedger – Household payroll for South Africa" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}
