import type { FarmingProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { ProgressBar, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface CardFarmingActiveCardProps {
  game: FarmingProgress
}

// One currently-farming game within CardFarmingProgressView's "active" grid - cover art + a drops-
// remaining progress bar, the card-farming analog of AchievementUnlockerCurrentGamePanel (this
// feature has no "up next" concept to pair it with - `card_farming::manager` idles every active
// game concurrently rather than working through them one at a time with delays, see
// MAX_CONCURRENT_FARMING's doc comment - so active games get a grid of these instead of that
// feature's stacked two-panel rows).
export const CardFarmingActiveCard = ({ game }: CardFarmingActiveCardProps) => {
  const { t } = useTranslation()
  const { appId, name, initialRemaining, remaining } = game

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm'>
      <GameThumbnail appId={appId} name={name} />
      <Typography title={name} truncate type='body-sm' weight='semibold'>
        {name}
      </Typography>
      {initialRemaining > 0 && (
        <ProgressBar
          aria-label={`Card farming progress for ${name}`}
          maxValue={initialRemaining}
          minValue={0}
          value={initialRemaining - remaining}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}
      <Typography className='text-accent' type='body-xs' weight='semibold'>
        {t('dashboard.cardFarming.progress.dropsRemaining', { count: remaining })}
      </Typography>
    </div>
  )
}
