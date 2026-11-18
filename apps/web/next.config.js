/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    '@ai-video-studio/shared-types',
    '@ai-video-studio/timeline-engine',
    '@ai-video-studio/video-schema',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;

