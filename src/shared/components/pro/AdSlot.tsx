import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import Image from 'next/image'
import { TierBadge } from '@/shared/components/TierBadge'
import { CDN_BASE_URL } from '@/shared/constants'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSidebarStore } from '@/shared/stores/sidebarStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { openExternalLink } from '@/shared/utils/links'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

interface AdManifest {
  count: number
  links?: Record<string, string>
}

const DEFAULT_HOUSE_AD_COUNT = 15
const ROTATE_INTERVAL_MS = 30 * 1000

// Real `/supported-games/*` slugs the sidebar iframe rotates through to request a Google ad -
// these are dedicated marketing/SEO landing pages (docs/app/(marketing)/supported-games), each
// carrying its own fixed-corner ad unit, kept as a static list rather than derived from the docs
// site's data since the two are separate deployable packages. Add new game slugs here as they
// land in `docs/app/(marketing)/supported-games/_data/games.ts`.
const AD_HOST_GAME_SLUGS = [
  'counter-strike-2',
  'dota-2',
  'team-fortress-2',
  'pubg-battlegrounds',
  'grand-theft-auto-v',
  'rust',
  'garrys-mod',
  'left-4-dead-2',
  'portal-2',
  'terraria',
  'stardew-valley',
  'among-us',
  'valheim',
  'sea-of-thieves',
  'rocket-league',
  'payday-2',
  'cyberpunk-2077',
  'dead-by-daylight',
]

// AdSense's own "ad actually painted" signal - Google's ad iframe posts this straight to
// `window.top` when it renders, which is us (the app is the outermost window, the docs page and
// the Google ad iframe are both nested inside our own iframe below). No custom relay needed.
const GOOGLE_AD_FILL_ORIGIN = 'https://googleads.g.doubleclick.net'

// House-ad slot in the sidebar footer, shown only to free-tier accounts - ported from `main`'s
// AdSlot.tsx. One fixed bug: the "Remove ads" upsell now checks `hasCasualAccess` (matching the
// visibility gate below), not `main`'s `hasGamerAccess` - ad removal is a Casual-tier perk.
// Unlike `main`, this returns null outright for Casual/Gamer accounts instead of a
// permanently mounted `opacity-0` box - there's no reason to reserve sidebar footer space for an
// ad slot a paying account will never see. `.pro-fade-in` (globals.css, shared with GoPro/
// GoProModal) covers the mount transition that opacity-0 previously handled.
// Windows-only reference size (Windows' WebView2/Chromium renders this correctly via `zoom`,
// used only as a same-frame fallback below until the real measurement lands - see `naturalSize`'s
// own comment for why these exact numbers don't need to be exact).
const FALLBACK_NATURAL_SIZE = { width: 318, height: 292 }

