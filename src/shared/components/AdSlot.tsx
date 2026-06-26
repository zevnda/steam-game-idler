import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { ProBadge } from '@/shared/components'
import { CDN_BASE_URL } from '@/shared/constants'
import { useStateStore, useUserStore } from '@/shared/stores'
import { hasCasualAccess, hasGamerAccess } from '@/shared/utils'

export const AdSlot = () => {
  const { t } = useTranslation()
  const isSubscribed = useUserStore(state => state.isSubscribed)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)
  const setProModalRequiredTier = useStateStore(state => state.setProModalRequiredTier)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const [reloadKey, setReloadKey] = useState(0)
  const [adFilled, setAdFilled] = useState(false)

  const DEFAULT_FALLBACK_AD_COUNT = 15

  const [manifestCount, setManifestCount] = useState(DEFAULT_FALLBACK_AD_COUNT)
  const failedAdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    fetch(`${CDN_BASE_URL}/ads/manifest.json`)
      .then(res => res.json())
      .then(data => {
        if (typeof data?.count === 'number' && data.count > 0) {
          setManifestCount(data.count)
        }
      })
      .catch(() => {
        // ignore and use default count
      })
  }, [])

  const fallbackAds = useMemo(
    () => Array.from({ length: manifestCount }, (_, i) => `${CDN_BASE_URL}/ads/${i + 1}.png`),
    [manifestCount],
  )

  const [fallbackAd, setFallbackAd] = useState(
    () => fallbackAds[Math.floor(Math.random() * fallbackAds.length)],
  )

  // Pick a random fallback ad that's different from the current one and hasn't 404'd
  const pickNextFallback = useCallback(
    (current: string, excluded: Set<string> = failedAdsRef.current) => {
      const others = fallbackAds.filter(ad => ad !== current && !excluded.has(ad))
      if (others.length === 0) return current
      return others[Math.floor(Math.random() * others.length)]
    },
    [fallbackAds],
  )

  // If a fallback ad fails to load (404/missing), blacklist it and roll to another one
  const handleFallbackAdError = useCallback(() => {
    failedAdsRef.current.add(fallbackAd)
    setFallbackAd(current => pickNextFallback(current))
  }, [fallbackAd, pickNextFallback])

  const gameSlugs = useMemo(
    () => [
      'supported-games/scum',
      'supported-games/dayz',
      'supported-games/arma-3',
      'supported-games/miscreated',
      'supported-games/rust',
      'supported-games/counter-strike-2',
      'supported-games/dota-2',
      'supported-games/team-fortress-2',
      'supported-games/grand-theft-auto-v',
      'supported-games/apex-legends',
      'supported-games/destiny-2',
      'supported-games/warframe',
      'supported-games/dead-by-daylight',
      'supported-games/rainbow-six-siege',
      'supported-games/garry-mod',
      'supported-games/left-4-dead-2',
      'supported-games/portal-2',
      'supported-games/half-life-2',
      'supported-games/cyberpunk-2077',
      'supported-games/the-witcher-3',
      'supported-games/skyrim',
      'supported-games/fallout-4',
      'supported-games/terraria',
      'supported-games/stardew-valley',
      'supported-games/among-us',
      'supported-games/valheim',
      'supported-games/sea-of-thieves',
      'supported-games/rocket-league',
      'supported-games/payday-2',
      'supported-games/pubg',
      'supported-games/subnautica',
      'supported-games/no-mans-sky',
      'supported-games/borderlands-3',
      'supported-games/the-forest',
      'supported-games/phasmophobia',
      'supported-games/satisfactory',
      'supported-games/factorio',
      'supported-games/rimworld',
      'supported-games/hades',
      'supported-games/slay-the-spire',
      'supported-games/celeste',
      'supported-games/hollow-knight',
      'supported-games/dark-souls-3',
      'supported-games/elden-ring',
      'supported-games/monster-hunter-world',
      'supported-games/deep-rock-galactic',
      'supported-games/payday-3',
      'supported-games/forza-horizon-5',
      'supported-games/fifa-23',
      'supported-games/nba-2k23',
      'supported-games/madden-nfl-23',
      'supported-games/football-manager-2024',
      'supported-games/civilization-vi',
      'supported-games/total-war-warhammer-3',
      'supported-games/crusader-kings-3',
      'supported-games/euro-truck-simulator-2',
      'supported-games/american-truck-simulator',
      'supported-games/flight-simulator',
      'supported-games/planet-coaster',
      'supported-games/cities-skylines',
      'supported-games/planet-zoo',
      'supported-games/the-sims-4',
      'supported-games/simcity',
      'supported-games/lego-star-wars',
      'supported-games/star-wars-jedi-survivor',
      'supported-games/lego-harry-potter',
      'supported-games/hogwarts-legacy',
      'supported-games/marvels-spider-man',
      'supported-games/batman-arkham-knight',
      'supported-games/red-dead-redemption-2',
      'supported-games/far-cry-6',
      'supported-games/assassins-creed-valhalla',
      'supported-games/watch-dogs-legion',
      'supported-games/ghostrunner',
      'supported-games/doom-eternal',
      'supported-games/quake-champions',
      'supported-games/overwatch-2',
      'supported-games/paladins',
      'supported-games/smite',
      'supported-games/league-of-legends',
      'supported-games/valorant',
    ],
    [],
  )

  // const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
  // // const gameUrl = `http://localhost:3001/${randomSlug}`
  // const gameUrl = `https://steamgameidler.com/${randomSlug}`

  const [gameUrl, setGameUrl] = useState(() => {
    const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
    // return `http://localhost:3001/${randomSlug}`
    return `https://steamgameidler.com/${randomSlug}`
  })

  // Reset fallback state whenever the iframe loads a new page
  useEffect(() => {
    setAdFilled(false)
    failedAdsRef.current = new Set()
    setFallbackAd(prev => pickNextFallback(prev))
  }, [gameUrl, reloadKey, fallbackAds, pickNextFallback])

  // Listen for ad-refresh from AdComponent to reset detection on each internal ad cycle
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://steamgameidler.com') return
      console.debug('Received message:', e.data)
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.type === 'ad-refresh') {
          setAdFilled(false)
          setFallbackAd(prev => pickNextFallback(prev))
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [fallbackAds, pickNextFallback])

  // adpnt is sent by AdSense only when an ad actually renders — hide fallback if it arrives
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://googleads.g.doubleclick.net') return
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (data?.googMsgType === 'adpnt') {
          setAdFilled(true)
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener('message', handler)

    return () => {
      window.removeEventListener('message', handler)
    }
  }, [gameUrl])

  useEffect(() => {
    const timer = setTimeout(
      () => {
        const randomSlug = gameSlugs[Math.floor(Math.random() * gameSlugs.length)]
        // setGameUrl(`http://localhost:3001/${randomSlug}`)
        setGameUrl(`https://steamgameidler.com/${randomSlug}`)
        setReloadKey(key => key + 1)
      },
      30 * 60 * 1000,
    )

    return () => clearTimeout(timer)
  }, [gameSlugs, reloadKey])

  return (
    <div
      className={cn(
        'transition-all ease-in-out border border-border p-2 pb-1 rounded-lg',
        sidebarCollapsed ? 'scale-[.160]' : 'scale-[.75]',
        isSubscribed === null && 'opacity-0',
        isSubscribed !== null && hasCasualAccess(subscriptionTier) && 'opacity-0',
        isSubscribed !== null && !hasCasualAccess(subscriptionTier) && 'opacity-100',
      )}
    >
      <div className='relative flex justify-center items-center overflow-hidden rounded-lg'>
        <iframe
          className='overflow-scroll rounded-lg -mt-88 -ml-75.25 z-1'
          src={gameUrl}
          width='600'
          height='600'
          title='External Website'
        />
        {adFilled === false && (
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-[#121316]'>
            <Image
              src={fallbackAd}
              alt='Advertisement'
              width={300}
              height={250}
              className='w-full h-full object-fill'
              onError={handleFallbackAdError}
            />
          </div>
        )}
        <Spinner className='absolute inset-0 m-auto z-0' />
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
