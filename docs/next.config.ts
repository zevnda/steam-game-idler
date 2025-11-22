import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
export default withMDX({
  output: 'export',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
})
