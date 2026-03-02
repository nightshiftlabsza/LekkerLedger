import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // PWA setup conflicts with Turbopack sometimes, suppressing the hard fail
  experimental: {
    // Allows Serwist to run without completely crashing Next 15 webpack hooks
  },
};

export default withSerwist(nextConfig);
