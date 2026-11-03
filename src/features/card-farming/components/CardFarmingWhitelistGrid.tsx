import type { CardFarmingWhitelistEntry, GameWithDrops } from '../types'
import { CardFarmingWhitelistCard } from './CardFarmingWhitelistCard'

interface CardFarmingWhitelistGridProps {
  whitelist: CardFarmingWhitelistEntry[]
  pendingAppIds: Set<number>
  dropsByAppId: Map<number, GameWithDrops>
  onRemove: (appId: number) => void
}

// Plain CSS grid, not `VirtualizedGameGrid`/`@dnd-kit` sortable - a bounded, unordered list, same
// reasoning as `CardFarmingBlacklistGrid`'s identical choice.
export const CardFarmingWhitelistGrid = ({
  whitelist,
  pendingAppIds,
  dropsByAppId,
  onRemove,
}: CardFarmingWhitelistGridProps) => {
  return (
    <div className='game-grid page-content'>
      {whitelist.map(game => (
        <CardFarmingWhitelistCard
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
