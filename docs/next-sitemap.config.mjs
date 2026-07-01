const outDir = process.env.VERCEL ? '/vercel/output/static' : './out'

export default {
  siteUrl: 'https://steamgameidler.com',
  outDir,
  sitemapBaseFileName: 'sitemap',
  changefreq: 'daily',
  priority: 0.5,
  generateIndexSitemap: false,
  generateRobotsTxt: true,
}
