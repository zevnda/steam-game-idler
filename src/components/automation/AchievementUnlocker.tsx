import type { ActivePageType, Game } from '@/types'
import type { ReactElement, SyntheticEvent } from 'react'

import { Button, cn } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Trans, useTranslation } from 'react-i18next'
import { TbCheck } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import { useAchievementUnlocker } from '@/hooks/automation/useAchievementUnlocker'
import { useAutomate } from '@/hooks/automation/useAutomateButtons'
import { stopIdle } from '@/utils/idle'

export default function AchievementUnlocker({ activePage }: { activePage: ActivePageType }): ReactElement {
  const { t } = useTranslation()
  const { setIsAchievementUnlocker, transitionDuration, sidebarCollapsed } = useStateContext()

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController>(new AbortController())

  const [isInitialDelay, setIsInitialDelay] = useState(true)
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [achievementCount, setAchievementCount] = useState(0)
  const [countdownTimer, setCountdownTimer] = useState('00:00:10')
  const [isWaitingForSchedule, setIsWaitingForSchedule] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { startCardFarming } = useAutomate()

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

  const handleImageError = (event: SyntheticEvent<HTMLImageElement, Event>): void => {
    setImageError(true)
    ;(event.target as HTMLImageElement).src = '/background.webp'
  }

  return (
    <div
      className={cn(
        'absolute top-0 bg-base h-screen ease-in-out z-[4]',
        activePage !== 'customlists/achievement-unlocker' && 'hidden',
        sidebarCollapsed ? 'w-[calc(100vw-56px)] left-[56px]' : 'w-[calc(100vw-250px)] left-[250px]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width, left',
      }}
    >
      <div className='relative flex justify-evenly items-center flex-col px-14 h-full'>
        <Image
          src={
            currentGame?.appid
              ? `https://cdn.steamstatic.com/steam/apps/${currentGame?.appid}/library_hero.jpg`
              : '/background.webp'
          }
          className='absolute top-0 left-0 w-full h-full object-cover'
          alt='background'
          width={1920}
          height={1080}
          priority
          onError={handleImageError}
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 40%)',
          }}
        />
        <div className={cn('absolute top-0 left-0 w-full h-screen bg-base/50 backdrop-blur-lg')} />

        <div className={cn('flex items-center flex-col gap-16 z-10 bg-base/60 p-8 rounded-lg w-full')}>
          <p className='text-3xl font-semibold'>{t('common.achievementUnlocker')}</p>

          {isWaitingForSchedule && (
            <p className='text-sm text-yellow-400'>{t('automation.achievementUnlocker.scheduleWait')}</p>
          )}

          {isComplete && (
            <div className='border border-border rounded-full inline-block p-2 w-fit'>
              <TbCheck className='text-green-400' fontSize={50} />
            </div>
          )}

          {isInitialDelay && (
            <p className='text-sm'>
              <Trans i18nKey='automation.achievementUnlocker.initialDelay' values={{ timer: countdownTimer }}>
                Starting in <span className='font-bold text-sm text-dynamic'>{countdownTimer}</span>
              </Trans>
            </p>
          )}

          {!isInitialDelay && !isComplete && !isWaitingForSchedule && (
            <>
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
                <Trans i18nKey='automation.achievementUnlocker.delay' values={{ timer: countdownTimer }}>
                  Next unlock in <span className='font-bold text-sm text-dynamic'>{countdownTimer}</span>
                </Trans>
              </p>
            </>
          )}

          <Button
            color='danger'
            radius='full'
            className='font-bold w-56'
            onPress={() => {
              stopIdle(currentGame?.appid, currentGame?.name)
              setIsAchievementUnlocker(false)
            }}
          >
            {isComplete ? <p>{t('common.close')}</p> : <p>{t('common.stop')}</p>}
          </Button>
        </div>
      </div>
    </div>
  )
}
