import type { OwnedGame } from '@/features/games-list/types'
import { FavoriteGameCard } from './FavoriteGameCard'
import { VirtualizedGameGrid } from '@/shared/components/VirtualizedGameGrid'
import { useSelectableGames } from '@/shared/hooks/useSelectableGames'

interface FavoritesBrowseGridProps {
  games: OwnedGame[]
  favoritedAppIds: Set<number>
  pendingAppIds: Set<number>
  onToggle: (game: OwnedGame) => void
}

export const FavoritesBrowseGrid = ({
  games,
  favoritedAppIds,
  pendingAppIds,
  onToggle,
}: FavoritesBrowseGridProps) => {
  const selectableGames = useSelectableGames(games)

  return (
    <VirtualizedGameGrid
      games={games}
      renderCard={game => (
        <FavoriteGameCard
          game={game}
          isFavorited={favoritedAppIds.has(game.appId)}
          isPending={pendingAppIds.has(game.appId)}
          orderedGames={selectableGames}
          onToggle={() => onToggle(game)}
        />
      )}
    />
  )
}
