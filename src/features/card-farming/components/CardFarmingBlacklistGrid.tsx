import type { CardFarmingBlacklistEntry } from '../types'
import { CardFarmingBlacklistCard } from './CardFarmingBlacklistCard'

interface CardFarmingBlacklistGridProps {
  blacklist: CardFarmingBlacklistEntry[]
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
}

// Plain CSS grid, not `VirtualizedGameGrid`/`@dnd-kit` sortable - a bounded, unordered list, same
// reasoning as `CardFarmingBrowseGrid`'s identical choice.
export const CardFarmingBlacklistGrid = ({
  blacklist,
  pendingAppIds,
  onRemove,
}: CardFarmingBlacklistGridProps) => {
  return (
    <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
      {blacklist.map(game => (
        <CardFarmingBlacklistCard
          key={game.appId}
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          onRemove={() => onRemove(game.appId)}
        />
      ))}
    </div>
  )
}
