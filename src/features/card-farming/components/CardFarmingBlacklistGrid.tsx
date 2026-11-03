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
    <div className='game-grid p-6'>
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
