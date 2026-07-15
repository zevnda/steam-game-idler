import type { FavoriteEntry } from '../types'
import { FavoriteListCard } from './FavoriteListCard'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableFavoriteListCardProps {
  favorite: FavoriteEntry
  isDragging: boolean
  isPending?: boolean
  onRemove: () => void
}

export const SortableFavoriteListCard = ({
  favorite,
  isDragging,
  isPending,
  onRemove,
}: SortableFavoriteListCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: favorite.appId,
  })

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'cursor-grab opacity-0' : 'cursor-grab'}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <FavoriteListCard favorite={favorite} isPending={isPending} onRemove={onRemove} />
    </div>
  )
}
