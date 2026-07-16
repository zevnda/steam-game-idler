import type { CardFarmingBlacklistEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface CardFarmingBlacklistCardProps {
  game: CardFarmingBlacklistEntry
  isPending: boolean
  onRemove: () => void
}

// Used in the "Blacklisted" tab - mirrors CardFarmingListCard's shape (thumbnail + name + a single
// remove button) minus drag-to-reorder, since the blacklist has no ordering concept, only
// membership.
export const CardFarmingBlacklistCard = ({
  game,
  isPending,
  onRemove,
}: CardFarmingBlacklistCardProps) => {
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
          aria-label={`Remove ${game.name} from blacklist`}
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
