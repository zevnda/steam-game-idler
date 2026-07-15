import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { AutoIdleEntry } from '../types'
import { useState } from 'react'
import { AutoIdleListCard } from './AutoIdleListCard'
import { SortableAutoIdleListCard } from './SortableAutoIdleListCard'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'

interface AutoIdleListGridProps {
  games: AutoIdleEntry[]
  pendingAppIds: Set<number>
  onToggleEnabled: (appId: number, enabled: boolean) => void
  onRemove: (appId: number) => void
  onReorder: (newOrder: AutoIdleEntry[]) => void
}

// Mirrors FavoritesListGrid.tsx's DndContext/SortableContext/useSortable/arrayMove shape exactly.
export const AutoIdleListGrid = ({
  games,
  pendingAppIds,
  onToggleEnabled,
  onRemove,
  onReorder,
}: AutoIdleListGridProps) => {
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeItem = games.find(item => item.appId === activeId) ?? null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = games.findIndex(item => item.appId === active.id)
      const newIndex = games.findIndex(item => item.appId === over.id)
      onReorder(arrayMove(games, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={games.map(item => item.appId)}>
        <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
          {games.map(game => (
            <SortableAutoIdleListCard
              key={game.appId}
              game={game}
              isDragging={activeId === game.appId}
              isPending={pendingAppIds.has(game.appId)}
              onRemove={() => onRemove(game.appId)}
              onToggleEnabled={() => onToggleEnabled(game.appId, !game.enabled)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <AutoIdleListCard
            game={activeItem}
            isPending={false}
            onRemove={() => {}}
            onToggleEnabled={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
