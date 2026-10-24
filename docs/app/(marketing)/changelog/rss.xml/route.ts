import { compareReleases, stripHeadingIds } from '../releases'
import { PathUtils } from 'fumadocs-core/source'
import { SITE_URL } from '@/lib/blog'
import { changelog } from '@/lib/source'

// Built once into the static export as `out/changelog/rss.xml`. A static segment, so it wins over
// the (embed) group's `/changelog/[slug]` for this one path.
export const revalidate = false

// The newest releases only - the full history is on /changelog, and readers poll the whole file
const FEED_SIZE = 30

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * The release notes as feed-reader HTML. Changelog entries only ever use `###` section headings,
 * `-` bullet lists, **bold**, `code` and [links] (the /changelog skill's format), so a tiny
 * converter for that subset is enough - rendering the MDX itself in a route handler would be
 * heavier than the job needs. Anything else passes through as escaped text.
 */
function toHtml(markdown: string) {
  const inline = (text: string) =>
    escapeXml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

  const html: string[] = []
  let inList = false
  for (const raw of markdown.split('\n')) {
    const line = raw.trim()
    const item = line.match(/^[-*]\s+(.*)$/)
    if (item) {
      if (!inList) html.push('<ul>')
      inList = true
      html.push(`<li>${inline(item[1])}</li>`)
      continue
    }
    if (inList) html.push('</ul>')
    inList = false
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    if (heading) html.push(`<h3>${inline(heading[1])}</h3>`)
    else if (line) html.push(`<p>${inline(line)}</p>`)
  }
  if (inList) html.push('</ul>')
  return html.join('')
}

/**
 * RSS 2.0 feed of releases, newest first, each with its full notes. Items link to the release on
 * /changelog (`#version` - its article id), not `/changelog/{version}`: that's the app's noindexed
 * in-app view.
 */
export async function GET() {
  const pages = changelog
    .getPages()
    .map(page => ({
      page,
      version: PathUtils.basename(page.path, PathUtils.extname(page.path)),
      date: new Date(page.data.date),
    }))
    .sort(compareReleases)
    .slice(0, FEED_SIZE)

  const items = await Promise.all(
    pages.map(async ({ page, version, date }) => {
      const url = `${SITE_URL}/changelog#${version}`
      const notes = toHtml(stripHeadingIds(await page.data.getText('processed')))
      const categories = (page.data.tags ?? [])
        .map(tag => `      <category>${escapeXml(tag)}</category>`)
        .join('\n')

      return `    <item>
      <title>Steam Game Idler v${escapeXml(version)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${notes}]]></description>
      <pubDate>${date.toUTCString()}</pubDate>
${categories}
    </item>`
    }),
  )

  const lastBuild = pages[0]?.date ?? new Date()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Steam Game Idler Changelog</title>
    <link>${SITE_URL}/changelog</link>
    <description>What's new, improved and fixed in every Steam Game Idler release.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/changelog/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.png</url>
      <title>Steam Game Idler Changelog</title>
      <link>${SITE_URL}/changelog</link>
    </image>
${items.join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
