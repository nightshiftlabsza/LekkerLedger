import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev, // Disable SW build in dev — prevents file-lock crashes on Windows
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.filter((entry) => entry.url !== "/sample-payslip.pdf"),
      warnings: [],
    }),
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {},
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/sign-in',
        destination: '/dashboard',
        permanent: false, // Temporary until real auth happens if ever
      },
      {
        source: '/login',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/auth/login',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default withSerwist(nextConfig);
