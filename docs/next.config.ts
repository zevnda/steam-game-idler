import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createMDX } from 'fumadocs-mdx/next'
import type { NextConfig } from 'next'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const localNetworkDevOrigins = [
  '127.0.0.1',
  '10.*.*.*',
  '192.168.*.*',
  ...Array.from({ length: 16 }, (_, index) => `172.${index + 16}.*.*`),
]

const withMDX = createMDX()

const nextConfig: NextConfig = {
  output: 'export',
  allowedDevOrigins: localNetworkDevOrigins,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(configDir, '..'),
  },
}

export default withMDX(nextConfig)
