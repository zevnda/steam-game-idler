import type { AchievementUnlockerEntry } from '../types'
import { TbListNumbers, TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface AchievementUnlockerListCardProps {
  game: AchievementUnlockerEntry
  isPending?: boolean
  onRemove: () => void
  onEditOrder: () => void
}

// Used in the "Queue" tab - thumbnail + name + an "edit order" button (opens the per-game
// achievement-order overlay) and a remove button. The whole card is draggable to reorder - see
// SortableAchievementUnlockerListCard, which wraps this, mirroring
// favorites/SortableFavoriteListCard's shape exactly.
export const AchievementUnlockerListCard = ({
  game,
  isPending,
  onRemove,
  onEditOrder,
}: AchievementUnlockerListCardProps) => {
  return (
    <div className='group flex flex-col gap-2'>
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
          <Button
            isIconOnly
            aria-label={`Edit unlock order for ${game.name}`}
            size='sm'
            variant='ghost'
            onPress={onEditOrder}
          >
            <TbListNumbers fontSize={16} />
          </Button>
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
