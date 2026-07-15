import type { AchievementUnlockerScanProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { ProgressBar, Typography } from '@heroui/react'

interface AchievementUnlockerScanProgressCardProps {
  progress: AchievementUnlockerScanProgress
}

// Shown while a running session is scanning the queue for achievement data, before any game moves
// into the active list - mirrors `main`'s ScanProgressCard, restyled as a plain bordered card
// matching this rewrite's other progress rows instead of `main`'s full-width gradient panel.
export const AchievementUnlockerScanProgressCard = ({
  progress,
}: AchievementUnlockerScanProgressCardProps) => {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-border px-3 py-3'>
      <Typography type='body-sm' weight='semibold'>
        {t('dashboard.achievementUnlocker.progress.scanning')}
      </Typography>
      <ProgressBar
        aria-label={t('dashboard.achievementUnlocker.progress.scanning')}
        maxValue={progress.total}
        minValue={0}
        value={progress.checked}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
      <Typography color='muted' type='body-xs'>
        {t('dashboard.achievementUnlocker.progress.scanningCount', {
          checked: progress.checked,
          total: progress.total,
        })}
      </Typography>
    </div>
  )
}
