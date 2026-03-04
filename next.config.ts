import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev, // Disable SW build in dev — prevents file-lock crashes on Windows
});

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {},
};

export default withSerwist(nextConfig);
