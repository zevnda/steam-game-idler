import type { FarmingPhase, FarmingProgress } from '../types'
import { useTranslation } from 'react-i18next'
import { ProgressBar, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

interface CardFarmingActiveCardProps {
  game: FarmingProgress
  // Which phase produced this card - decides what the progress bar/label below actually measure.
  // See `card_farming::mod::Phase`'s doc comment.
  phase: FarmingPhase | null
  // Only needed while `phase === 'bulkIdle'` - the threshold `game.playtimeHours` is progressing
  // toward. Omitted (or still loading) falls back to the drops-remaining display, same as the
  // ready-farm phase, rather than showing a bar with no real maximum.
  hoursUntilFarmable?: number
}

// One currently-active game within CardFarmingProgressView's "active" grid - cover art plus a
// progress bar whose meaning follows the current phase, not a fixed metric: while bulk-idling
// (`phase === 'bulkIdle'`), the game isn't being farmed for cards at all yet, so a drops-remaining
// bar there would be actively misleading (implying progress toward something that isn't
// happening) - it shows progress toward `hoursUntilFarmable` instead. Once actually farming
// (`phase === 'readyFarm'`), the bar reverts to the familiar drops-remaining progress. This value
// refreshes at the same cadence as the rest of this view (once per outer-loop iteration, every
// ~5-8 minutes depending on batch size) - deliberately not ticked forward client-side between
// updates, so it stays consistent with every other value on this screen rather than being the one
// thing that appears to update faster than reality.
export const CardFarmingActiveCard = ({
  game,
  phase,
  hoursUntilFarmable,
}: CardFarmingActiveCardProps) => {
  const { t } = useTranslation()
  const { appId, name, initialRemaining, remaining, playtimeHours } = game

  const showBuildingPlaytime = phase === 'bulkIdle' && hoursUntilFarmable !== undefined

  return (
    <div
      className='flex flex-col gap-3 rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-sm'
      {...gameCardContextAttrs(appId, name)}
    >
      <GameThumbnail appId={appId} name={name} />
      <Typography title={name} truncate type='body-sm' weight='semibold'>
        {name}
      </Typography>
      {showBuildingPlaytime ? (
        <ProgressBar
          aria-label={`Playtime progress for ${name}`}
          maxValue={hoursUntilFarmable}
          minValue={0}
          value={Math.min(playtimeHours, hoursUntilFarmable)}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      ) : (
        initialRemaining > 0 && (
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
        )
      )}
      <Typography className='text-accent' type='body-xs' weight='semibold'>
        {showBuildingPlaytime
          ? t('dashboard.cardFarming.progress.accumulatingPlaytime', {
              hours: playtimeHours.toFixed(1),
              threshold: hoursUntilFarmable,
            })
          : t('dashboard.cardFarming.progress.dropsRemaining', { count: remaining })}
      </Typography>
    </div>
  )
}
