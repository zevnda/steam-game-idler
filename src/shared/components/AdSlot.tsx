import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { ProBadge } from '@/shared/components'
import { useNavigationStore, useStateStore } from '@/shared/stores'

export const AdSlot = ({ isPro }: { isPro: boolean | null }) => {
  const { t } = useTranslation()
  const activePage = useNavigationStore(state => state.activePage)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const setProModalOpen = useStateStore(state => state.setProModalOpen)
  const [reloadKey, setReloadKey] = useState(0)
  const [adFilled, setAdFilled] = useState(false)

  // Add more fallback ad image paths here as needed
  const fallbackAds = useMemo(
    () => ['/ads/ad-fallback-1.webp', '/ads/ad-fallback-2.webp', '/ads/ad-fallback-3.webp'],
    [],
  )

  const [fallbackAd, setFallbackAd] = useState(
    () => fallbackAds[Math.floor(Math.random() * fallbackAds.length)],
  )

  // Pick a random fallback ad that's different from the current one
  const pickNextFallback = useCallback(
    (current: string) => {
      const others = fallbackAds.filter(ad => ad !== current)
      return others[Math.floor(Math.random() * others.length)]
    },
    [fallbackAds],
  )

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
        sidebarCollapsed && activePage !== 'settings' ? 'scale-[.160]' : 'scale-[.75]',
        isPro === null && 'opacity-0',
        isPro === true && 'opacity-0',
        isPro === false && 'opacity-100',
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
            />
          </div>
        )}
        <Spinner className='absolute inset-0 m-auto z-0' />
      </div>

      <div
        className='text-xs text-altwhite mt-1 text-center cursor-pointer hover:text-white duration-150 scale-125 pointer-events-auto'
        onClick={() => setProModalOpen(true)}
      >
        <p>
          {t('proMode.removeAdsWith')}
          <ProBadge />
        </p>
      </div>
    </div>
  )
}
