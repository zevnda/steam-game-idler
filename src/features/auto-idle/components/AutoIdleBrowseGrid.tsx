import type { OwnedGame } from '@/features/games-list/types'
import { AutoIdleGameCard } from './AutoIdleGameCard'
import { VirtualizedGameGrid } from '@/shared/components/VirtualizedGameGrid'
import { useSelectableGames } from '@/shared/hooks/useSelectableGames'

interface AutoIdleBrowseGridProps {
  games: OwnedGame[]
  queuedAppIds: Set<number>
  pendingAppIds: Set<number>
  onToggle: (game: OwnedGame) => void
}

export const AutoIdleBrowseGrid = ({
  games,
  queuedAppIds,
  pendingAppIds,
  onToggle,
}: AutoIdleBrowseGridProps) => {
  const selectableGames = useSelectableGames(games)

  return (
    <VirtualizedGameGrid
      games={games}
      renderCard={game => (
        <AutoIdleGameCard
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
