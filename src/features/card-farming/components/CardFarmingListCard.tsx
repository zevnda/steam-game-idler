import type { CardFarmingQueueEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface CardFarmingQueueCardProps {
  game: CardFarmingQueueEntry
  isPending?: boolean
  onRemove: () => void
}

// Used in the "Queue" tab - mirrors AchievementUnlockerListCard's shape (thumbnail + name + remove
// button, the whole card draggable to reorder via SortableCardFarmingQueueCard), minus the
// achievement-specific "edit order" button - card farming has no per-game ordering concept, only
// which games are queued at all.
export const CardFarmingListCard = ({ game, isPending, onRemove }: CardFarmingQueueCardProps) => {
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
        <Button
          isIconOnly
          aria-label={`Remove ${game.name}`}
          className='shrink-0'
          isPending={isPending}
          size='sm'
          variant='ghost'
          onPress={onRemove}
        >
          <TbX fontSize={16} />
        </Button>
      </div>
    </div>
  )
}
