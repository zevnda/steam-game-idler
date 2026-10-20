import fs from 'node:fs/promises'
import path from 'node:path'

const outDir = process.env.VERCEL ? '/vercel/output/static' : './out'

/**
 * `/blog/{slug}` -> the post's real last-modified date (frontmatter `updated`, else `date`).
 * Every other URL keeps next-sitemap's build-time default, but a post's lastmod should only move
 * when the post actually changes: Google ignores lastmod on sites where it's always "now".
 * Drafts are skipped - they're never exported, so they never reach the sitemap anyway.
 */
async function readBlogDates() {
  const dir = path.resolve('blog')
  const dates = new Map()
  const files = await fs.readdir(dir).catch(() => [])

  for (const file of files) {
    if (!file.endsWith('.mdx')) continue
    const source = await fs.readFile(path.join(dir, file), 'utf8')
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!frontmatter || /^draft:\s*true\b/m.test(frontmatter[1])) continue
    const field = name =>
      frontmatter[1].match(new RegExp(`^${name}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1]
    const lastmod = field('updated') ?? field('date')
    if (lastmod) dates.set(`/blog/${file.replace(/\.mdx$/, '')}`, lastmod)
  }

  // The listing page only changes when a post does.
  const newest = [...dates.values()].sort().at(-1)
  if (newest) dates.set('/blog', newest)

  return dates
}

const blogDates = await readBlogDates()

export default {
  siteUrl: 'https://steamgameidler.com',
  outDir,
  sitemapBaseFileName: 'sitemap',
  changefreq: 'daily',
  priority: 0.5,
  generateIndexSitemap: false,
  generateRobotsTxt: true,
  // `_no-posts` is the [slug] route's placeholder for when every post is a draft (see its page.tsx).
  // Only indexable pages belong in a sitemap. Excluded: non-page outputs (search index, LLM text,
  // web manifest, RSS), the empty-blog placeholder, noindexed payment return pages, and the
  // per-release changelog pages (noindex - the app's in-app view; /changelog has every entry).
  exclude: [
    '/api/*',
    '/llms-full.txt',
    '/manifest.webmanifest',
    '/blog/rss.xml',
    '/blog/_no-posts',
    '/paypal/*',
    '/stripe/*',
    '/changelog/*',
  ],
  transform: async (config, loc) => {
    const lastmod = blogDates.get(loc)

    return {
      loc,
      changefreq: lastmod ? 'monthly' : config.changefreq,
      priority: config.priority,
      lastmod: lastmod
        ? new Date(lastmod).toISOString()
        : config.autoLastmod
          ? new Date().toISOString()
          : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
