/**
 * Helpers for post-deploy scripts (currently `indexnow.mjs`): reading files at a git ref, parsing
 * blog frontmatter, and working out what changed between two deploys. Kept separate so any future
 * post-deploy script agrees with IndexNow on what a deploy contained.
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
