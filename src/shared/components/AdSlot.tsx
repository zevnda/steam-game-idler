import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@heroui/react'
import Image from 'next/image'
import { ProBadge } from '@/shared/components'
import { CDN_BASE_URL } from '@/shared/constants'
import { useStateStore, useUserStore } from '@/shared/stores'
import { hasCasualAccess, hasGamerAccess, openExternalLink } from '@/shared/utils'

interface AdManifest {
  count: number
  links?: Record<string, string>
}

export const AdSlot = () => {
  const { t } = useTranslation()
  const isSubscribed = useUserStore(state => state.isSubscribed)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)

  const DEFAULT_HOUSE_AD_COUNT = 15

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
      .catch(() => {
        // ignore and use default count
      })
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

  // Pick a random house ad that's different from the current one and hasn't 404'd
  const pickNextHouseAd = useCallback(
    (current: string, excluded: Set<string> = failedHouseAdsRef.current) => {
      const others = houseAds.filter(ad => ad !== current && !excluded.has(ad))
      if (others.length === 0) return current
      return others[Math.floor(Math.random() * others.length)]
    },
    [houseAds],
  )

  // If a house ad fails to load (404/missing), blacklist it and roll to another one
  const handleHouseAdError = useCallback(() => {
    failedHouseAdsRef.current.add(houseAd)
    setHouseAd(current => pickNextHouseAd(current))
  }, [houseAd, pickNextHouseAd])

  // Rotate to a different house ad every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        setHouseAd(current => pickNextHouseAd(current))
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [pickNextHouseAd])

  return (
    <div
      className={cn(
        'transition-all ease-in-out border border-border p-2 pb-1 rounded-lg',
        isSubscribed === null && 'opacity-0',
        isSubscribed !== null && hasCasualAccess(subscriptionTier) && 'opacity-0',
        isSubscribed !== null && !hasCasualAccess(subscriptionTier) && 'opacity-100',
      )}
      style={{ zoom: sidebarCollapsed ? 0.16 : 0.75 }}
    >
      <div className='relative flex justify-center items-center overflow-hidden rounded-lg w-150 h-150'>
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center bg-[#121316]',
            houseAdLink && 'cursor-pointer pointer-events-auto',
          )}
          onClick={() => houseAdLink && openExternalLink(houseAdLink)}
        >
          <Image
            src={houseAd}
            alt='Advertisement'
            width={300}
            height={250}
            className='w-full h-full object-fill'
            onError={handleHouseAdError}
          />
        </div>
      </div>

      <div
        className='text-xs text-altwhite mb-1 mt-1.5 text-center cursor-pointer hover:text-white duration-150 scale-125 pointer-events-auto'
        onClick={() => {
          if (!hasGamerAccess(subscriptionTier)) {
            setProModalRequiredTier('casual')
            setProModalOpen(true)
          }
        }}
      >
        <p>
          {t('proMode.removeAdsWith')}
          <ProBadge requiredTier='pro' className='scale-85' />
        </p>
      </div>
    </div>
  )
}
