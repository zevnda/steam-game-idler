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
const ROTATE_INTERVAL_MS = 5 * 60 * 1000

// House-ad slot in the sidebar footer, shown only to free-tier accounts - ported from `main`'s
// AdSlot.tsx. One fixed bug: the "Remove ads" upsell now checks `hasCasualAccess` (matching the
// visibility gate below), not `main`'s `hasGamerAccess` - ad removal is a Casual-tier perk.
// Unlike `main`, this returns null outright for Casual/Gamer accounts instead of a
// permanently mounted `opacity-0` box - there's no reason to reserve sidebar footer space for an
// ad slot a paying account will never see. `.pro-fade-in` (globals.css, shared with GoPro/
// GoProModal) covers the mount transition that opacity-0 previously handled.
export const AdSlot = () => {
  const { t } = useTranslation()
  const isSubscribed = useSubscriptionStore(state => state.isSubscribed)
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const collapsed = useSidebarStore(state => state.collapsed)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)

  const [manifestCount, setManifestCount] = useState(DEFAULT_HOUSE_AD_COUNT)
  const [manifestLinks, setManifestLinks] = useState<Record<string, string>>({})
  const failedHouseAdsRef = useRef<Set<string>>(new Set())

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

  // Picks a random house ad that's different from the current one and hasn't 404'd.
  const pickNextHouseAd = useCallback(
    (current: string, excluded: Set<string> = failedHouseAdsRef.current) => {
      const others = houseAds.filter(ad => ad !== current && !excluded.has(ad))
      if (others.length === 0) return current
      return others[Math.floor(Math.random() * others.length)]
    },
    [houseAds],
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
    <div
      className='pro-fade-in rounded-lg border border-border p-2 pb-1'
      style={{ zoom: collapsed ? 0.16 : 0.75 }}
    >
      <div className='relative flex h-62.5 w-75 items-center justify-center overflow-hidden rounded-lg'>
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
  )
}
