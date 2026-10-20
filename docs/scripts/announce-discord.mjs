#!/usr/bin/env node
/**
 * Announces newly published blog posts in the SGI Discord, via a channel webhook.
 *
 * Run by `.github/workflows/docs-deploy.yml` after each successful production deploy, against
 * the same `--base`/`--head` range as the IndexNow job. A post counts as new when it went public
 * in that range (added, or flipped from draft) - edits to live posts are never re-announced.
 *
 * Message shape (plain Discord markdown, no embeds): one message per post. Only the first message
 * of a batch pings the announcements role, so publishing several posts at once means one ping, not
 * a flood. Discord's own link preview shows the post's cover, title and description underneath -
 * the message itself stays short so it doesn't repeat them.
 *
 * Usage (from docs/):
 *   node scripts/announce-discord.mjs --base <ref> --head <ref> [--dry-run]
 *   node scripts/announce-discord.mjs --slugs steam-achievement-sets,other-post [--dry-run] [--silent]
 *       Announce specific posts as they are in the working tree (manual re-announce or a test).
 *       `--silent` keeps the role mention in the text but tells Discord not to notify anyone -
 *       use it for every test so a test channel never pings the real role.
 *
 * The webhook URL comes from the DISCORD_BLOG_WEBHOOK_URL env var (a repo secret in CI). It is a
 * credential - anyone holding it can post as the webhook - so it's never logged or committed.
 */
import { readFile } from 'node:fs/promises'
import { log, newlyPublishedPosts, parseFrontmatter, SITE } from './lib/changes.mjs'

// The announcements role. `<@&id>` is Discord's role-mention syntax (`<@id>` would be a user).
const ROLE_ID = '1447060276515049572'

// Discord's hard limit for a message's `content`.
const MAX_CONTENT = 2000
const MAX_ATTEMPTS = 6

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** Cuts `text` by `excess` characters plus room for an ellipsis (never below one character). */
function shorten(text, excess) {
  return `${text.slice(0, Math.max(1, text.length - excess - 1)).trimEnd()}…`
}

/**
 * Builds one announcement: the linked title, then the post's `description` (its subtitle) on the
 * next line. If it would exceed Discord's limit, the subtitle is shortened first, then the title -
 * never the URL.
 */
function formatMessage(post, { ping, batchSize }) {
  const header = ping
    ? `<@&${ROLE_ID}> - New on the blog${batchSize > 1 ? ` (${batchSize} posts)` : ''}`
    : null
  // A blank line separates the ping header from the post itself. The title is a masked link
  // (`[text](url)`); Discord still builds its usual link preview (cover, description) from it.
  const build = (title, subtitle) =>
    [header, [`**[${title}](${post.url})**`, subtitle].filter(Boolean).join('\n')]
      .filter(Boolean)
      .join('\n\n')

  // Strip characters that would break the bold/link markdown around the title.
  let title = (post.title ?? post.slug).replace(/[*[\]]/g, '')
  let subtitle = post.description ?? ''
  let content = build(title, subtitle)

  if (content.length > MAX_CONTENT && subtitle) {
    subtitle = shorten(subtitle, content.length - MAX_CONTENT)
    content = build(title, subtitle)
  }
  if (content.length > MAX_CONTENT) {
    title = shorten(title, content.length - MAX_CONTENT)
    content = build(title, subtitle)
  }
  return content
}

/**
 * POSTs one message, honouring Discord's rate limits: on 429 it waits `retry_after`; on 5xx or a
 * network error it backs off exponentially; and it pauses pre-emptively when a response says the
 * bucket is empty. Other 4xx responses (bad or deleted webhook, invalid payload) fail immediately -
 * retrying can't fix them.
 */
async function send(webhookUrl, content, ping) {
  const body = JSON.stringify({
    content,
    // Explicit allow-list: only the first message may ping, and only the announcements role -
    // never @everyone or anything that happens to appear in a title.
    allowed_mentions: ping ? { parse: [], roles: [ROLE_ID] } : { parse: [] },
  })

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response
    try {
      response = await fetch(`${webhookUrl}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw new Error(`network error: ${error.message}`)
      await sleep(1000 * 2 ** (attempt - 1))
      continue
    }

    if (response.ok) {
      if (response.headers.get('x-ratelimit-remaining') === '0') {
        const resetAfter = Number(response.headers.get('x-ratelimit-reset-after') ?? 1)
        await sleep(Math.ceil(resetAfter * 1000) + 250)
      }
      return
    }

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}))
      const retryAfter = Number(data.retry_after ?? response.headers.get('retry-after') ?? 2)
      log(`discord: rate limited, retrying in ${retryAfter}s`)
      await sleep(Math.ceil(retryAfter * 1000) + 250)
      continue
    }

    if (response.status >= 500 && attempt < MAX_ATTEMPTS) {
      await sleep(1000 * 2 ** (attempt - 1))
      continue
    }

    const detail = (await response.text().catch(() => '')).slice(0, 300)
    throw new Error(`Discord rejected the message: HTTP ${response.status} ${detail}`.trim())
  }
  throw new Error(`gave up after ${MAX_ATTEMPTS} attempts`)
}

async function postsForSlugs(slugs) {
  const posts = []
  for (const slug of slugs) {
    const source = await readFile(`blog/${slug}.mdx`, 'utf8').catch(() => null)
    const fields = parseFrontmatter(source)
    if (!fields) throw new Error(`no post at docs/blog/${slug}.mdx`)
    posts.push({ slug, url: `${SITE}/blog/${slug}`, ...fields })
  }
  return posts
}

async function main() {
  const args = process.argv.slice(2)
  const value = flag => {
    const index = args.indexOf(flag)
    return index === -1 ? undefined : args[index + 1]
  }
  const dryRun = args.includes('--dry-run')
  const silent = args.includes('--silent')

  let posts
  if (value('--slugs')) {
    posts = await postsForSlugs(value('--slugs').split(',').filter(Boolean))
  } else if (value('--base')) {
    posts = await newlyPublishedPosts(value('--base'), value('--head') ?? 'HEAD')
  } else {
    process.stderr.write(
      'usage: announce-discord.mjs --base <ref> [--head <ref>] | --slugs a,b [--dry-run] [--silent]\n',
    )
    process.exit(2)
  }

  if (posts.length === 0) {
    log('discord: no newly published posts, nothing to announce')
    return
  }

  const messages = posts.map((post, i) =>
    formatMessage(post, { ping: i === 0, batchSize: posts.length }),
  )

  if (dryRun) {
    messages.forEach((content, i) =>
      log(`--- message ${i + 1} (${content.length} chars)\n${content}`),
    )
    return
  }

  const webhookUrl = process.env.DISCORD_BLOG_WEBHOOK_URL
  if (!webhookUrl) {
    // Not a failure: forks and local runs have no secret. In CI this surfaces as a warning.
    log('::warning::DISCORD_BLOG_WEBHOOK_URL is not set - skipping the Discord announcement')
    return
  }
  if (!/^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//.test(webhookUrl)) {
    throw new Error('DISCORD_BLOG_WEBHOOK_URL is not a Discord webhook URL')
  }

  // Sequential on purpose: keeps the batch in order and makes the ping land on the first message.
  for (const [i, content] of messages.entries()) {
    // `--silent` sends the same text but with an empty mention allow-list, so nobody is notified.
    await send(webhookUrl, content, i === 0 && !silent)
    log(`discord: announced ${posts[i].url}`)
    if (i < messages.length - 1) await sleep(1000)
  }
}

main().catch(error => {
  process.stderr.write(`discord: ${error.message}\n`)
  process.exit(1)
})
