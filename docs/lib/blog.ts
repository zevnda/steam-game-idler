import type { InferPageType } from 'fumadocs-core/source'
import { blog } from '@/lib/source'

export const SITE_URL = 'https://steamgameidler.com'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export type BlogPost = InferPageType<typeof blog>

interface Author {
  name: string
  url: string
  bio: string
}

// Keyed by frontmatter `author`. Kept to real, verifiable identities: the `url` is what the
// BlogPosting JSON-LD's `author.url` points at, so it must be a page that is actually that person.
export const AUTHORS: Record<string, Author> = {
  zevnda: {
    name: 'zevnda',
    url: 'https://github.com/zevnda',
    bio: 'Creator and maintainer of Steam Game Idler.',
  },
}

export function getAuthor(key: string) {
  return AUTHORS[key] ?? AUTHORS.zevnda
}

/**
 * Posts that are public in this build, newest first. Drafts only show up under `next dev`, so a
 * half-written post can be previewed locally without ever reaching the static export, the RSS feed
 * or the sitemap.
 */
export function getPublishedPosts() {
  const includeDrafts = process.env.NODE_ENV === 'development'

  return blog
    .getPages()
    .filter(post => includeDrafts || !post.data.draft)
    .sort(
      (a, b) => b.data.date.localeCompare(a.data.date) || a.data.title.localeCompare(b.data.title),
    )
}

export function getPost(slug: string) {
  const post = blog.getPage([slug])
  if (!post) return undefined
  if (post.data.draft && process.env.NODE_ENV !== 'development') return undefined
  return post
}

/** The post's own slug, e.g. `steam-achievement-sets` for `blog/steam-achievement-sets.mdx`. */
export function getSlug(post: BlogPost) {
  return post.slugs[0]
}

export function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

export function getPostImage(post: BlogPost) {
  return post.data.image ? absoluteUrl(post.data.image) : DEFAULT_OG_IMAGE
}

/** Reading time from the processed markdown, at ~230 words per minute. */
export async function getReadingTime(post: BlogPost) {
  const text = await post.data.getText('processed')
  const words = text.split(/\s+/).filter(Boolean).length
  return { minutes: Math.max(1, Math.round(words / 230)), words }
}

// Formatted in UTC: the dates are calendar dates (`2026-10-20`), and `new Date('2026-10-20')` is
// UTC midnight, which a local-time format would show as the previous day west of UTC.
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Up to `count` other posts, ranked by shared tags, then same category, then recency. Used for the
 * "Keep reading" block, which is also the blog's main internal-linking surface between posts.
 */
export function getRelatedPosts(post: BlogPost, count = 3) {
  const tags = new Set(post.data.tags)

  return getPublishedPosts()
    .filter(other => other.url !== post.url)
    .map(other => ({
      other,
      score:
        other.data.tags.filter(tag => tags.has(tag)).length * 2 +
        (other.data.category === post.data.category ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ other }) => other)
}
