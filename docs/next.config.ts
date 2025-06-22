import nextra from 'nextra'

const withNextra = nextra({})

export default withNextra({
  async headers() {
    return [
      {
        source: '/sitemap3.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/xml; charset=utf-8',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*',
          },
        ],
      },
    ]
  },
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
