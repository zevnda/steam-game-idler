import type { AutoIdleEntry } from '../types'
import { AutoIdleListCard } from './AutoIdleListCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableAutoIdleListCardProps {
  game: AutoIdleEntry
  isDragging: boolean
  isPending: boolean
  onToggleEnabled: () => void
  onRemove: () => void
}

export const SortableAutoIdleListCard = ({
  game,
  isDragging,
  isPending,
  onToggleEnabled,
  onRemove,
}: SortableAutoIdleListCardProps) => {
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
      <AutoIdleListCard
        game={game}
        isPending={isPending}
        onRemove={onRemove}
        onToggleEnabled={onToggleEnabled}
      />
    </div>
  )
}
