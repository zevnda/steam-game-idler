/**
 * Shared helpers for the post-deploy scripts (`indexnow.mjs`, `announce-discord.mjs`): reading
 * files at a git ref, parsing blog frontmatter, and working out what changed between two deploys.
 * Both scripts run from `docs/` against the same `--base`/`--head` pair, so keeping this logic in
 * one place means they always agree on what a deploy contained.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const SITE = 'https://steamgameidler.com'

// CLI output goes straight to stdout (the lint config reserves console.* for diagnostics).
export const log = message => process.stdout.write(`${message}\n`)

export const git = async (...args) =>
  (await run('git', args, { maxBuffer: 16 * 1024 * 1024 })).stdout

/** A file's contents at `ref`, or null if it doesn't exist there. */
export async function readAt(ref, file) {
  return git('show', `${ref}:${file}`).catch(() => null)
}

/**
 * The flat `key: value` lines of an MDX file's frontmatter. Deliberately minimal - blog posts
 * only use single-line scalars (see source.config.ts's `posts` schema) plus lists, which are
 * skipped - so this avoids pulling a YAML dependency into a CI script. Quoted values have their
 * quotes removed ('' is YAML's escaped single quote).
 */
export function parseFrontmatter(source) {
  const block = source?.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return null

  const fields = {}
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (!match || match[2] === '') continue
    let value = match[2].trim()
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1).replace(/''/g, "'")
    else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    fields[match[1]] = value
  }
  return fields
}

/** Whether a blog post is public at `ref`: it exists there and isn't `draft: true`. */
export async function isPublicAt(ref, file) {
  const fields = parseFrontmatter(await readAt(ref, file))
  return fields !== null && fields.draft !== 'true'
}

/** `[{ status, file }]` for every file under `docs/` that changed between the two refs. */
export async function changedFiles(base, head) {
  const diff = await git('diff', '--name-status', '--no-renames', base, head, '--', '.')
  return diff
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [status, file] = line.split('\t')
      return { status: status[0], file }
    })
}

export const POST_FILE = /^docs\/blog\/([^/]+)\.mdx$/

/**
 * Posts that became public in this deploy: added already public, or flipped from draft to
 * public. Edits to a post that was already live are not "new" - those get re-crawled (IndexNow)
 * but never re-announced.
 */
export async function newlyPublishedPosts(base, head) {
  const posts = []
  for (const { status, file } of await changedFiles(base, head)) {
    const slug = file.match(POST_FILE)?.[1]
    if (!slug || status === 'D') continue
    if (!(await isPublicAt(head, file))) continue
    if (status !== 'A' && (await isPublicAt(base, file))) continue

    const fields = parseFrontmatter(await readAt(head, file))
    posts.push({ slug, url: `${SITE}/blog/${slug}`, ...fields })
  }
  // Oldest first, so a batch reads in the order it was written.
  return posts.sort(
    (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.slug.localeCompare(b.slug),
  )
}
