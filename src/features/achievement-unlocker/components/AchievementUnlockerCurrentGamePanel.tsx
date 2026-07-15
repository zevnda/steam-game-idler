import type { ActiveGameProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { TbClockHour4, TbHourglassLow } from 'react-icons/tb'
import { formatCountdown, INITIAL_DELAY_MS } from '../utils/formatCountdown'
import { ProgressBar, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface AchievementUnlockerCurrentGamePanelProps {
  entry: ActiveGameProgress
  now: number
}

// Left-hand panel of a running game's row - mirrors `main`'s GameRow.tsx (cover art + status),
// swapping its CircularProgress initial-delay indicator for the linear `ProgressBar` this rewrite's
// HeroUI kit actually exports (see AchievementUnlockerScanProgressCard.tsx for the same swap).
export const AchievementUnlockerCurrentGamePanel = ({
  entry,
  now,
}: AchievementUnlockerCurrentGamePanelProps) => {
  const { t } = useTranslation()
  const {
    appId,
    name,
    isInitialDelay,
    initialDelayEndsAtMs,
    isWaitingForSchedule,
    achievementCount,
  } = entry

  const initialDelayRemainingMs = initialDelayEndsAtMs
    ? Math.max(0, initialDelayEndsAtMs - now)
    : INITIAL_DELAY_MS

  return (
    <div className='flex h-96 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur-sm'>
      {isWaitingForSchedule ? (
        <div className='flex flex-col items-center gap-2 text-center'>
          <TbClockHour4 className='text-warning' fontSize={32} />
          <Typography className='text-warning' type='body-sm' weight='semibold'>
            {t('dashboard.achievementUnlocker.progress.waitingForSchedule')}
          </Typography>
        </div>
      ) : isInitialDelay ? (
        <div className='flex flex-col items-center gap-4'>
          <TbHourglassLow className='text-muted' fontSize={28} />
          <Typography type='body-sm' weight='semibold'>
            {t('dashboard.achievementUnlocker.progress.starting')}
          </Typography>
          <ProgressBar
            aria-label={t('dashboard.achievementUnlocker.progress.starting')}
            className='w-40'
            maxValue={INITIAL_DELAY_MS}
            minValue={0}
            value={INITIAL_DELAY_MS - initialDelayRemainingMs}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <Typography className='font-mono' color='muted' type='body-xs'>
            {formatCountdown(initialDelayRemainingMs)}
          </Typography>
        </div>
      ) : (
        <>
          <Typography color='muted' type='body-xs' weight='semibold'>
            {t('dashboard.achievementUnlocker.progress.currentGame')}
          </Typography>
          <div className='w-100'>
            <GameThumbnail appId={appId} name={name} />
          </div>
          <Typography title={name} truncate type='body' weight='semibold'>
            {name}
          </Typography>
          <Typography className='text-accent' type='body-sm' weight='semibold'>
            {t('dashboard.achievementUnlocker.progress.remaining', { count: achievementCount })}
          </Typography>
        </>
      )}
    </div>
  )
}
