/** @type {import('next').NextConfig} */
const nextConfig = {
  // perf-optimize
  compress: true,
  poweredByHeader: false,
  experimental: { optimizePackageImports: ["framer-motion"] }, // perf-optimize-2
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};
export default nextConfig;
