import type { OwnedGame } from '@/features/games-list/types'
import { AchievementUnlockerGameCard } from './AchievementUnlockerGameCard'
import { VirtualizedGameGrid } from '@/shared/components/VirtualizedGameGrid'

interface AchievementUnlockerBrowseGridProps {
  games: OwnedGame[]
  queuedAppIds: Set<number>
  pendingAppIds: Set<number>
  onToggle: (game: OwnedGame) => void
}

export const AchievementUnlockerBrowseGrid = ({
  games,
  queuedAppIds,
  pendingAppIds,
  onToggle,
}: AchievementUnlockerBrowseGridProps) => {
  return (
    <VirtualizedGameGrid
      games={games}
      renderCard={game => (
        <AchievementUnlockerGameCard
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          isQueued={queuedAppIds.has(game.appId)}
          onToggle={() => onToggle(game)}
        />
      )}
    />
  )
}
