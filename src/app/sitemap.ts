import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lekkerledger.co.za';

  // Base marketing pages
  const routes = [
    '',
    '/pricing',
    '/calculator',
    '/resources',
    '/resources/guides',
    '/resources/templates',
    '/resources/tools',
    '/resources/checklists',
    '/resources/tools/domestic-worker-payslip',
    '/resources/guides/uif-for-domestic-workers',
    '/resources/templates/domestic-worker-contract',
    '/resources/guides/domestic-worker-minimum-wage-2026',
    '/resources/guides/4-hour-minimum-pay-rule',
    '/resources/checklists/household-employer-monthly',
    '/resources/guides/ccma-and-disciplinary-procedures',
    '/resources/guides/coida-and-roe-compliance',
    '/ufiling-errors',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Application routes (dashboard, payroll, etc.) are explicitly EXCLUDED
  // from this sitemap and should have noindex tags.

  return routes;
}
