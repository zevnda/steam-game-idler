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
}

// One row within CardFarmingProgressView's queue/completed lists - a plain list, not a card grid:
// this data (a live remaining-drops count) reads naturally as a row, and neither list realistically
// grows large enough to need `VirtualizedGameGrid` (bounded by how many owned games currently have
// card drops, not the account's full library) - same "small enough" judgment call already made for
// achievement/stat lists. The `active` variant this
// component used to have moved to `CardFarmingActiveCard` (cover art + progress bar, its own doc
// comment explains why active games get a richer card grid instead of a row here).
//
// `variant: 'completed'`'s label depends on `reason` (mirrors
// `AchievementUnlockerCompletedRow`'s identical reasoning) - a genuine `'dropsExhausted'` needs no
// elaboration beyond the checkmark (0 remaining is implied), but the three cap-based reasons get a
// neutral info icon plus a label naming the cap and how many drops were left when it stopped, since
// those aren't really "successes" and would otherwise look identical to a real finish.
// `'noDropsRemaining'` gets the same neutral treatment - a game queued (e.g. via the context menu)
// that already had zero drops before this cycle ever started, so there's nothing to elaborate with a
// `remaining` count (see `CompletedFarm.remaining`'s doc comment - always `0` for this reason).
// `'refundWindow'` also gets the neutral treatment, but names a resume date instead of a remaining
// count - unlike every other reason, this one clears itself once `farmableAt` passes, without the
// user having to do anything.
export const CardFarmingGameRow = ({
  name,
  remaining,
  variant,
  reason,
  farmableAt,
}: CardFarmingGameRowProps) => {
  const { t } = useTranslation()

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
              {reason === 'maxCardDrops'
                ? t('dashboard.cardFarming.progress.completedMaxCardDrops', { remaining })
                : reason === 'maxCardFarmingTime'
                  ? t('dashboard.cardFarming.progress.completedMaxCardFarmingTime', { remaining })
                  : reason === 'maxPlaytime'
                    ? t('dashboard.cardFarming.progress.completedMaxPlaytime', { remaining })
                    : reason === 'refundWindow'
                      ? t('dashboard.cardFarming.progress.completedRefundWindow', {
                          date: farmableAt ? formatFarmableAt(farmableAt) : '',
                        })
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
            {t('dashboard.cardFarming.progress.dropsRemaining', { count: remaining })}
          </Typography>
        </div>
      )}
    </div>
  )
}
