/** @type {import('next').NextConfig} */
const nextConfig = {
  // perf-optimize
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
};
export default nextConfig;
