import { getPublishedPosts } from '../../lib/blog'
import { getLLMText, source } from '../../lib/source'

export const revalidate = false

export async function GET() {
  const scan = source.getPages().map(getLLMText)
  const scanned = await Promise.all(scan)

  // Blog posts after the docs, each headed with its title and URL so an answer engine can cite it.
  const posts = await Promise.all(
    getPublishedPosts().map(
      async post =>
        `# ${post.data.title}\n\nURL: https://steamgameidler.com${post.url}\n\n${await post.data.getText('processed')}`,
    ),
  )

  return new Response([...scanned, ...posts].join('\n\n'))
}
