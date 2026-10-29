/**
 * GA4 custom events. The tag itself is loaded in the marketing layout (`app/(marketing)/layout.tsx`).
 * Every event and parameter here has a matching custom dimension / key event registered on the GA4
 * property - rename one and the report it feeds silently goes empty, so keep both in sync.
 *
 * Events:
 * - `download_click`        { os, format, version, placement } - a click on a release asset link
 * - `community_click`       { destination, placement }         - a click out to Discord / GitHub
 * - `pro_checkout_start`    { tier, provider }                 - a Stripe/PayPal button on /pro
 * - `pro_checkout_complete` { tier, provider }                 - landing on a checkout return page
 * - `search`                { search_term, results_count }     - a settled docs search query
 *
 * Expect undercounting: ad blockers drop GA for a large share of this audience. Use GitHub's own
 * asset download counts for absolute totals and these events for ratios and attribution.
 */

type EventParams = Record<string, unknown>

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

// gtag.js only reads `arguments` objects off the dataLayer, never plain arrays, so this has to be a
// real `function`. Pushing straight to the dataLayer (instead of calling `window.gtag`) also means
// an event fired before the lazily loaded tag arrives is queued, not dropped.
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

export function trackEvent(name: string, params: EventParams = {}) {
  if (typeof window === 'undefined') return
  gtag('event', name, params)
}

// ------------------------------------------------------------------------------ checkout funnel

// The return pages (/stripe/return, /paypal/return) don't know which tier was bought, so the click
// that started checkout leaves it here for them. Once a return page has counted the purchase it
// marks this tab as done, so a refresh doesn't count it twice; starting a new checkout clears that.
const CHECKOUT_KEY = 'sgi-pending-checkout'
const COUNTED = 'counted'

export type ProTier = 'casual' | 'gamer'
export type CheckoutProvider = 'stripe' | 'paypal'
interface PendingCheckout {
  tier?: ProTier
  provider?: CheckoutProvider
}
const UNKNOWN_CHECKOUT: PendingCheckout = {}

export function rememberCheckout(tier: ProTier, provider: CheckoutProvider) {
  try {
    sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify({ tier, provider }))
  } catch {
    // storage blocked - the completion event just goes out without a tier
  }
}

/**
 * The checkout this tab started, for the completion event - or `null` if this tab already counted
 * it. A buyer who comes back in a different tab/browser gets `{}`: still counted, minus the tier.
 */
export function takeCheckout() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY)
    if (raw === COUNTED) return null
    sessionStorage.setItem(CHECKOUT_KEY, COUNTED)
    return raw ? (JSON.parse(raw) as PendingCheckout) : UNKNOWN_CHECKOUT
  } catch {
    return UNKNOWN_CHECKOUT
  }
}

// ------------------------------------------------------------------------------ release assets

/**
 * What a GitHub release asset URL is, from its file name - e.g.
 * `.../releases/download/6.3.1/Steam.Game.Idler_6.3.1_x64-setup.exe`. Kept URL-based (not passed
 * in by each button) so every download link on the site is covered, including future ones.
 */
export function describeReleaseAsset(href: string) {
  const file = decodeURIComponent(href.split('/').pop() ?? '')
  const version = href.match(/\/releases\/download\/v?([^/]+)\//)?.[1]
  const format = file.endsWith('-setup.exe')
    ? 'installer'
    : file.endsWith('-portable.zip')
      ? 'portable'
      : file.endsWith('.AppImage')
        ? 'appimage'
        : file.endsWith('.deb')
          ? 'deb'
          : file.endsWith('.rpm')
            ? 'rpm'
            : 'other'
  const os = ['installer', 'portable'].includes(format)
    ? 'windows'
    : format === 'other'
      ? 'unknown'
      : 'linux'
  return { os, format, version }
}
