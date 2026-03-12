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
  experimental: {},
  async rewrites() {
    return [
      {
        source: '/__mockup/:path*',
        destination: 'http://localhost:3000/__mockup/:path*',
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/privacy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/privacy-policy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/legal/privacy-policy',
        destination: '/legal/privacy',
        permanent: true,
      },
      {
        source: '/terms',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/terms-of-service',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/legal/terms-of-service',
        destination: '/legal/terms',
        permanent: true,
      },
      {
        source: '/refunds',
        destination: '/legal/refunds',
        permanent: true,
      },
      {
        source: '/refund',
        destination: '/legal/refunds',
        permanent: true,
      },
      {
        source: '/legal/refund',
        destination: '/legal/refunds',
        permanent: true,
      },
      {
        source: '/sign-in',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/signup',
        permanent: true,
      },
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signup',
        destination: '/signup',
        permanent: true,
      },
    ];
  },
};

export default withSerwist(nextConfig);
