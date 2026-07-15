import type { CardFarmingQueueEntry } from '../types'
import { CardFarmingListCard } from './CardFarmingListCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableCardFarmingQueueCardProps {
  game: CardFarmingQueueEntry
  isDragging: boolean
  isPending?: boolean
  onRemove: () => void
}

export const SortableCardFarmingQueueCard = ({
  game,
  isDragging,
  isPending,
  onRemove,
}: SortableCardFarmingQueueCardProps) => {
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
      <CardFarmingListCard game={game} isPending={isPending} onRemove={onRemove} />
    </div>
  )
}
