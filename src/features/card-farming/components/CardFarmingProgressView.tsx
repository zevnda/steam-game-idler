import type { FarmingState } from '../types'
import { useTranslation } from 'react-i18next'
import { CardFarmingActiveCard } from './CardFarmingActiveCard'
import { CardFarmingGameRow } from './CardFarmingGameRow'
import { Button, Typography } from '@heroui/react'

interface CardFarmingProgressViewProps {
  state: FarmingState
  // Set only while `CardFarmingPage` is showing the dismissible "session finished" summary (not
  // farming, `completed` non-empty, not yet dismissed) - renders a "Done" button that hands control
  // back to the page to return to the browse/queue tabs. Omitted while a cycle is actively farming,
  // since there's nothing to dismiss yet.
  onDismissFinished?: () => void
}

// Renders whichever of active/queue/completed actually have entries - all three are empty before
// a cycle's first sync, so this renders nothing then. Deliberately not gated on `state.isFarming`
// itself: `completed` still has real content worth showing after a cycle ends (see
// `card_farming::FarmingState`'s own doc comment - the backend clears its *own* tracked session
// once a cycle ends, so a later `get_farming_state` call reads back defaults, but the last
// `card-farming-state-changed` event before that still carried the full completed list, and
// `CardFarmingPage` keeps rendering this view off that until the user dismisses it via
// `onDismissFinished` or starts a new cycle).
//
// Visually mirrors AchievementUnlockerProgressView's running-state treatment (same full-bleed hero
// banner via `RunningAutomationHeroBackground`, same frosted rounded-2xl card language) without
// forcing its two-panel current/up-next shape onto data that doesn't have that structure - see
// CardFarmingActiveCard's own doc comment for why "active" gets a card grid instead.
export const CardFarmingProgressView = ({
  state,
  onDismissFinished,
}: CardFarmingProgressViewProps) => {
  const { t } = useTranslation()

  if (state.active.length === 0 && state.queue.length === 0 && state.completed.length === 0) {
    return null
  }

  return (
    <div className='relative min-h-full'>
      <div className='relative z-10 flex flex-col gap-6 p-6'>
        {state.active.length > 0 && (
          <div className='flex flex-col gap-2'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('dashboard.cardFarming.progress.activeTitle', { count: state.active.length })}
            </Typography>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {state.active.map(game => (
                <CardFarmingActiveCard key={game.appId} game={game} />
              ))}
            </div>
          </div>
        )}

        {state.queue.length > 0 && (
          <div className='flex flex-col gap-2'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('dashboard.cardFarming.progress.queueTitle', { count: state.queue.length })}
            </Typography>
            <div className='flex flex-col gap-2 rounded-2xl border border-border bg-surface/80 p-3 backdrop-blur-sm'>
              {state.queue.map(game => (
                <CardFarmingGameRow
                  key={game.appId}
                  name={game.name}
                  remaining={game.remaining}
                  variant='queued'
                />
              ))}
            </div>
          </div>
        )}

        {state.completed.length > 0 && (
          <div className='flex flex-col gap-2'>
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('common.completedThisSessionCount', {
                count: state.completed.length,
              })}
            </Typography>
            <div className='flex flex-col gap-2 rounded-2xl border border-border bg-surface/80 p-3 backdrop-blur-sm'>
              {state.completed.map(game => (
                <CardFarmingGameRow
                  key={game.appId}
                  farmableAt={game.farmableAt}
                  name={game.name}
                  reason={game.reason}
                  remaining={game.remaining}
                  variant='completed'
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
