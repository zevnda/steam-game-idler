import type { AchievementUnlockerScanProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from '@heroui/react'

interface AchievementUnlockerScanProgressCardProps {
  progress: AchievementUnlockerScanProgress
}

// Shown while a running session is checking the queue for achievement data, before any game starts
// unlocking. On its own it fills the running screen (the Overview/Details content waits until a game
// is active - see AchievementUnlockerRunView's `isOnlyScanning`), so it's a centred panel rather than
// a strip, matching the rest of the running screen's cards.
export const AchievementUnlockerScanProgressCard = ({
  progress,
}: AchievementUnlockerScanProgressCardProps) => {
  const { t } = useTranslation()
  const title = t('dashboard.achievementUnlocker.progress.scanning')

  return (
    <div className='flex flex-col items-center gap-5 rounded-2xl border border-border bg-surface px-8 py-14 text-center'>
      <div className='flex flex-col gap-1.5'>
        <h3 className='text-lg font-bold text-balance'>{title}</h3>
        <span className='text-sm tabular-nums text-muted'>
          {t('dashboard.achievementUnlocker.progress.scanningCount', {
            checked: progress.checked,
            total: progress.total,
          })}
        </span>
      </div>
      <ProgressBar
        aria-label={title}
        className='w-full max-w-md'
        maxValue={Math.max(progress.total, 1)}
        minValue={0}
        value={progress.checked}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  )
}
