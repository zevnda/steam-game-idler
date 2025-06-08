import nextra from 'nextra'

const withNextra = nextra({})

export default withNextra({
  images: {
    remotePatterns: [],
  },
  experimental: {
    turbo: {
      resolveAlias: {
        'next-mdx-import-source-file': './mdx-components.tsx',
      },
    },
  },
})
