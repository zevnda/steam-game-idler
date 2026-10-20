#!/usr/bin/env node
/**
 * IndexNow submitter for steamgameidler.com.
 *
 * IndexNow tells Bing, Yandex, Seznam, Naver and Yep that specific URLs changed, so they recrawl
 * them in minutes instead of whenever they next get around to it. Google does not take part in
 * IndexNow and ignores it entirely - this has no effect on Google rankings either way. Google
 * keeps discovering changes through the sitemap (and manual URL Inspection requests).
 *
 * Only URLs whose source actually changed are submitted: pinging unchanged URLs is the one
 * thing IndexNow participants say to avoid.
 *
 * Usage (from docs/):
 *   node scripts/indexnow.mjs --base <git-ref> --head <git-ref> [--dry-run]
 *       Maps the docs files changed between two commits to their public URLs and submits them.
 *       This is what .github/workflows/docs-deploy.yml's `indexnow` job runs after each production deploy.
 *   node scripts/indexnow.mjs --urls blog/some-post https://steamgameidler.com/docs/faq [--dry-run]
 *       Submits specific paths or full URLs by hand. Write paths without a leading slash (or as
 *       full URLs): Git Bash rewrites a `/blog/...` argument into a Windows path before Node sees it.
 *
 * The key isn't a secret: IndexNow proves site ownership by fetching it from the public file
 * below, so anyone can read it. It was added in #639 - never rename or remove that file, or every
 * submission starts failing with 403.
 */
import { access } from 'node:fs/promises'
import path from 'node:path'
import { changedFiles, isPublicAt, log, POST_FILE, SITE } from './lib/changes.mjs'

const HOST = 'steamgameidler.com'
const KEY = 'a99bafb2fec849c3abfd6d70326b67fa'
const KEY_LOCATION = `${SITE}/${KEY}.txt`
// The shared endpoint forwards each submission to every participating search engine.
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const MARKETING = 'docs/app/(marketing)/'
const DOCS_CONTENT = `${MARKETING}docs/_content/`

async function exists(file) {
  return access(file).then(
    () => true,
    () => false,
  )
}

/**
 * Public URL paths affected by one changed file, or [] when the file has no page of its own.
 * Deliberately conservative: shared components, styles and layouts touch every page, and
 * resubmitting the whole site on every CSS tweak is exactly the noise IndexNow asks sites to avoid.
 */
async function urlsForFile(status, file, base, head) {
  // Blog posts: /blog/{slug}, plus the listing that shows it. A post that was a draft on both
  // sides of the diff was never public, so there's nothing to tell search engines about.
  const post = file.match(POST_FILE)
  if (post) {
    const publicBefore = status !== 'A' && (await isPublicAt(base, file))
    const publicAfter = status !== 'D' && (await isPublicAt(head, file))
    if (!publicBefore && !publicAfter) return []
    return [`/blog/${post[1]}`, '/blog']
  }

  // Docs pages: _content/features/card-farming/index.mdx -> /docs/features/card-farming
  if (file.startsWith(DOCS_CONTENT) && file.endsWith('.mdx')) {
    const slug = file.slice(DOCS_CONTENT.length, -'.mdx'.length).replace(/(^|\/)index$/, '')
    return [slug ? `/docs/${slug}` : '/docs']
  }

  // Changelog entries all render on /changelog (the per-version pages are the desktop app's
  // embedded view, not something to promote in search).
  if (/^docs\/changelogs\/[^/]+\.mdx$/.test(file)) return ['/changelog']

  // Other marketing pages: a file inside a static route's folder maps to that route, e.g.
  // pro/_components/data.ts -> /pro. Route groups like (home) vanish from the URL; anything under
  // a dynamic segment ([slug]) is skipped since one file can't be mapped to its generated URLs.
  if (file.startsWith(MARKETING)) {
    const dirs = path.posix.dirname(file.slice(MARKETING.length)).split('/')
    const routeDirs = []
    for (const dir of dirs) {
      if (dir === '.' || dir.startsWith('_')) break
      if (dir.startsWith('[')) return []
      routeDirs.push(dir)
    }
    const pageFile = `${MARKETING}${routeDirs.join('/')}${routeDirs.length ? '/' : ''}page.tsx`
    if (!(await exists(path.resolve('..', pageFile)))) return []
    const route = routeDirs.filter(dir => !dir.startsWith('(')).join('/')
    // Payment return/cancel pages are noindex - nothing for search engines to recrawl.
    if (/^(paypal|stripe)(\/|$)/.test(route)) return []
    return [`/${route}`]
  }

  return []
}

async function changedUrls(base, head) {
  const urls = new Set()
  for (const { status, file } of await changedFiles(base, head)) {
    for (const url of await urlsForFile(status, file, base, head)) urls.add(url)
  }
  return [...urls]
}

async function submit(paths, dryRun) {
  const urlList = paths.map(p =>
    p.startsWith('http') ? p : `${SITE}${p.startsWith('/') ? '' : '/'}${p}`,
  )
  if (urlList.length === 0) {
    log('indexnow: no public URLs changed, nothing to submit')
    return
  }

  log(`indexnow: ${dryRun ? 'would submit' : 'submitting'} ${urlList.length} URL(s):`)
  for (const url of urlList) log(`  ${url}`)
  if (dryRun) return

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  })

  // 200 = accepted, 202 = accepted while the key is still being validated. Anything else means
  // nothing was submitted (403: key file missing/wrong, 422: URL not on this host, 429: too many).
  if (response.status !== 200 && response.status !== 202) {
    const body = await response.text().catch(() => '')
    throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${body}`.trim())
  }
  log(`indexnow: accepted (HTTP ${response.status})`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const value = flag => {
    const index = args.indexOf(flag)
    return index === -1 ? undefined : args[index + 1]
  }

  if (args.includes('--urls')) {
    const paths = args.slice(args.indexOf('--urls') + 1).filter(arg => !arg.startsWith('--'))
    await submit(paths, dryRun)
    return
  }

  const base = value('--base')
  const head = value('--head') ?? 'HEAD'
  if (!base) {
    console.error('usage: indexnow.mjs --base <ref> [--head <ref>] [--dry-run] | --urls <path...>')
    process.exit(2)
  }
  await submit(await changedUrls(base, head), dryRun)
}

main().catch(error => {
  console.error(`indexnow: ${error.message}`)
  process.exit(1)
})
