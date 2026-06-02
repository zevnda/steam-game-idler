import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { ProBadge } from '@/shared/components/pro/ProBadge'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasCasualFeature, hasGamerFeature } from '@/shared/utils'

const GAME_SLUGS = [
  'supported-games/scum',
  'supported-games/dayz',
  'supported-games/arma-3',
  'supported-games/rust',
  'supported-games/counter-strike-2',
  'supported-games/dota-2',
  'supported-games/apex-legends',
  'supported-games/destiny-2',
  'supported-games/dead-by-daylight',
  'supported-games/rainbow-six-siege',
  'supported-games/cyberpunk-2077',
  'supported-games/the-witcher-3',
  'supported-games/skyrim',
  'supported-games/terraria',
  'supported-games/stardew-valley',
  'supported-games/valheim',
  'supported-games/elden-ring',
  'supported-games/hades',
  'supported-games/hollow-knight',
]

const FALLBACK_ADS = [
  '/ads/ad-fallback-1.webp',
  '/ads/ad-fallback-2.webp',
  '/ads/ad-fallback-3.webp',
]

export function AdSlot() {
  const { t } = useTranslation()
  const isPro = useUserStore(s => s.isPro)
  const proTier = useUserStore(s => s.proTier)
  const setProModalRequiredTier = useUiStore(s => s.setProModalRequiredTier)
  const activePage = useUiStore(s => s.activePage)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const setProModalOpen = useUiStore(s => s.setProModalOpen)
  const [adFilled, setAdFilled] = useState(false)
  const [fallbackAd, setFallbackAd] = useState(
    () => FALLBACK_ADS[Math.floor(Math.random() * FALLBACK_ADS.length)],
  )
  const pickNext = useCallback((cur: string) => {
    const others = FALLBACK_ADS.filter(a => a !== cur)
    return others[Math.floor(Math.random() * others.length)]
  }, [])
  const [gameUrl, setGameUrl] = useState(
    () =>
      `https://steamgameidlers.com/${GAME_SLUGS[Math.floor(Math.random() * GAME_SLUGS.length)]}`,
  )

  useEffect(() => {
    setAdFilled(false)
    setFallbackAd(prev => pickNext(prev))
  }, [gameUrl, pickNext])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://steamgameidlers.com') return
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (d?.type === 'ad-refresh') {
          setAdFilled(false)
          setFallbackAd(prev => pickNext(prev))
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [pickNext])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://googleads.g.doubleclick.net') return
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
        if (d?.googMsgType === 'adpnt') setAdFilled(true)
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [gameUrl])

  useEffect(() => {
    const timer = setTimeout(
      () =>
        setGameUrl(
          `https://steamgameidlers.com/${GAME_SLUGS[Math.floor(Math.random() * GAME_SLUGS.length)]}`,
        ),
      30 * 60 * 1000,
    )
    return () => clearTimeout(timer)
  }, [gameUrl])

  return (
    <div
      className={cn(
        'transition-all ease-in-out border border-border p-2 pb-1 rounded-lg',
        sidebarCollapsed && activePage !== 'settings' ? 'scale-[.160]' : 'scale-[.75]',
        isPro === null && 'opacity-0',
        isPro !== null && hasCasualFeature(proTier) && 'opacity-0',
        isPro !== null && !hasCasualFeature(proTier) && 'opacity-100',
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
        {!adFilled && (
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
        className='text-xs text-altwhite mb-1 mt-1.5 text-center cursor-pointer hover:text-white duration-150 scale-125 pointer-events-auto'
        onClick={() => {
          if (!hasGamerFeature(proTier)) {
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
