import type { AutoIdleEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { Button, Switch, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface AutoIdleListCardProps {
  game: AutoIdleEntry
  isPending: boolean
  onToggleEnabled: () => void
  onRemove: () => void
}

// Used in the "Queue" tab - a thumbnail + name + an enable/disable switch + a remove button (the
// whole card is draggable to reorder - see SortableAutoIdleListCard, which wraps this). The one
// real difference from FavoriteListCard/AchievementUnlockerListCard: this queue's entries carry
// their own `enabled` flag (dimmed when off, matching `main`'s `GameCard`'s `opacity-50`
// treatment for a disabled auto-idle entry), so a game can stay queued without actually being
// started on next launch/"Start Now".
export const AutoIdleListCard = ({
  game,
  isPending,
  onToggleEnabled,
  onRemove,
}: AutoIdleListCardProps) => {
  return (
    <div
      className={
        game.enabled ? 'group flex flex-col gap-2' : 'group flex flex-col gap-2 opacity-50'
      }
    >
      <GameThumbnail appId={game.appId} name={game.name} />
      <div className='flex items-center justify-between gap-2'>
        <Typography
          className='min-w-0 transition-colors duration-150 group-hover:text-foreground'
          color='muted'
          title={game.name}
          truncate
          type='body-sm'
          weight='semibold'
        >
          {game.name}
        </Typography>
        <div className='flex shrink-0 items-center gap-1'>
          <Switch
            aria-label={`Toggle auto-idle for ${game.name}`}
            isDisabled={isPending}
            isSelected={game.enabled}
            onChange={onToggleEnabled}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <Button
            isIconOnly
            aria-label={`Remove ${game.name}`}
            isPending={isPending}
            size='sm'
            variant='ghost'
            onPress={onRemove}
          >
            <TbX fontSize={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
