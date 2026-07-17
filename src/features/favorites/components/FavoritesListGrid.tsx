import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { FavoriteEntry } from '../types'
import { useState } from 'react'
import { FavoriteListCard } from './FavoriteListCard'
import { SortableFavoriteListCard } from './SortableFavoriteListCard'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { useSelectableGames } from '@/shared/hooks/useSelectableGames'

interface FavoritesListGridProps {
  favorites: FavoriteEntry[]
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
  onReorder: (newOrder: FavoriteEntry[]) => void
}

// First `@dnd-kit` consumer in this rewrite - the packages are already dependencies (carried over
// from the reference app's package.json) but nothing in src/ used them until now. Ports the
// DndContext/SortableContext/useSortable/arrayMove pattern from the reference app's CustomList
// (not the surrounding god-component it lived in) into this scoped component.
export const FavoritesListGrid = ({
  favorites,
  pendingAppIds,
  onRemove,
  onReorder,
}: FavoritesListGridProps) => {
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeItem = favorites.find(item => item.appId === activeId) ?? null
  const selectableGames = useSelectableGames(favorites)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = favorites.findIndex(item => item.appId === active.id)
      const newIndex = favorites.findIndex(item => item.appId === over.id)
      onReorder(arrayMove(favorites, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={favorites.map(item => item.appId)}>
        <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
          {favorites.map(favorite => (
            <SortableFavoriteListCard
              key={favorite.appId}
              favorite={favorite}
              isDragging={activeId === favorite.appId}
              isPending={pendingAppIds.has(favorite.appId)}
              orderedGames={selectableGames}
              onRemove={() => onRemove(favorite.appId)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? <FavoriteListCard favorite={activeItem} onRemove={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
