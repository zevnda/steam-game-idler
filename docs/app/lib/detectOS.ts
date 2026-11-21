export type DetectedOS = 'windows' | 'linux' | 'macos' | null

/**
 * Best-effort client-side OS sniff, used only to pick which platform's download CTA to show
 * first. Never gates functionality - `navigator.userAgent` is spoofable/reducible (and Android
 * UAs also contain "Linux", iOS UAs "Mac OS X", and Intel Macs can't be told apart from Apple
 * Silicon ones, which is the only Mac build), so this is deliberately conservative and a manual override is always
 * offered right next to whatever this picks. Returns `null` when undetermined (SSR, or an
 * unrecognized/non-desktop UA) so callers can fall back to the existing default instead of
 * guessing.
 */
export function detectOS() {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/android|iphone|ipad|ipod/i.test(ua)) return null
  if (/linux/i.test(ua)) return 'linux'
  if (/windows/i.test(ua)) return 'windows'
  // iPadOS Safari reports a Mac user agent by default; real Macs have no multi-touch screen.
  if (/macintosh|mac os x/i.test(ua)) return navigator.maxTouchPoints > 1 ? null : 'macos'
  return null
}
