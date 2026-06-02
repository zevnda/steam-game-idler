import type { ActivePageType, Game } from '@/shared/types'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck, TbPlayerStopFilled } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import Image from 'next/image'
import { runAchievementUnlocker } from '@/features/achievement-unlocker/services/achievementUnlockerService'
import { startCardFarming } from '@/features/card-farming/services/startCardFarming'
import { startAutoIdleGames, stopIdle } from '@/features/idle'
import { useSessionStore, useUiStore } from '@/shared/stores'
import { updateDiscordPresence, updateTrayIcon } from '@/shared/utils'

export function AchievementUnlocker({ activePage }: { activePage: ActivePageType }) {
  const { t } = useTranslation()
  const isAchievementUnlocker = useSessionStore(s => s.isAchievementUnlocker)
  const setIsAchievementUnlocker = useSessionStore(s => s.setIsAchievementUnlocker)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)

  const abortRef = useRef(new AbortController())
  const [isInitialDelay, setIsInitialDelay] = useState(true)
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [achievementCount, setAchievementCount] = useState(0)
  const [countdownTimer, setCountdownTimer] = useState('00:00:10')
  const [isWaitingForSchedule, setIsWaitingForSchedule] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fallbackImage, setFallbackImage] = useState('')

  useEffect(() => {
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    runAchievementUnlocker(
      signal,
      setCurrentGame,
      setIsComplete,
      setAchievementCount,
      setCountdownTimer,
      setIsWaitingForSchedule,
      setIsInitialDelay,
      startCardFarming,
      startAutoIdleGames,
      false,
    ).catch(err => {
      if (err?.message !== 'aborted') console.error(err)
    })

    return () => {
      abortRef.current.abort()
    }
  }, [])

  useEffect(() => {
    if (isAchievementUnlocker && currentGame && achievementCount) {
      updateTrayIcon(
        t('trayIcon.achievementUnlocker', {
          total: achievementCount,
          appName: currentGame?.name || '',
        }),
        true,
      )
      updateDiscordPresence(currentGame?.name, `Unlocking ${achievementCount} achievements`)
    }
  }, [isAchievementUnlocker, currentGame, achievementCount, t])

  useEffect(() => {
    setImageLoaded(false)
    setFallbackImage('')
  }, [currentGame?.appid])

  return (
    <div
      className={cn(
        'absolute top-0 z-4 w-full h-screen bg-gradient-bg overflow-y-auto overflow-x-hidden ease-in-out',
        activePage !== 'customlists/achievement-unlocker' && 'hidden',
      )}
      style={{ transitionDuration, transitionProperty: 'width, left' }}
    >
      {currentGame?.appid && (
        <Image
          src={
            fallbackImage ||
            `https://cdn.steamstatic.com/steam/apps/${currentGame.appid}/library_hero.jpg`
          }
          className={cn('absolute top-0 left-0 w-full', !imageLoaded && 'hidden')}
          alt='background'
          width={1920}
          height={1080}
          priority
          onLoad={() => setImageLoaded(true)}
          onError={() =>
            setFallbackImage(
              `https://cdn.steamstatic.com/steam/apps/${currentGame.appid}/header.jpg`,
            )
          }
          style={{
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,0) 55%)',
          }}
        />
      )}
      {imageLoaded && <div className='absolute top-0 left-0 w-full h-screen bg-base/80' />}

      <div
        className={cn(
          'relative px-6 pt-4 mt-12 ease-in-out',
          sidebarCollapsed ? 'ml-14' : 'ml-62.5',
        )}
        style={{ transitionDuration, transitionProperty: 'margin-left' }}
      >
        <div className='flex items-end justify-between pb-3 select-none'>
          <div>
            <p className='text-2xl font-black'>{t('common.achievementUnlocker')}</p>
            <p className='text-xs text-altwhite/60 mt-0.5'>
              {t('automation.achievementUnlocker.running')}
            </p>
          </div>
          <Button
            size='sm'
            color='danger'
            radius='full'
            className='font-semibold'
            startContent={<TbPlayerStopFilled size={16} />}
            onPress={() => {
              abortRef.current.abort()
              stopIdle(currentGame?.appid, currentGame?.name)
              setIsAchievementUnlocker(false)
              updateTrayIcon()
              updateDiscordPresence()
            }}
          >
            {isComplete ? t('common.close') : t('common.stop')}
          </Button>
        </div>

        <div className='max-w-2xl mt-2'>
          <div className='flex justify-center items-center flex-col p-8 bg-surface min-h-[40vh] w-full rounded-3xl border border-border/20'>
            {isWaitingForSchedule && (
              <p className='font-semibold text-yellow-400'>
                {t('automation.achievementUnlocker.scheduleWait')}
              </p>
            )}

            {isComplete && (
              <>
                <div className='bg-green-500/10 border border-green-500/30 rounded-full p-4'>
                  <TbCheck className='text-green-400' size={40} />
                </div>
                <p className='mt-4 font-semibold'>{t('common.done')}</p>
              </>
            )}

            {isInitialDelay && !isComplete && (
              <p className='text-lg font-semibold'>
                <Trans
                  i18nKey='automation.achievementUnlocker.initialDelay'
                  values={{ timer: countdownTimer }}
                >
                  Starting in <span className='font-bold text-dynamic'>{countdownTimer}</span>
                </Trans>
              </p>
            )}

            {!isInitialDelay && !isComplete && !isWaitingForSchedule && (
              <div className='flex flex-col items-center gap-4'>
                <p className='text-xl font-black'>
                  {t('automation.achievementUnlocker.currentGame')}
                </p>
                <Image
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${currentGame?.appid}/header.jpg`}
                  width={320}
                  height={150}
                  alt={`${currentGame?.name} image`}
                  priority
                  onError={e => {
                    ;(e.target as HTMLImageElement).src = '/fallback.webp'
                  }}
                  className='w-full max-w-xs aspect-460/215 object-cover rounded-xl my-4'
                />
                <p>
                  <Trans
                    i18nKey='automation.achievementUnlocker.progress'
                    values={{ count: achievementCount, appName: currentGame?.name }}
                    components={{
                      1: <span className='font-bold text-dynamic' />,
                      3: <span className='font-bold text-dynamic' />,
                    }}
                  />
                </p>
                <p className='text-sm'>
                  <Trans
                    i18nKey='automation.achievementUnlocker.delay'
                    values={{ timer: countdownTimer }}
                    components={{ 1: <span className='font-bold text-sm text-dynamic' /> }}
                  />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
