import type { CardFarmingBlacklistEntry, GameWithDrops } from '../types'
import { CardFarmingBlacklistCard } from './CardFarmingBlacklistCard'

interface CardFarmingBlacklistGridProps {
  blacklist: CardFarmingBlacklistEntry[]
  pendingAppIds: Set<number>
  dropsByAppId: Map<number, GameWithDrops>
  onRemove: (appId: number) => void
}

// Plain CSS grid, not `VirtualizedGameGrid`/`@dnd-kit` sortable - a bounded, unordered list, same
// reasoning as `CardFarmingBrowseGrid`'s identical choice.
export const CardFarmingBlacklistGrid = ({
  blacklist,
  pendingAppIds,
  dropsByAppId,
  onRemove,
}: CardFarmingBlacklistGridProps) => {
  return (
    <div className='game-grid page-content'>
      {blacklist.map(game => (
        <CardFarmingBlacklistCard
          key={game.appId}
          drops={dropsByAppId.get(game.appId)}
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          onRemove={() => onRemove(game.appId)}
        />
      ))}
    </div>
  )
}
