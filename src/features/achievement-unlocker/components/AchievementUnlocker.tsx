import type { ActivePageType, Game } from '@/shared/types'
import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck, TbPlayerStopFilled } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import Image from 'next/image'
import { useAchievementUnlocker } from '@/features/achievement-unlocker'
import { useStateStore } from '@/shared/stores'
import { startCardFarming, stopIdle, updateTrayIcon } from '@/shared/utils'

export const AchievementUnlocker = ({ activePage }: { activePage: ActivePageType }) => {
  const { t } = useTranslation()
  const isAchievementUnlocker = useStateStore(state => state.isAchievementUnlocker)
  const setIsAchievementUnlocker = useStateStore(state => state.setIsAchievementUnlocker)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController>(new AbortController())

  const [isInitialDelay, setIsInitialDelay] = useState(true)
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [achievementCount, setAchievementCount] = useState(0)
  const [countdownTimer, setCountdownTimer] = useState('00:00:10')
  const [isWaitingForSchedule, setIsWaitingForSchedule] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAchievementUnlocker(
      isInitialDelay,
      setIsInitialDelay,
      setCurrentGame,
      setIsComplete,
      setAchievementCount,
      setCountdownTimer,
      setIsWaitingForSchedule,
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

  useEffect(() => {
    if (isAchievementUnlocker && currentGame) {
      updateTrayIcon(
        t('trayIcon.achievementUnlocker', {
          total: achievementCount,
          appName: currentGame?.name || '',
        }),
        true,
      )
    }
  }, [isAchievementUnlocker, currentGame, achievementCount, t])

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    ;(event.target as HTMLImageElement).src = '/fallback.webp'
  }

  return (
    <div
      className={cn(
        'absolute top-0 z-4 w-full h-screen bg-gradient-bg',
        'overflow-y-auto overflow-x-hidden ease-in-out',
        activePage !== 'customlists/achievement-unlocker' && 'hidden',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width, left',
      }}
    >
      <div
        className={cn(
          'relative w-[calc(100vw-227px)] pl-6 pt-2 pr-12 mt-9 ease-in-out',
          sidebarCollapsed ? 'ml-14' : 'ml-62.5',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'margin-left',
        }}
      >
        <div className='flex justify-between items-center pb-3'>
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
                  onPress={() => {
                    stopIdle(currentGame?.appid, currentGame?.name)
                    setIsAchievementUnlocker(false)
                    updateTrayIcon()
                  }}
                >
                  {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'flex max-h-[calc(100vh-92px)] ease-in-out pt-10 overflow-hidden',
            sidebarCollapsed ? 'w-[calc(100vw-106px)]' : 'w-[calc(100vw-300px)]',
          )}
          style={{
            transitionDuration,
            transitionProperty: 'width',
          }}
        >
          <div className='flex justify-center items-center flex-col p-6 bg-tab-panel min-h-[40vh] w-full rounded-4xl border border-border'>
            {isWaitingForSchedule && (
              <p className='font-semibold text-yellow-400'>
                {t('automation.achievementUnlocker.scheduleWait')}
              </p>
            )}

            {isComplete && (
              <>
                <div className='border border-border rounded-full inline-block p-2 w-fit'>
                  <TbCheck className='text-green-400' fontSize={50} />
                </div>
                <p className='mt-4'>{t('common.done')}</p>
              </>
            )}

            {isInitialDelay && (
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
                  width={230}
                  height={115}
                  alt={`${currentGame?.name} image`}
                  priority={true}
                  onError={handleImageError}
                  className='w-57.5 h-28.75 object-cover rounded-lg duration-150 my-4'
                />

                <p>
                  <Trans
                    i18nKey='automation.achievementUnlocker.progress'
                    values={{
                      count: achievementCount,
                      appName: currentGame?.name,
                    }}
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
                    components={{
                      1: <span className='font-bold text-sm text-dynamic' />,
                    }}
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
