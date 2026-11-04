import type { FavoriteEntry } from '../types'
import { TbX } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface FavoriteListCardProps {
  favorite: FavoriteEntry
  isPending?: boolean
  onRemove: () => void
}

// Used in the "Favorites" tab - a single action that removes the game (the whole card is draggable to reorder - see SortableFavoriteListCard, which wraps this).
export const FavoriteListCard = ({ favorite, isPending, onRemove }: FavoriteListCardProps) => {
  return (
    <GamePosterCard
      showStats
      actions={
        <GamePosterAction
          aria-label={`Remove ${favorite.name} from favorites`}
          isPending={isPending}
          onPress={onRemove}
        >
          <TbX fontSize={16} />
        </GamePosterAction>
      }
      appId={favorite.appId}
      name={favorite.name}
    />
  )
}
