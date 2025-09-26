/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  transpilePackages: ["@smallcase_defi/safe-passport"],
};

module.exports = nextConfig;
