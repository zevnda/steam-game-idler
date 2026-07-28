import type { ActiveGameProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { TbClockHour4, TbHourglassLow } from 'react-icons/tb'
import { formatCountdown, INITIAL_DELAY_MS } from '../utils/formatCountdown'
import { ProgressCircle, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface AchievementUnlockerCurrentGamePanelProps {
  entry: ActiveGameProgress
  now: number
}

// Left-hand panel of a running game's row - mirrors `main`'s GameRow.tsx (cover art + status),
// including its circular initial-delay indicator (HeroUI v3's kit gained `ProgressCircle` after
// this rewrite originally shipped, so this no longer needs the linear `ProgressBar` fallback used
// by AchievementUnlockerScanProgressCard.tsx, which stays linear by design for a determinate scan).
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
    // `w-full` (not capped) so this panel keeps filling all remaining row width next to
    // AchievementUnlockerUpcomingPanel's fixed `sm:w-80`, matching how the row filled the
    // available area before - only the thumbnail below is sized/responsive, not this box. `h-96`
    // stays fixed at every width - even the largest thumbnail step (`2xl:w-100`, this panel's
    // original 400px image) leaves comfortable slack inside the existing fixed height (the
    // panel's content - label, image, name, remaining-count text - tops out well under 384px), so
    // there's no need to grow height and risk this panel drifting out of alignment with the
    // upcoming-achievements panel's own fixed `h-96` (load-bearing there - it needs the room for
    // up to 5 achievement rows).
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
          <ProgressCircle
            aria-label={t('dashboard.achievementUnlocker.progress.starting')}
            maxValue={INITIAL_DELAY_MS}
            minValue={0}
            size='lg'
            value={INITIAL_DELAY_MS - initialDelayRemainingMs}
          >
            <ProgressCircle.Track>
              <ProgressCircle.TrackCircle cx={18} cy={18} r={15} strokeWidth={6} />
              <ProgressCircle.FillCircle cx={18} cy={18} r={15} strokeWidth={6} />
            </ProgressCircle.Track>
          </ProgressCircle>
          <Typography className='font-mono' color='muted' type='body-xs'>
            {formatCountdown(initialDelayRemainingMs)}
          </Typography>
        </div>
      ) : (
        <>
          <Typography color='muted' type='body-xs' weight='semibold'>
            {t('dashboard.achievementUnlocker.progress.currentGame')}
          </Typography>
          {/* Was a flat `w-100` (400px) always - every other GameThumbnail caller in the app
              (card-farming's active grid, the achievement-unlocker queue list, etc.) lets the
              thumbnail size come from its grid cell instead of a hardcoded width, and none of them
              go anywhere near this large at a small window. Scales from `w-56` (224px) up through
              `lg`/`xl` to `2xl:w-100` - back to the original 400px, but now only once the window
              is actually wide enough to give it room, instead of that being the size at every
              width. */}
          <div className='w-56 lg:w-64 xl:w-72 2xl:w-100'>
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
