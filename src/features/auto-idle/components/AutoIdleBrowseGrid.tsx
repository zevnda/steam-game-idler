import type { OwnedGame } from '@/features/games-list/types'
import { AutoIdleGameCard } from './AutoIdleGameCard'
import { VirtualizedGameGrid } from '@/shared/components/VirtualizedGameGrid'

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
  return (
    <VirtualizedGameGrid
      games={games}
      renderCard={game => (
        <AutoIdleGameCard
          game={game}
          isPending={pendingAppIds.has(game.appId)}
          isQueued={queuedAppIds.has(game.appId)}
          onToggle={() => onToggle(game)}
        />
      )}
    />
  )
}
