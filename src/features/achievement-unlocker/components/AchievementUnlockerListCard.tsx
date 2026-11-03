import type { AchievementUnlockerEntry } from '../types'
import { TbArrowsSort, TbX } from 'react-icons/tb'
import { GamePosterAction, GamePosterCard } from '@/shared/components/GamePosterCard'

interface AchievementUnlockerListCardProps {
  game: AchievementUnlockerEntry
  isPending?: boolean
  onRemove: () => void
  onEditOrder: () => void
}

// Used in the "Queue" tab - an "edit order" button (opens the per-game
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
    <GamePosterCard
      actions={
        <>
          <GamePosterAction aria-label={`Edit unlock order for ${game.name}`} onPress={onEditOrder}>
            <TbArrowsSort fontSize={16} />
          </GamePosterAction>
          <GamePosterAction
            aria-label={`Remove ${game.name}`}
            isPending={isPending}
            onPress={onRemove}
          >
            <TbX fontSize={16} />
          </GamePosterAction>
        </>
      }
      appId={game.appId}
      name={game.name}
    />
  )
}
