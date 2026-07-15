import type { AchievementUnlockerState } from '../types'
import { useTranslation } from 'react-i18next'
import { AchievementUnlockerActiveRow } from './AchievementUnlockerActiveRow'
import { AchievementUnlockerCompletedRow } from './AchievementUnlockerCompletedRow'
import { AchievementUnlockerScanProgressCard } from './AchievementUnlockerScanProgressCard'
import { Button, Typography } from '@heroui/react'

interface AchievementUnlockerProgressViewProps {
  state: AchievementUnlockerState
  // Set only while `AchievementUnlockerPage` is showing the dismissible "session finished" summary
  // (not running, `completed` non-empty, not yet dismissed) - renders a "Done" button that hands
  // control back to the page to return to the browse/queue tabs. Omitted while a session is actively
  // running, since there's nothing to dismiss yet. Mirrors `CardFarmingProgressView`'s identical prop.
  onDismissFinished?: () => void
}

// Renders a running session's live progress - a full-bleed hero banner of the first active game's
// cover art (matching `main`'s AchievementUnlocker.tsx background, which also always keys off the
// primary/first game) behind a plain list of per-game rows, one `AchievementUnlockerActiveRow` two-
// panel layout each - bounded by however many workers are running concurrently, so no card grid/
// virtualization needed (same judgment as `CardFarmingProgressView`). Also renders `state.completed`
// once a session ends (finished games or ones that hit their max-playtime cap) - stays populated
// past `isRunning` flipping false so `AchievementUnlockerPage` can keep showing this view as a
// dismissible "session finished" summary instead of results vanishing the instant the run stops.
export const AchievementUnlockerProgressView = ({
  state,
  onDismissFinished,
}: AchievementUnlockerProgressViewProps) => {
  const { t } = useTranslation()

  return (
    <div className='relative min-h-full'>
      <div className='relative z-10 flex flex-col gap-4 p-6'>
        {state.scanProgress && (
          <AchievementUnlockerScanProgressCard progress={state.scanProgress} />
        )}
        {state.active.map(entry => (
          <AchievementUnlockerActiveRow key={entry.appId} entry={entry} />
        ))}

        {state.completed.length > 0 && (
          <div className='flex flex-col gap-2'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('common.completedThisSessionCount', { count: state.completed.length })}
            </Typography>
            <div className='flex flex-col gap-2 rounded-2xl border border-border bg-surface/80 p-3 backdrop-blur-sm'>
              {state.completed.map(game => (
                <AchievementUnlockerCompletedRow
                  key={game.appId}
                  name={game.name}
                  reason={game.reason}
                  total={game.total}
                  unlocked={game.unlocked}
                />
              ))}
            </div>
          </div>
        )}

        {onDismissFinished && (
          <div className='flex justify-center'>
            <Button variant='secondary' onPress={onDismissFinished}>
              {t('common.actions.done')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
