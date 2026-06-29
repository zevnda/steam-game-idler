import type { ActivePageType } from '@/shared/types'
import type { ActiveGameState, ScanProgress } from '../hooks/useAchievementUnlocker'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbPlayerStopFilled } from 'react-icons/tb'
import { GameRow } from './GameRow'
import { ScanProgressCard } from './ScanProgressCard'
import { Button, cn } from '@heroui/react'
import Image from 'next/image'
import { MAX_CONCURRENT_GAMES, useAchievementUnlocker } from '@/features/achievement-unlocker'
import { useStateStore, useUserStore } from '@/shared/stores'
import {
  hasGamerAccess,
  startCardFarming,
  stopIdle,
  updateDiscordPresence,
  updateTrayIcon,
} from '@/shared/utils'

export const AchievementUnlocker = ({ activePage }: { activePage: ActivePageType }) => {
  const { t } = useTranslation()
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const subscriptionTier = useUserStore(state => state.subscriptionTier)
  const userSettings = useUserStore(state => state.userSettings)

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController>(new AbortController())

  const [activeGames, setActiveGames] = useState<ActiveGameState[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')

  const maxConcurrentGames =
    hasGamerAccess(subscriptionTier) && userSettings.achievementUnlocker.multipleGames
      ? MAX_CONCURRENT_GAMES
      : 1

  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAchievementUnlocker(
      maxConcurrentGames,
      setActiveGames,
      setIsComplete,
      setScanProgress,
      startCardFarming,
      isMountedRef,
      abortControllerRef,
    )

    const abortController = abortControllerRef.current

    return () => {
      isMountedRef.current = false
      abortController.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isMultiple = activeGames.length > 1
  const primaryGame = activeGames[0] ?? null

  useEffect(() => {
    if (!isAchievementUnlocker || activeGames.length === 0) return

    if (isMultiple) {
      updateTrayIcon(t('trayIcon.achievementUnlockerMultiple', { count: activeGames.length }), true)
      updateDiscordPresence(
        t('common.achievementUnlocker'),
        t('automation.achievementUnlocker.runningMultiple', { count: activeGames.length }),
      )
    } else if (primaryGame && primaryGame.achievementCount) {
      updateTrayIcon(
        t('trayIcon.achievementUnlocker', {
          total: primaryGame.achievementCount,
          appName: primaryGame.game.name || '',
        }),
        true,
      )
      updateDiscordPresence(
        primaryGame.game.name,
        `Unlocking ${primaryGame.achievementCount} achievements`,
      )
    }
  }, [isAchievementUnlocker, activeGames, isMultiple, primaryGame, t])

  useEffect(() => {
    setImageLoaded(false)
    setFallbackImage('')
  }, [primaryGame?.appId])

  const handleStop = () => {
    for (const entry of activeGames) {
      stopIdle(entry.game.appid, entry.game.name)
    }
    setIsAchievementUnlocker(false)
    updateTrayIcon()
    updateDiscordPresence()
  }

  return (
    <div
      className={cn(
        'absolute top-0 z-4 w-full h-screen bg-gradient-bg',
        'overflow-x-hidden ease-in-out',
        activePage !== 'customlists/achievement-unlocker' && 'hidden',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width, left',
      }}
    >
      {primaryGame?.game.appid && (
        <Image
          src={
            fallbackImage ||
            `https://cdn.steamstatic.com/steam/apps/${primaryGame.game.appid}/library_hero.jpg`
          }
          className={cn('fixed top-0 left-0 w-full', !imageLoaded && 'hidden')}
          alt='background'
          width={1920}
          height={1080}
          priority
          onLoad={() => setImageLoaded(true)}
          onError={() =>
            setFallbackImage(
              `https://cdn.steamstatic.com/steam/apps/${primaryGame.game.appid}/header.jpg`,
            )
          }
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)',
          }}
        />
      )}
      {imageLoaded && <div className='fixed top-0 left-0 w-full h-screen bg-base/70' />}

      <div
        className={cn(
          'relative flex flex-col h-calc w-[calc(100vw-30px)] pl-6 pt-2 pr-12 mt-12 ease-in-out',
          sidebarCollapsed ? 'ml-14' : 'ml-62.5',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'margin-left',
        }}
      >
        <div className='flex justify-between items-center pb-3 shrink-0'>
          <div className='flex items-center gap-1 select-none'>
            <div className='flex flex-col justify-center'>
              <p className='text-3xl font-black'>{t('common.achievementUnlocker')}</p>

              <p className='text-xs text-altwhite my-2'>
                {t('automation.achievementUnlocker.running')}
              </p>

              <div className='flex items-center gap-2 mt-1'>
                <Button
                  color='danger'
                  radius='full'
                  className='font-bold'
                  startContent={<TbPlayerStopFilled size={18} />}
                  onPress={handleStop}
                >
                  {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isComplete ? (
          <div className='flex justify-center items-center flex-col p-6 bg-tab-panel min-h-[40vh] w-full rounded-4xl border border-border'>
            <div className='border border-border rounded-full inline-block p-2 w-fit'>
              <TbCheck className='text-green-400' fontSize={50} />
            </div>
            <p className='mt-4'>{t('common.done')}</p>
          </div>
        ) : (
          <div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1'>
            <div className='flex flex-col gap-4 w-full pt-10 pb-4'>
              {scanProgress && <ScanProgressCard progress={scanProgress} />}
              {activeGames.map(entry => (
                <GameRow key={entry.appId} entry={entry} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
