import type { CompletedUnlockReason } from '../types'
import { useTranslation } from 'react-i18next'
import { TbCheck, TbInfoCircle } from 'react-icons/tb'
import { Typography } from '@heroui/react'

interface AchievementUnlockerCompletedRowProps {
  name: string
  unlocked: number
  total: number
  reason: CompletedUnlockReason
}

// One row within AchievementUnlockerProgressView's "completed this session" list - mirrors
// CardFarmingGameRow's 'completed' variant, but shows an unlocked/total count instead of a plain
// checkmark since "how many achievements" is the meaningful outcome here (card farming's own
// completed row has nothing further to report once a game's drops are exhausted).
//
// `reason` is what makes a game hitting its max-playtime cap, its per-game max-unlocks override, or
// having nothing eligible to unlock - during the very first scan pass, the most common way a run
// ends in well under a second - actually explain itself here instead of the session just looking
// like it did nothing. A green checkmark is reserved for a genuine `'finished'` outcome; the other
// reasons get a neutral info icon since they're not really "successes." `total === 0` only ever
// happens for `'maxPlaytime'`/`'nothingToUnlock'` (caught before any achievement was ever fetched),
// so those two get a plain reason-only label instead of a meaningless "0/0 unlocked".
export const AchievementUnlockerCompletedRow = ({
  name,
  unlocked,
  total,
  reason,
}: AchievementUnlockerCompletedRowProps) => {
  const { t } = useTranslation()

  const label = (() => {
    switch (reason) {
      case 'finished':
        return t('dashboard.achievementUnlocker.progress.completedCount', { unlocked, total })
      case 'maxUnlocksReached':
        return t('dashboard.achievementUnlocker.progress.completedMaxUnlocksReached', {
          unlocked,
          total,
        })
      case 'maxPlaytime':
        return total > 0
          ? t('dashboard.achievementUnlocker.progress.completedMaxPlaytimeWithCount', {
              unlocked,
              total,
            })
          : t('dashboard.achievementUnlocker.progress.completedMaxPlaytime')
      case 'nothingToUnlock':
        return t('dashboard.achievementUnlocker.progress.completedNothingToUnlock')
    }
  })()

  return (
    <div className='flex items-center gap-3 rounded-lg border border-border px-3 py-2'>
      <div className='min-w-0 flex-1'>
        <Typography className='min-w-0' title={name} truncate type='body-sm' weight='semibold'>
          {name}
        </Typography>
      </div>
      <div className='flex shrink-0 items-center gap-1'>
        {reason === 'finished' ? (
          <TbCheck className='text-success' fontSize={16} />
        ) : (
          <TbInfoCircle className='text-muted' fontSize={16} />
        )}
        <Typography color='muted' type='body-xs'>
          {label}
        </Typography>
      </div>
    </div>
  )
}
