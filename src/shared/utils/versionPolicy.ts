import { logFrontendWarn } from '@/shared/utils/frontendLogging'

// Remote version policy - lets an already-shipped build be retired without a new release reaching
// it first. `version-policy.json` (repo root) is hand-edited, never CI-regenerated, and kept
// separate from `latest.json` on purpose: `release.yml` rewrites `latest.json` on every release
// (a hand-added field there would be wiped), and `latest.json` is the one file the updater must
// never be broken by.
//   - `recommendedVersion`: anything older gets a dismissible "update soon" nag.
//   - `minimumVersion`: anything older is hard-blocked - only the update/quit dialog renders.
// Only builds that ship this check honor it - older releases ignore the file entirely.
export interface VersionPolicy {
  recommendedVersion: string | null
  minimumVersion: string | null
}

export type VersionPolicyStatus = 'supported' | 'outdated' | 'unsupported'

const VERSION_POLICY_URL =
  'https://raw.githubusercontent.com/zevnda/steam-game-idler/main/version-policy.json'

// Last successfully fetched policy, so a block still applies on a launch where the fetch fails
// (offline, GitHub unreachable) - the version is still just as unsupported as it was last time.
const CACHE_KEY = 'versionPolicy'

// Dev-only manual-testing hook: create `public/version-policy.dev.json` (same shape as the real
// file, git-ignored) to exercise the nag/block dialogs. It's a separate file on purpose - the real
// `version-policy.json` on `main` is live for every user, so testing by editing it risks
// committing a block. Served by the Next dev server; `process.env.NODE_ENV` is inlined at build
// time, so production builds never request it. Delete the file to go back to the live policy.
const DEV_POLICY_PATH = '/version-policy.dev.json'

// Returns the dev test policy if the file exists, otherwise null so the live fetch runs. Never
// cached - a test policy must not outlive the file.
async function readDevPolicy() {
  try {
    const res = await fetch(DEV_POLICY_PATH, { cache: 'no-store' })
    return res.ok ? parsePolicy(await res.json()) : null
  } catch {
    return null
  }
}

function parseVersion(version: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim())
  return match ? match.slice(1, 4).map(Number) : null
}

// Negative when `a` is older than `b`. Plain `major.minor.patch` only - this project doesn't ship
// pre-release versions; anything unparseable is rejected earlier by `parsePolicy`.
function compareVersions(a: number[], b: number[]) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

// Each field is validated on its own and dropped (treated as "no requirement") if malformed, so a
// typo in the hand-edited file fails open instead of locking every user out.
function parsePolicy(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  const field = (key: string) => {
    const value = record[key]
    return typeof value === 'string' && parseVersion(value) ? value.trim() : null
  }
  const policy: VersionPolicy = {
    recommendedVersion: field('recommendedVersion'),
    minimumVersion: field('minimumVersion'),
  }
  return policy
}

export function readCachedVersionPolicy() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? parsePolicy(JSON.parse(cached)) : null
  } catch {
    return null
  }
}

// Returns null on any failure (timeout, network, bad JSON) - callers decide what "unknown" means.
export async function fetchVersionPolicy(timeoutMs: number) {
  if (process.env.NODE_ENV === 'development') {
    const devPolicy = await readDevPolicy()
    if (devPolicy) return devPolicy
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(VERSION_POLICY_URL, { cache: 'no-store', signal: controller.signal })
    if (!res.ok) throw new Error(`version-policy.json responded with status ${res.status}`)
    const policy = parsePolicy(await res.json())
    if (!policy) throw new Error('version-policy.json was not a JSON object')
    localStorage.setItem(CACHE_KEY, JSON.stringify(policy))
    return policy
  } catch (error) {
    logFrontendWarn('versionPolicy', 'version policy fetch failed', { error: String(error) })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export function evaluateVersionPolicy(policy: VersionPolicy | null, currentVersion: string) {
  const supported: VersionPolicyStatus = 'supported'
  const current = parseVersion(currentVersion)
  if (!policy || !current) return supported

  const isOlderThan = (required: string | null) => {
    const parsed = required ? parseVersion(required) : null
    return parsed ? compareVersions(current, parsed) < 0 : false
  }

  if (isOlderThan(policy.minimumVersion)) return 'unsupported' as const
  if (isOlderThan(policy.recommendedVersion)) return 'outdated' as const
  return supported
}
