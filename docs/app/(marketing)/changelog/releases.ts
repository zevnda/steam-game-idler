// Shared by /changelog (page.tsx) and its RSS feed (rss.xml/route.ts), so both list releases in
// the same order.

interface Release {
  version: string
  date: Date
}

/** Newest first: by date, then by version for releases shipped the same day (6.2.14 > 6.2.13). */
export function compareReleases(a: Release, b: Release) {
  if (b.date.getTime() !== a.date.getTime()) return b.date.getTime() - a.date.getTime()
  const [ma, mi, pa] = a.version.split('.').map(Number)
  const [mb, miB, paB] = b.version.split('.').map(Number)
  if (mb !== ma) return mb - ma
  if (miB !== mi) return miB - mi
  return paB - pa
}

/**
 * Fumadocs' processed markdown keeps each heading's generated id as a trailing `[#id]`
 * ("### Fixed 🐛 [#fixed-]") - not something a reader or the search box should see.
 */
export function stripHeadingIds(markdown: string) {
  return markdown.replace(/\s*\[#[^\]]*\]\s*$/gm, '')
}
