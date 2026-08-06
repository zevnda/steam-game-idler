import type { GameWithDrops } from '../types'
import { CardFarmingBrowseCard } from './CardFarmingBrowseCard'

interface CardFarmingBrowseGridProps {
  games: GameWithDrops[]
  whitelistedAppIds: Set<number>
  pendingAppIds: Set<number>
  pendingBlacklistAppIds: Set<number>
  onToggleWhitelist: (game: GameWithDrops) => void
  onBlacklist: (game: GameWithDrops) => void
}

// Plain CSS grid, not `VirtualizedGameGrid` (which is hard-typed to `OwnedGame[]`) - "games with
// drops remaining" is inherently a bounded subset of the owned-games library, consistent with this
// repo's existing "skip virtualizing genuinely bounded lists" convention (see
// AchievementUnlockerListGrid's identical choice for the same reason).
export const CardFarmingBrowseGrid = ({
  games,
  whitelistedAppIds,
  pendingAppIds,
  pendingBlacklistAppIds,
  onToggleWhitelist,
  onBlacklist,
}: CardFarmingBrowseGridProps) => {
  return (
    <div className='grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
      {games.map(game => (
        <CardFarmingBrowseCard
          key={game.appId}
          game={game}
          isBlacklistPending={pendingBlacklistAppIds.has(game.appId)}
          isPending={pendingAppIds.has(game.appId)}
          isWhitelisted={whitelistedAppIds.has(game.appId)}
          onBlacklist={() => onBlacklist(game)}
          onToggleWhitelist={() => onToggleWhitelist(game)}
        />
      ))}
    </div>
  )
}
