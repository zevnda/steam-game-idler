import type { ActiveGameState } from '../hooks/useAchievementUnlocker'
import { Trans, useTranslation } from 'react-i18next'
import { UpcomingAchievementsList } from './UpcomingAchievementsList'
import { CircularProgress, cn } from '@heroui/react'
import Image from 'next/image'
import { CDN_BASE_URL } from '@/shared/constants'
import { useStateStore } from '@/shared/stores'

// Matches the hardcoded 10 second grace period in useAchievementUnlocker before unlocking starts
const INITIAL_DELAY_SECONDS = 10

interface GameRowProps {
  entry: ActiveGameState
}

export const GameRow = ({ entry }: GameRowProps) => {
  const { t } = useTranslation()
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)

  const {
    game,
    isInitialDelay,
    isWaitingForSchedule,
    achievementCount,
    countdownTimer,
    upcomingAchievements,
  } = entry
  const initialDelaySecondsRemaining = Number(countdownTimer.split(':')[2]) || 0

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    ;(event.target as HTMLImageElement).src = `${CDN_BASE_URL}/fallback.webp`
  }

  return (
    <div
      className={cn(
        'flex gap-4 ease-in-out shrink-0',
        sidebarCollapsed ? 'w-full' : 'w-[calc(100vw-300px)]',
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

        {isInitialDelay && (
          <div className='flex flex-col items-center gap-5'>
            <p className='text-lg font-semibold'>
              {t('automation.achievementUnlocker.initialDelay')}
            </p>

            <CircularProgress
              aria-label={t('automation.achievementUnlocker.initialDelay')}
              value={
                ((INITIAL_DELAY_SECONDS - initialDelaySecondsRemaining) / INITIAL_DELAY_SECONDS) *
                100
              }
              valueLabel={initialDelaySecondsRemaining}
              showValueLabel
              strokeWidth={3}
              classNames={{
                svg: 'w-28 h-28 drop-shadow-lg',
                indicator: 'stroke-dynamic',
                track: 'stroke-white/10',
                value: 'text-4xl font-black text-content',
              }}
            />
          </div>
        )}

        {!isInitialDelay && !isWaitingForSchedule && (
          <div className='flex flex-col items-center gap-4'>
            <p className='text-xl font-black'>{t('automation.achievementUnlocker.currentGame')}</p>

            <Image
              src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
              width={230}
              height={115}
              alt={`${game.name} image`}
              priority={true}
              onError={handleImageError}
              className='w-57.5 h-28.75 object-cover rounded-lg duration-150 my-4'
            />

            <p>
              <Trans
                i18nKey='automation.achievementUnlocker.progress'
                values={{
                  count: achievementCount,
                  appName: game.name,
                }}
                components={{
                  1: <span className='font-bold text-dynamic' />,
                  3: <span className='font-bold text-dynamic' />,
                }}
              />
            </p>
          </div>
        )}
      </div>

      {!isInitialDelay && !isWaitingForSchedule && (
        <UpcomingAchievementsList appId={game.appid} achievements={upcomingAchievements} />
      )}
    </div>
  )
}
