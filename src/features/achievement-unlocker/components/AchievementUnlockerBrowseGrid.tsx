import type { OwnedGame } from '@/features/games-list/types'
import { AchievementUnlockerGameCard } from './AchievementUnlockerGameCard'
import { VirtualizedGameGrid } from '@/shared/components/VirtualizedGameGrid'
import { useSelectableGames } from '@/shared/hooks/useSelectableGames'

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
  const selectableGames = useSelectableGames(games)

  return (
    <VirtualizedGameGrid
      games={games}
      renderCard={game => (
        <AchievementUnlockerGameCard
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          isQueued={queuedAppIds.has(game.appId)}
          orderedGames={selectableGames}
          onToggle={() => onToggle(game)}
        />
      )}
    />
  )
}
