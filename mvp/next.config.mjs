/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracing: false,
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
