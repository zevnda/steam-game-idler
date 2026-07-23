export type DetectedOS = 'windows' | 'linux' | null

/**
 * Best-effort client-side OS sniff, used only to pick which platform's download CTA to show
 * first. Never gates functionality - `navigator.userAgent` is spoofable/reducible (and Android
 * UAs also contain "Linux"), so this is deliberately conservative and a manual override is always
 * offered right next to whatever this picks. Returns `null` when undetermined (SSR, or an
 * unrecognized/non-desktop UA) so callers can fall back to the existing default instead of
 * guessing.
 */
export function detectOS() {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return null
  if (/linux/i.test(ua)) return 'linux'
  if (/windows/i.test(ua)) return 'windows'
  return null
}
