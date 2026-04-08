import type { NextConfig } from 'next'

const localNetworkDevOrigins = [
  '127.0.0.1',
  '10.*.*.*',
  '192.168.*.*',
  ...Array.from({ length: 16 }, (_, index) => `172.${index + 16}.*.*`),
]

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  allowedDevOrigins: localNetworkDevOrigins,
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
  transpilePackages: ['geist'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cloudflare.steamstatic.com',
      },
    ],
  },
}

export default nextConfig
