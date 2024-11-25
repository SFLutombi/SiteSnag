/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load these server-only modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        dns: false,
        tls: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['puppeteer', '@puppeteer/browsers'],
};

module.exports = nextConfig;
