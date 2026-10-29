'use client'

import { useEffect } from 'react'
import { describeReleaseAsset, trackEvent } from '@/app/lib/analytics'

const RELEASE_ASSET = /github\.com\/zevnda\/steam-game-idler\/releases\/download\//
const RELEASE_PAGE = /github\.com\/zevnda\/steam-game-idler\/releases(\/|$)/
const DISCORD = /(discord\.gg|discord\.com\/invite)\//
const GITHUB = /github\.com\/zevnda(\/|$)/

/**
 * Where on the page a click came from: the nearest `data-analytics-placement` ancestor, else the
 * nearest element with an id (most landing sections have one). Lets GA tell the download page's
 * main button apart from its alternate formats or the previous-versions list.
 */
function placementOf(el: Element) {
  return (
    el.closest('[data-analytics-placement]')?.getAttribute('data-analytics-placement') ??
    el.closest('[id]')?.id ??
    'unknown'
  )
}

/**
 * One delegated listener for every outbound link worth counting - release downloads and the
 * Discord/GitHub community links - instead of an onClick on each button, so a download link added
 * anywhere later (a blog post, a new CTA) is tracked without remembering to wire it up.
 *
 * `auxclick` covers middle-click / open-in-new-tab, which `click` doesn't fire for. Both leave
 * the current page alive, so the event has time to send without delaying the navigation.
 */
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.type === 'auxclick' && e.button !== 1) return
      const link = (e.target as Element | null)?.closest?.('a[href]')
      if (!link) return
      const href = (link as HTMLAnchorElement).href
      const placement = placementOf(link)

      if (RELEASE_ASSET.test(href)) {
        trackEvent('download_click', { ...describeReleaseAsset(href), placement })
      } else if (RELEASE_PAGE.test(href) && link.closest('[data-analytics-placement]')) {
        // the download page's fallback while the asset URLs are still loading (see DownloadHero.tsx)
        trackEvent('download_click', { os: 'unknown', format: 'release_page', placement })
      } else if (DISCORD.test(href)) {
        trackEvent('community_click', { destination: 'discord', placement })
      } else if (GITHUB.test(href)) {
        trackEvent('community_click', { destination: 'github', placement })
      }
    }

    document.addEventListener('click', onClick, { capture: true })
    document.addEventListener('auxclick', onClick, { capture: true })
    return () => {
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('auxclick', onClick, { capture: true })
    }
  }, [])

  return null
}