export const AdSlot = () => {
  const { t } = useTranslation()
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const collapsed = useSidebarStore(state => state.collapsed)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)
  const scale = collapsed ? 0.16 : 0.75

  const innerRef = useRef<HTMLDivElement>(null)
  // The wrapper's own actual rendered box (border+padding+content, at scale 1) - measured rather
  // than hardcoded so a locale where "Remove ads with" wraps differently still gets a correctly
  // sized reserved footprint (see CLAUDE.md's locale-length-resilience rules). `offsetWidth`/
  // `offsetHeight` (not getBoundingClientRect, which would report the already-transformed size)
  // and a plain ResizeObserver (not react-resize-observer or similar - genuinely this simple)
  // since this only ever needs to react to a real layout-size change (locale text reflow), not to
  // `scale` itself changing, which is handled by the render below multiplying it directly.
  const [naturalSize, setNaturalSize] = useState(FALLBACK_NATURAL_SIZE)
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setNaturalSize({ width: el.offsetWidth, height: el.offsetHeight })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const [manifestCount, setManifestCount] = useState(DEFAULT_HOUSE_AD_COUNT)
  const [manifestLinks, setManifestLinks] = useState<Record<string, string>>({})
  const failedHouseAdsRef = useRef<Set<string>>(new Set())

  const [adFilled, setAdFilled] = useState(false)
  const [gameSlug] = useState(
    () => AD_HOST_GAME_SLUGS[Math.floor(Math.random() * AD_HOST_GAME_SLUGS.length)],
  )

  useEffect(() => {
    const handleAdFillMessage = (event: MessageEvent) => {
      if (event.origin !== GOOGLE_AD_FILL_ORIGIN) return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data?.googMsgType === 'adpnt') {
          setAdFilled(true)
        }
      } catch {
        // ignore malformed payloads
      }
    }

    window.addEventListener('message', handleAdFillMessage)
    return () => window.removeEventListener('message', handleAdFillMessage)
  }, [])

  useEffect(() => {
    fetch(`${CDN_BASE_URL}/ads/manifest.json`)
      .then(res => res.json())
      .then((data: AdManifest) => {
        if (typeof data?.count === 'number' && data.count > 0) {
          setManifestCount(data.count)
        }
        if (data?.links && typeof data.links === 'object') {
          setManifestLinks(data.links)
        }
      })
      .catch(error => console.error('Error in (AdSlot manifest fetch):', error))
  }, [])

  const houseAds = useMemo(
    () => Array.from({ length: manifestCount }, (_, i) => `${CDN_BASE_URL}/ads/${i + 1}.png`),
    [manifestCount],
  )

  const [houseAd, setHouseAd] = useState(
    () => houseAds[Math.floor(Math.random() * houseAds.length)],
  )

  const houseAdLink = useMemo(() => {
    const match = houseAd.match(/\/(\d+)\.png$/)
    if (!match) return undefined
    return manifestLinks[match[1]]
  }, [houseAd, manifestLinks])

  // Ads with a manifest-declared link, used to give linked ads a 50/50 shot at being
  // picked regardless of how outnumbered they are by unlinked ads.
  const linkedHouseAds = useMemo(() => {
    const linked = new Set<string>()
    for (const ad of houseAds) {
      const match = ad.match(/\/(\d+)\.png$/)
      if (match && manifestLinks[match[1]]) linked.add(ad)
    }
    return linked
  }, [houseAds, manifestLinks])

  // Picks a house ad that's different from the current one and hasn't 404'd
  const pickNextHouseAd = useCallback(
    (current: string, excluded: Set<string> = failedHouseAdsRef.current) => {
      const candidates = houseAds.filter(ad => ad !== current && !excluded.has(ad))
      if (candidates.length === 0) return current

      const linked = candidates.filter(ad => linkedHouseAds.has(ad))
      const unlinked = candidates.filter(ad => !linkedHouseAds.has(ad))

      const preferLinked = Math.random() < 0.5
      let pool = preferLinked ? linked : unlinked
      if (pool.length === 0) pool = preferLinked ? unlinked : linked

      return pool[Math.floor(Math.random() * pool.length)]
    },
    [houseAds, linkedHouseAds],
  )

  // A 404/missing image blacklists that ad and rolls to another one immediately.
  const handleHouseAdError = useCallback(() => {
    failedHouseAdsRef.current.add(houseAd)
    setHouseAd(current => pickNextHouseAd(current))
  }, [houseAd, pickNextHouseAd])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHouseAd(current => pickNextHouseAd(current))
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [pickNextHouseAd])

  if (isSubscribed === null || hasCasualAccess(subscriptionTier)) return null

  return (
    // Outer wrapper reserves exactly the post-scale footprint in the sidebar's layout - the inner
    // div below is rendered at its natural (unscaled) size and visually shrunk via `transform`,
    // not `zoom` (see this file's own AdSlot doc comment for why: `zoom` on an ancestor doesn't
    // reliably scale a nested <iframe>'s own rendered content the same way across engines,
    // `transform` does).
    <div
      className='pro-fade-in overflow-hidden'
      style={{ width: naturalSize.width * scale, height: naturalSize.height * scale }}
    >
      <div
        ref={innerRef}
        className='w-fit rounded-lg border border-border p-2 pb-1'
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <div className='relative flex h-62.5 w-75 items-center justify-center overflow-hidden rounded-lg'>
          <iframe
            className='overflow-scroll -mt-87.5 -ml-75 h-150 w-150'
            sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation'
            src={`https://steamgameidler.com/supported-games/${gameSlug}`}
            width='600'
            height='600'
            title='Advertisement'
          />
          {!adFilled && (
            <div
              className={cn(
                'absolute inset-0 z-10 flex items-center justify-center bg-[#121316]',
                houseAdLink && 'cursor-pointer',
              )}
              onClick={() => houseAdLink && openExternalLink(houseAdLink)}
            >
              <Image
                alt='Advertisement'
                className='h-full w-full object-fill'
                height={250}
                src={houseAd}
                width={300}
                onError={handleHouseAdError}
              />
            </div>
          )}
        </div>

        <div
          className='mt-1.5 mb-1 scale-125 cursor-pointer text-center text-xs text-muted duration-150 hover:text-foreground'
          onClick={() => openProModalWithTier('casual')}
        >
          <p className='flex items-center justify-center'>
            {t('dashboard.sidebar.ads.removeAdsWith')}
            <TierBadge className='scale-85' tier='casual' />
          </p>
        </div>
      </div>
    </div>
  )
}
