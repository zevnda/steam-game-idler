import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { CardFarmingQueueEntry } from '../types'
import { useState } from 'react'
import { CardFarmingListCard } from './CardFarmingListCard'
import { SortableCardFarmingQueueCard } from './SortableCardFarmingQueueCard'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'

interface CardFarmingQueueGridProps {
  queue: CardFarmingQueueEntry[]
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
  onReorder: (newOrder: CardFarmingQueueEntry[]) => void
}

// Mirrors AchievementUnlockerListGrid exactly - same dnd-kit shape for the same reason (a
// per-account ordered list of app ids reordered by dragging whole cards).
export const CardFarmingListGrid = ({
  queue,
  pendingAppIds,
  onRemove,
  onReorder,
}: CardFarmingQueueGridProps) => {
  const [activeId, setActiveId] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeItem = queue.find(item => item.appId === activeId) ?? null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(item => item.appId === active.id)
      const newIndex = queue.findIndex(item => item.appId === over.id)
      onReorder(arrayMove(queue, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <SortableContext items={queue.map(item => item.appId)}>
        <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
          {queue.map(game => (
            <SortableCardFarmingQueueCard
              key={game.appId}
              game={game}
              isDragging={activeId === game.appId}
              isPending={pendingAppIds.has(game.appId)}
              onRemove={() => onRemove(game.appId)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem ? <CardFarmingListCard game={activeItem} onRemove={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
