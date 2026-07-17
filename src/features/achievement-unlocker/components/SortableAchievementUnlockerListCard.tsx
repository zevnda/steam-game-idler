import type { SelectableGame } from '@/shared/hooks/useCardSelection'
import type { AchievementUnlockerEntry } from '../types'
import { AchievementUnlockerListCard } from './AchievementUnlockerListCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableAchievementUnlockerListCardProps {
  game: AchievementUnlockerEntry
  isDragging: boolean
  isPending?: boolean
  onRemove: () => void
  onEditOrder: () => void
  orderedGames?: SelectableGame[]
}

export const SortableAchievementUnlockerListCard = ({
  game,
  isDragging,
  isPending,
  onRemove,
  onEditOrder,
  orderedGames,
}: SortableAchievementUnlockerListCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: game.appId,
  })

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'cursor-grab opacity-0' : 'cursor-grab'}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <AchievementUnlockerListCard
        game={game}
        isPending={isPending}
        orderedGames={orderedGames}
        onEditOrder={onEditOrder}
        onRemove={onRemove}
      />
    </div>
  )
}
