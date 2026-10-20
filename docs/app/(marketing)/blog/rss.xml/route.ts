import { absoluteUrl, getAuthor, getPublishedPosts, SITE_URL } from '@/lib/blog'

// Built once into the static export as `out/blog/rss.xml`.
export const revalidate = false

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * RSS 2.0 feed of published posts (summaries only, linking back to the site). Feed readers and
 * aggregators are a steady source of discovery and links for a niche blog, and the feed gives
 * crawlers a second, always-fresh list of post URLs next to the sitemap.
 */
export function GET() {
  const posts = getPublishedPosts()

  const items = posts
    .map(post => {
      const url = absoluteUrl(post.url)
      const author = getAuthor(post.data.author)
      const categories = [post.data.category, ...post.data.tags]
        .map(c => `      <category>${escapeXml(c)}</category>`)
        .join('\n')

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${new Date(post.data.date).toUTCString()}</pubDate>
      <dc:creator>${escapeXml(author.name)}</dc:creator>
${categories}
    </item>`
    })
    .join('\n')

  const lastBuild = posts[0] ? new Date(posts[0].data.updated ?? posts[0].data.date) : new Date()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Steam Game Idler Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Steam news explained and in-depth guides from the team behind Steam Game Idler.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>Steam Game Idler Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
${items}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
