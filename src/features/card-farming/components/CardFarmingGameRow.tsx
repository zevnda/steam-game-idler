import type { CompletedFarmReason } from '../types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbHourglassLow, TbInfoCircle } from 'react-icons/tb'
import { Typography } from '@heroui/react'

const formatFarmableAt = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

interface CardFarmingGameRowProps {
  name: string
  remaining: number
  variant: 'queued' | 'completed'
  // Only present for `variant: 'completed'` - see the reason-label switch below for why.
  reason?: CompletedFarmReason
  // Only present when `reason === 'refundWindow'` - see `CompletedFarm.farmableAt`'s doc comment.
  farmableAt?: number | null
  // Only meaningful for `variant: 'queued'` - this row's own playtime hours plus the account's
  // configured threshold, so the label can distinguish "still building playtime toward being
  // farmable" from "already farmable, just waiting its turn behind the current target(s)". Omitted
  // (falls back to a generic "waiting" label) if the caller hasn't loaded the threshold yet.
  playtimeHours?: number
  hoursUntilFarmable?: number
}

// One row within CardFarmingProgressView's queue/completed lists - a plain list, not a card grid:
// this data (a live remaining-drops count) reads naturally as a row, and neither list realistically
// grows large enough to need `VirtualizedGameGrid` (bounded by how many owned games currently have
// card drops, not the account's full library) - same "small enough" judgment call already made for
// achievement/stat lists. The `active` variant this component used to have moved to
// `CardFarmingActiveCard` (cover art + progress bar, its own doc comment explains why active games
// get a richer card grid instead of a row here).
//
// `variant: 'completed'`'s label depends on `reason` (mirrors `AchievementUnlockerCompletedRow`'s
// identical reasoning) - a genuine `'dropsExhausted'` needs no elaboration beyond the checkmark (0
// remaining is implied), but every other reason gets a neutral info icon plus a label explaining
// why this game stopped being tracked, since those aren't really "successes" and would otherwise
// look identical to a real finish. `'refundWindow'` names a resume date instead of a remaining
// count - unlike every other reason, this one can clear itself once `farmableAt` passes, without
// the user having to do anything (though whitelist membership itself, if any, still needs
// re-adding - see `card_farming::whitelist`'s doc comment).
export const CardFarmingGameRow = ({
  name,
  remaining,
  variant,
  reason,
  farmableAt,
  playtimeHours,
  hoursUntilFarmable,
}: CardFarmingGameRowProps) => {
  const { t } = useTranslation()

  const queuedLabel = () => {
    if (playtimeHours === undefined || hoursUntilFarmable === undefined) {
      return t('dashboard.cardFarming.progress.waitingTurn')
    }
    return playtimeHours < hoursUntilFarmable
      ? t('dashboard.cardFarming.progress.accumulatingPlaytime', {
          hours: playtimeHours.toFixed(1),
          threshold: hoursUntilFarmable,
        })
      : t('dashboard.cardFarming.progress.waitingTurn')
  }

  return (
    <div className='flex items-center gap-3 rounded-lg border border-border px-3 py-2'>
      <div className='min-w-0 flex-1'>
        <Typography className='min-w-0' title={name} truncate type='body-sm' weight='semibold'>
          {name}
        </Typography>
      </div>
      {variant === 'completed' ? (
        reason && reason !== 'dropsExhausted' ? (
          <div className='flex shrink-0 items-center gap-1'>
            <TbInfoCircle className='text-muted' fontSize={16} />
            <Typography color='muted' type='body-xs'>
              {reason === 'refundWindow'
                ? t('dashboard.cardFarming.progress.completedRefundWindow', {
                    date: farmableAt ? formatFarmableAt(farmableAt) : '',
                  })
                : reason === 'skippedUnplayed'
                  ? t('dashboard.cardFarming.progress.completedSkippedUnplayed')
                  : reason === 'skippedPlayed'
                    ? t('dashboard.cardFarming.progress.completedSkippedPlayed')
                    : t('dashboard.cardFarming.progress.completedNoDropsRemaining')}
            </Typography>
          </div>
        ) : (
          <TbCheck className='shrink-0 text-success' fontSize={18} />
        )
      ) : (
        <div className='flex shrink-0 items-center gap-1'>
          <TbHourglassLow className='text-muted' fontSize={14} />
          <Typography color='muted' type='body-xs'>
            {queuedLabel()}
          </Typography>
        </div>
      )}
    </div>
  )
}
