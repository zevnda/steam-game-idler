import type { FavoriteEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

interface FavoriteListCardProps {
  favorite: FavoriteEntry
  isPending?: boolean
  onRemove: () => void
}

// Used in the "Favorites" tab - a thumbnail + name + a heart-filled button that removes it
// (the whole card is draggable to reorder - see SortableFavoriteListCard, which wraps this).
export const FavoriteListCard = ({ favorite, isPending, onRemove }: FavoriteListCardProps) => {
  return (
    <div className='group flex flex-col gap-2'>
      <GameThumbnail appId={favorite.appId} name={favorite.name} />
      <div className='flex items-center justify-between gap-2'>
        <Typography
          className='min-w-0 transition-colors duration-150 group-hover:text-foreground'
          color='muted'
          title={favorite.name}
          truncate
          type='body-sm'
          weight='semibold'
        >
          {favorite.name}
        </Typography>
        <Button
          isIconOnly
          aria-label={`Remove ${favorite.name} from favorites`}
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
