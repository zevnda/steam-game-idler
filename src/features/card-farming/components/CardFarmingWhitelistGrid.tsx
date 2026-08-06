import type { CardFarmingWhitelistEntry } from '../types'
import { CardFarmingWhitelistCard } from './CardFarmingWhitelistCard'

interface CardFarmingWhitelistGridProps {
  whitelist: CardFarmingWhitelistEntry[]
  pendingAppIds: Set<number>
  onRemove: (appId: number) => void
}

// Plain CSS grid, not `VirtualizedGameGrid`/`@dnd-kit` sortable - a bounded, unordered list, same
// reasoning as `CardFarmingBlacklistGrid`'s identical choice.
export const CardFarmingWhitelistGrid = ({
  whitelist,
  pendingAppIds,
  onRemove,
}: CardFarmingWhitelistGridProps) => {
  return (
    <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
      {whitelist.map(game => (
        <CardFarmingWhitelistCard
          key={game.appId}
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          onRemove={() => onRemove(game.appId)}
        />
      ))}
    </div>
  )
}
