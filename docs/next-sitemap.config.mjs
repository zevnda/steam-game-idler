export default {
  siteUrl: 'https://steamgameidler.com',
  outDir: './out',
  sitemapBaseFileName: 'sitemap',
  changefreq: 'daily',
  priority: 0.5,
  generateIndexSitemap: false,
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['/changelog', '/docs.txt', '/index.txt', '/privacy.txt', '/tos.txt'],
      },
    ],
  },
}
